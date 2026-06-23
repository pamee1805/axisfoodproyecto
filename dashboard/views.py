from decimal import Decimal

from django.db.models import Case, DecimalField, F, Sum, Value, When
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import HasAxisFoodPermission
from cash.models import CajaSession
from inventory.models import InventarioMovimiento
from products.models import Producto
from purchases.models import Compra
from sales.models import Cliente, Pago, Pedido


class DashboardResumenView(APIView):
    permission_classes = [HasAxisFoodPermission]
    required_permission = 'dashboard.view'

    def get(self, request):
        tenant = getattr(request.user, 'tenant', None)
        if tenant is None:
            return Response(
                {'detail': 'El usuario autenticado debe tener una empresa asociada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hoy = timezone.localdate()

        ventas_hoy = self._calcular_ventas_hoy(tenant, hoy)
        caja_abierta = self._obtener_caja_abierta(tenant)

        response_data = {
            'ventas_hoy': self._decimal_to_string(ventas_hoy),
            'pedidos_pendientes': Pedido.objects.filter(
                tenant=tenant,
                estado__in=[Pedido.Estado.PENDIENTE, Pedido.Estado.EN_PREPARACION],
            ).count(),
            'caja_abierta': caja_abierta,
            'productos_stock_bajo': self._obtener_productos_stock_bajo(tenant),
            'ultimos_movimientos_inventario': self._obtener_ultimos_movimientos(tenant),
            'resumen': {
                'total_productos_activos': Producto.objects.filter(
                    tenant=tenant,
                    estado=Producto.Estado.ACTIVO,
                ).count(),
                'total_clientes': Cliente.objects.filter(tenant=tenant).count(),
                'total_pedidos_hoy': Pedido.objects.filter(
                    tenant=tenant,
                    fecha__date=hoy,
                ).count(),
                'total_ordenes_compra_pendientes': Compra.objects.filter(
                    tenant=tenant,
                    estado=Compra.Estado.PENDIENTE,
                ).count(),
            },
        }
        return Response(response_data)

    def _calcular_ventas_hoy(self, tenant, hoy):
        money_field = DecimalField(max_digits=12, decimal_places=2)
        return Pago.objects.filter(
            tenant=tenant,
            estado=Pago.Estado.APROBADO,
            fecha__date=hoy,
        ).aggregate(
            total=Coalesce(
                Sum('monto'),
                Value(Decimal('0.00')),
                output_field=money_field,
            )
        )['total']

    def _obtener_caja_abierta(self, tenant):
        caja = (
            CajaSession.objects.select_related('sucursal', 'usuario')
            .filter(tenant=tenant, estado=CajaSession.Estado.ABIERTA)
            .order_by('-fecha_apertura')
            .first()
        )

        if caja is None:
            return {
                'existe': False,
                'sucursal': None,
                'usuario': None,
                'saldo_inicial': None,
            }

        return {
            'existe': True,
            'sucursal': str(caja.sucursal),
            'usuario': caja.usuario.get_username(),
            'saldo_inicial': self._decimal_to_string(caja.saldo_inicial),
        }

    def _obtener_productos_stock_bajo(self, tenant):
        decimal_field = DecimalField(max_digits=12, decimal_places=3)
        movimientos_por_producto = (
            InventarioMovimiento.objects.filter(tenant=tenant)
            .values('producto_id')
            .annotate(
                stock_actual=Coalesce(
                    Sum(
                        Case(
                            When(
                                tipo_movimiento__in=[
                                    InventarioMovimiento.TipoMovimiento.ENTRADA,
                                    InventarioMovimiento.TipoMovimiento.AJUSTE,
                                    InventarioMovimiento.TipoMovimiento.DEVOLUCION,
                                ],
                                then=F('cantidad'),
                            ),
                            When(
                                tipo_movimiento__in=[
                                    InventarioMovimiento.TipoMovimiento.SALIDA,
                                    InventarioMovimiento.TipoMovimiento.MERMA,
                                    InventarioMovimiento.TipoMovimiento.DESPERDICIO,
                                    InventarioMovimiento.TipoMovimiento.VENCIMIENTO,
                                ],
                                then=-F('cantidad'),
                            ),
                            default=Value(Decimal('0.000')),
                            output_field=decimal_field,
                        )
                    ),
                    Value(Decimal('0.000')),
                    output_field=decimal_field,
                )
            )
        )
        stock_por_producto = {
            row['producto_id']: row['stock_actual']
            for row in movimientos_por_producto
        }

        productos = Producto.objects.filter(
            tenant=tenant,
            estado=Producto.Estado.ACTIVO,
        ).only('id', 'nombre', 'punto_reposicion')

        productos_stock_bajo = []
        for producto in productos:
            stock_actual = stock_por_producto.get(producto.id, Decimal('0.000'))
            if stock_actual <= producto.punto_reposicion:
                productos_stock_bajo.append(
                    {
                        'id': producto.id,
                        'nombre': producto.nombre,
                        'stock_actual': self._decimal_to_string(stock_actual),
                        'punto_reposicion': self._decimal_to_string(
                            producto.punto_reposicion
                        ),
                    }
                )

        return productos_stock_bajo

    def _obtener_ultimos_movimientos(self, tenant):
        movimientos = (
            InventarioMovimiento.objects.select_related('producto')
            .filter(tenant=tenant)
            .order_by('-fecha')[:5]
        )

        return [
            {
                'id': movimiento.id,
                'producto': movimiento.producto.nombre,
                'tipo_movimiento': movimiento.tipo_movimiento,
                'cantidad': self._decimal_to_string(movimiento.cantidad),
                'fecha': movimiento.fecha.isoformat(),
            }
            for movimiento in movimientos
        ]

    def _decimal_to_string(self, value):
        if value is None:
            return None
        return str(value)
