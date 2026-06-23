from decimal import Decimal

from django.db.models import Case, DecimalField, F, Sum, Value, When
from django.db.models.functions import Coalesce
from rest_framework import serializers

from .models import InventarioMovimiento


TIPOS_SUMAN_STOCK = [
    InventarioMovimiento.TipoMovimiento.ENTRADA,
    InventarioMovimiento.TipoMovimiento.AJUSTE,
    InventarioMovimiento.TipoMovimiento.DEVOLUCION,
]

TIPOS_RESTAN_STOCK = [
    InventarioMovimiento.TipoMovimiento.SALIDA,
    InventarioMovimiento.TipoMovimiento.MERMA,
    InventarioMovimiento.TipoMovimiento.DESPERDICIO,
    InventarioMovimiento.TipoMovimiento.VENCIMIENTO,
]


def calcular_stock_por_producto(tenant, sucursal, producto_ids):
    decimal_field = DecimalField(max_digits=12, decimal_places=3)
    stock_por_producto = {
        producto_id: Decimal('0.000')
        for producto_id in producto_ids
    }

    movimientos = (
        InventarioMovimiento.objects.filter(
            tenant=tenant,
            sucursal=sucursal,
            producto_id__in=producto_ids,
        )
        .values('producto_id')
        .annotate(
            stock_actual=Coalesce(
                Sum(
                    Case(
                        When(tipo_movimiento__in=TIPOS_SUMAN_STOCK, then=F('cantidad')),
                        When(tipo_movimiento__in=TIPOS_RESTAN_STOCK, then=-F('cantidad')),
                        default=Value(Decimal('0.000')),
                        output_field=decimal_field,
                    )
                ),
                Value(Decimal('0.000')),
                output_field=decimal_field,
            )
        )
    )

    for movimiento in movimientos:
        stock_por_producto[movimiento['producto_id']] = movimiento['stock_actual']

    return stock_por_producto


def validar_stock_suficiente(tenant, sucursal, requeridos_por_producto, productos_por_id):
    stock_por_producto = calcular_stock_por_producto(
        tenant=tenant,
        sucursal=sucursal,
        producto_ids=requeridos_por_producto.keys(),
    )

    for producto_id, requerido in requeridos_por_producto.items():
        disponible = stock_por_producto.get(producto_id, Decimal('0.000'))
        if disponible < requerido:
            producto = productos_por_id[producto_id]
            raise serializers.ValidationError(
                {
                    'detail': (
                        f'Stock insuficiente para {producto.nombre}. '
                        f'Disponible: {disponible}, requerido: {requerido}.'
                    )
                }
            )


def crear_salidas_por_pedido(pedido, usuario):
    movimientos = []
    for item in pedido.items.select_related('producto').all():
        movimientos.append(
            InventarioMovimiento(
                tenant=pedido.tenant,
                sucursal=pedido.sucursal,
                producto=item.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
                cantidad=item.cantidad,
                costo_unitario=item.producto.costo,
                costo_total=item.cantidad * item.producto.costo,
                motivo=f'Salida automática por pedido #{pedido.id}',
                usuario=usuario,
            )
        )

    return InventarioMovimiento.objects.bulk_create(movimientos)


def crear_entradas_por_compra(compra, sucursal, usuario, items=None):
    items = items if items is not None else compra.items.select_related('producto').all()
    movimientos = []

    for item in items:
        movimientos.append(
            InventarioMovimiento(
                tenant=compra.tenant,
                sucursal=sucursal,
                producto=item.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
                cantidad=item.cantidad,
                costo_unitario=item.costo_unitario,
                costo_total=item.cantidad * item.costo_unitario,
                motivo=f'Entrada automática por compra #{compra.id}',
                usuario=usuario,
            )
        )

    return InventarioMovimiento.objects.bulk_create(movimientos)
