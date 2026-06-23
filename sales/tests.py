from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.test import APIClient

from accounts.models import Usuario
from audit.models import AuditLog
from cash.models import CajaMovimiento, CajaSession
from inventory.models import InventarioMovimiento
from products.models import Producto
from tenants.models import Sucursal, Tenant

from .models import Cliente, Pago, Pedido, PedidoItem
from .serializers import PagoSerializer, PedidoSerializer


class SalesHardeningTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa A',
            razon_social='Empresa A SA',
            cuit='20-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Empresa B',
            razon_social='Empresa B SA',
            cuit='20-00000002-2',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.otra_sucursal = Sucursal.objects.create(
            tenant=self.otro_tenant,
            nombre='Central',
        )
        self.user = Usuario.objects.create_user(
            username='ventas',
            password='test',
            tenant=self.tenant,
        )
        self.cliente = Cliente.objects.create(tenant=self.tenant, nombre='Ana')
        self.otro_cliente = Cliente.objects.create(
            tenant=self.otro_tenant,
            nombre='Bruno',
        )
        self.producto = Producto.objects.create(
            tenant=self.tenant,
            nombre='Producto A',
            precio=Decimal('100.00'),
            costo=Decimal('50.00'),
        )
        self.otro_producto = Producto.objects.create(
            tenant=self.otro_tenant,
            nombre='Producto B',
            precio=Decimal('100.00'),
            costo=Decimal('50.00'),
        )
        request = APIRequestFactory().post('/api/pedidos/')
        request.user = self.user
        self.context = {'request': request}

    def test_rechaza_cliente_de_otro_tenant(self):
        serializer = PedidoSerializer(
            data=self._pedido_data(cliente=self.otro_cliente.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('cliente', serializer.errors)

    def test_rechaza_producto_de_otro_tenant(self):
        serializer = PedidoSerializer(
            data=self._pedido_data(producto=self.otro_producto.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_rechaza_pago_de_pedido_de_otro_tenant(self):
        otro_pedido = Pedido.objects.create(
            tenant=self.otro_tenant,
            sucursal=self.otra_sucursal,
            cliente=self.otro_cliente,
            canal=Pedido.Canal.MOSTRADOR,
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            created_by=self.user,
        )
        serializer = PagoSerializer(
            data={
                'pedido': otro_pedido.id,
                'monto': '100.00',
                'metodo_pago': 'efectivo',
                'estado': 'aprobado',
            },
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('pedido', serializer.errors)

    def _pedido_data(self, cliente=None, producto=None):
        return {
            'sucursal': self.sucursal.id,
            'cliente': cliente or self.cliente.id,
            'canal': Pedido.Canal.MOSTRADOR,
            'estado': Pedido.Estado.PENDIENTE,
            'descuento': '0.00',
            'items': [
                {
                    'producto': producto or self.producto.id,
                    'cantidad': '1.000',
                    'precio_unitario': '100.00',
                }
            ],
        }


class PedidoInventarioIntegrationTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Stock',
            razon_social='Empresa Stock SA',
            cuit='30-00000001-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.otra_sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Norte')
        self.user = Usuario.objects.create_user(
            username='stock-sales',
            password='test',
            tenant=self.tenant,
            is_superuser=True,
        )
        self.cliente = Cliente.objects.create(tenant=self.tenant, nombre='Ana')
        self.producto = Producto.objects.create(
            tenant=self.tenant,
            nombre='Milanesa',
            precio=Decimal('100.00'),
            costo=Decimal('50.00'),
        )
        self.otro_producto = Producto.objects.create(
            tenant=self.tenant,
            nombre='Empanada',
            precio=Decimal('80.00'),
            costo=Decimal('35.00'),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_en_camino_a_entregado_descuenta_stock(self):
        pedido = self._crear_pedido(cantidad=Decimal('2.000'))
        pedido.estado = Pedido.Estado.EN_CAMINO
        pedido.save(update_fields=['estado'])
        self._crear_entrada(cantidad=Decimal('5.000'))

        response = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.ENTREGADO},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            InventarioMovimiento.objects.filter(
                producto=self.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
            ).count(),
            1,
        )
        self.assertEqual(self._stock_actual(), Decimal('3.000'))

    def test_pendiente_a_entregado_es_transicion_invalida(self):
        pedido = self._crear_pedido()

        response = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.ENTREGADO},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Transición inválida para Pedido', str(response.data['estado']))

    def test_entregado_a_finalizado_no_descuenta_dos_veces(self):
        pedido = self._crear_pedido(cantidad=Decimal('1.000'))
        pedido.estado = Pedido.Estado.EN_CAMINO
        pedido.save(update_fields=['estado'])
        self._crear_entrada(cantidad=Decimal('4.000'))

        entregado = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.ENTREGADO},
            format='json',
        )
        finalizado = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.FINALIZADO},
            format='json',
        )

        self.assertEqual(entregado.status_code, 200, entregado.data)
        self.assertEqual(finalizado.status_code, 200, finalizado.data)
        self.assertEqual(
            InventarioMovimiento.objects.filter(
                producto=self.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
            ).count(),
            1,
        )
        self.assertEqual(self._stock_actual(), Decimal('3.000'))

    def test_stock_insuficiente_devuelve_400(self):
        pedido = self._crear_pedido(cantidad=Decimal('3.000'))
        pedido.estado = Pedido.Estado.EN_CAMINO
        pedido.save(update_fields=['estado'])
        self._crear_entrada(cantidad=Decimal('1.000'))

        response = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.ENTREGADO},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['detail'],
            'Stock insuficiente para Milanesa. Disponible: 1.000, requerido: 3.000.',
        )
        self.assertFalse(
            InventarioMovimiento.objects.filter(
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
            ).exists()
        )

    def test_pedido_cerrado_no_permite_cambiar_items_o_sucursal(self):
        pedido = self._crear_pedido(estado=Pedido.Estado.ENTREGADO)

        response_items = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {
                'items': [
                    {
                        'producto': self.otro_producto.id,
                        'cantidad': '1.000',
                        'precio_unitario': '80.00',
                    }
                ]
            },
            format='json',
        )
        response_sucursal = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'sucursal': self.otra_sucursal.id},
            format='json',
        )

        mensaje = (
            'No se pueden modificar productos o sucursal de un pedido ya '
            'entregado o finalizado.'
        )
        self.assertEqual(response_items.status_code, 400)
        self.assertEqual(response_items.data['detail'], mensaje)
        self.assertEqual(response_sucursal.status_code, 400)
        self.assertEqual(response_sucursal.data['detail'], mensaje)

    def test_salida_creada_respeta_tenant_sucursal_usuario(self):
        pedido = self._crear_pedido(cantidad=Decimal('2.000'))
        pedido.estado = Pedido.Estado.EN_CAMINO
        pedido.save(update_fields=['estado'])
        self._crear_entrada(cantidad=Decimal('5.000'))

        response = self.client.patch(
            f'/api/pedidos/{pedido.id}/',
            {'estado': Pedido.Estado.ENTREGADO},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        salida = InventarioMovimiento.objects.get(
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
        )
        self.assertEqual(salida.tenant, self.tenant)
        self.assertEqual(salida.sucursal, self.sucursal)
        self.assertEqual(salida.usuario, self.user)
        self.assertEqual(salida.costo_unitario, self.producto.costo)
        self.assertEqual(salida.motivo, f'Salida automática por pedido #{pedido.id}')

    def _crear_pedido(self, cantidad=Decimal('1.000'), estado=Pedido.Estado.PENDIENTE):
        pedido = Pedido.objects.create(
            tenant=self.tenant,
            sucursal=self.sucursal,
            cliente=self.cliente,
            canal=Pedido.Canal.MOSTRADOR,
            estado=estado,
            subtotal=cantidad * self.producto.precio,
            total=cantidad * self.producto.precio,
            created_by=self.user,
        )
        PedidoItem.objects.create(
            pedido=pedido,
            producto=self.producto,
            cantidad=cantidad,
            precio_unitario=self.producto.precio,
            subtotal=cantidad * self.producto.precio,
        )
        return pedido

    def _crear_entrada(self, cantidad):
        return InventarioMovimiento.objects.create(
            tenant=self.tenant,
            sucursal=self.sucursal,
            producto=self.producto,
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
            cantidad=cantidad,
            costo_unitario=self.producto.costo,
            costo_total=cantidad * self.producto.costo,
            motivo='Stock inicial',
            usuario=self.user,
        )

    def _stock_actual(self):
        entradas = sum(
            InventarioMovimiento.objects.filter(
                producto=self.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
            ).values_list('cantidad', flat=True),
            Decimal('0.000'),
        )
        salidas = sum(
            InventarioMovimiento.objects.filter(
                producto=self.producto,
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
            ).values_list('cantidad', flat=True),
            Decimal('0.000'),
        )
        return entradas - salidas


class PagoCajaIntegrationTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Caja',
            razon_social='Empresa Caja SA',
            cuit='30-00000004-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.otra_sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Norte')
        self.user = Usuario.objects.create_user(
            username='cajero',
            password='test',
            tenant=self.tenant,
            sucursal_principal=self.sucursal,
            is_superuser=True,
        )
        self.cliente = Cliente.objects.create(tenant=self.tenant, nombre='Ana')
        self.pedido = Pedido.objects.create(
            tenant=self.tenant,
            sucursal=self.sucursal,
            cliente=self.cliente,
            canal=Pedido.Canal.MOSTRADOR,
            subtotal=Decimal('150.00'),
            total=Decimal('150.00'),
            created_by=self.user,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_pendiente_a_aprobado_con_caja_abierta_genera_ingreso(self):
        pago = self._crear_pago()
        caja = self._abrir_caja()

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        movimiento = CajaMovimiento.objects.get()
        self.assertEqual(movimiento.caja_session, caja)
        self.assertEqual(movimiento.tipo, CajaMovimiento.Tipo.INGRESO)
        self.assertEqual(movimiento.monto, pago.monto)
        self.assertEqual(movimiento.descripcion, f'Ingreso automático por pago #{pago.id}')

    def test_sin_caja_abierta_devuelve_400_y_no_aprueba_pago(self):
        pago = self._crear_pago()

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        pago.refresh_from_db()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['detail'],
            'No existe una caja abierta para registrar el ingreso del pago.',
        )
        self.assertEqual(pago.estado, Pago.Estado.PENDIENTE)
        self.assertFalse(CajaMovimiento.objects.exists())

    def test_varias_cajas_abiertas_devuelve_400(self):
        pago = self._crear_pago()
        self._abrir_caja()
        self._abrir_caja(saldo_inicial=Decimal('200.00'))

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['detail'],
            (
                'Existe más de una caja abierta para la sucursal y usuario. '
                'No se puede registrar el ingreso automáticamente.'
            ),
        )
        self.assertFalse(CajaMovimiento.objects.exists())

    def test_aprobado_a_aprobado_no_duplica(self):
        pago = self._crear_pago()
        self._abrir_caja()

        primera = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )
        segunda = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(primera.status_code, 200, primera.data)
        self.assertEqual(segunda.status_code, 200, segunda.data)
        self.assertEqual(CajaMovimiento.objects.count(), 1)

    def test_aprobado_reintegrado_aprobado_es_invalido_y_no_duplica(self):
        pago = self._crear_pago()
        self._abrir_caja()

        primera = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )
        reintegrado = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.REINTEGRADO},
            format='json',
        )
        segunda = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(primera.status_code, 200, primera.data)
        self.assertEqual(reintegrado.status_code, 200, reintegrado.data)
        self.assertEqual(segunda.status_code, 400)
        self.assertIn('Transición inválida para Pago', str(segunda.data['estado']))
        self.assertEqual(CajaMovimiento.objects.count(), 1)

    def test_rechazado_a_aprobado_es_transicion_invalida(self):
        pago = self._crear_pago(estado=Pago.Estado.RECHAZADO)
        self._abrir_caja()

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Transición inválida para Pago', str(response.data['estado']))
        self.assertFalse(CajaMovimiento.objects.exists())

    def test_movimiento_respeta_tenant_caja_usuario_monto_y_tipo(self):
        pago = self._crear_pago(monto=Decimal('75.50'))
        caja = self._abrir_caja()

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        movimiento = CajaMovimiento.objects.get()
        self.assertEqual(movimiento.tenant, self.tenant)
        self.assertEqual(movimiento.caja_session, caja)
        self.assertEqual(movimiento.usuario, self.user)
        self.assertEqual(movimiento.monto, Decimal('75.50'))
        self.assertEqual(movimiento.tipo, CajaMovimiento.Tipo.INGRESO)

    def test_usa_sucursal_del_pedido(self):
        pago = self._crear_pago()
        self._abrir_caja(sucursal=self.otra_sucursal)

        response_sin_caja_correcta = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response_sin_caja_correcta.status_code, 400)
        self.assertFalse(CajaMovimiento.objects.exists())

    def test_auditoria_registra_movimiento_automatico(self):
        pago = self._crear_pago()
        self._abrir_caja()

        response = self.client.patch(
            f'/api/pagos/{pago.id}/',
            {'estado': Pago.Estado.APROBADO},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        movimiento = CajaMovimiento.objects.get()
        self.assertTrue(
            AuditLog.objects.filter(
                tenant=self.tenant,
                usuario=self.user,
                accion='creacion_movimiento_caja',
                recurso='CajaMovimiento',
                recurso_id=str(movimiento.id),
            ).exists()
        )

    def _crear_pago(self, monto=Decimal('150.00'), estado=Pago.Estado.PENDIENTE):
        return Pago.objects.create(
            tenant=self.tenant,
            pedido=self.pedido,
            monto=monto,
            metodo_pago=Pago.MetodoPago.EFECTIVO,
            estado=estado,
        )

    def _abrir_caja(
        self,
        sucursal=None,
        usuario=None,
        saldo_inicial=Decimal('100.00'),
    ):
        return CajaSession.objects.create(
            tenant=self.tenant,
            sucursal=sucursal or self.sucursal,
            usuario=usuario or self.user,
            saldo_inicial=saldo_inicial,
        )
