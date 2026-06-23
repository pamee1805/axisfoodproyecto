from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.test import APIClient

from accounts.models import Usuario
from inventory.models import InventarioMovimiento
from products.models import Producto
from tenants.models import Sucursal, Tenant

from .models import Compra, CompraItem, Proveedor
from .serializers import CompraSerializer


class PurchasesHardeningTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa A',
            razon_social='Empresa A SA',
            cuit='30-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Empresa B',
            razon_social='Empresa B SA',
            cuit='30-00000002-2',
        )
        self.user = Usuario.objects.create_user(
            username='compras',
            password='test',
            tenant=self.tenant,
        )
        self.proveedor = Proveedor.objects.create(
            tenant=self.tenant,
            nombre='Proveedor A',
        )
        self.otro_proveedor = Proveedor.objects.create(
            tenant=self.otro_tenant,
            nombre='Proveedor B',
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
        request = APIRequestFactory().post('/api/ordenes-compra/')
        request.user = self.user
        self.context = {'request': request}

    def test_rechaza_proveedor_de_otro_tenant(self):
        serializer = CompraSerializer(
            data=self._compra_data(proveedor=self.otro_proveedor.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('proveedor', serializer.errors)

    def test_rechaza_producto_de_otro_tenant(self):
        serializer = CompraSerializer(
            data=self._compra_data(producto=self.otro_producto.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def _compra_data(self, proveedor=None, producto=None):
        return {
            'proveedor': proveedor or self.proveedor.id,
            'estado': 'pendiente',
            'items': [
                {
                    'producto': producto or self.producto.id,
                    'cantidad': '1.000',
                    'costo_unitario': '50.00',
                }
            ],
        }


class CompraInventarioIntegrationTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Compras',
            razon_social='Empresa Compras SA',
            cuit='30-00000003-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.user = Usuario.objects.create_user(
            username='compras-stock',
            password='test',
            tenant=self.tenant,
            sucursal_principal=self.sucursal,
            is_superuser=True,
        )
        self.proveedor = Proveedor.objects.create(
            tenant=self.tenant,
            nombre='Proveedor A',
        )
        self.producto = Producto.objects.create(
            tenant=self.tenant,
            nombre='Harina',
            precio=Decimal('100.00'),
            costo=Decimal('50.00'),
        )
        self.otro_producto = Producto.objects.create(
            tenant=self.tenant,
            nombre='Queso',
            precio=Decimal('200.00'),
            costo=Decimal('120.00'),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_aprobada_a_recibida_genera_stock(self):
        compra = self._crear_compra(estado=Compra.Estado.APROBADA)

        response = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        entrada = InventarioMovimiento.objects.get(
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
        )
        self.assertEqual(entrada.producto, self.producto)
        self.assertEqual(entrada.cantidad, Decimal('2.000'))
        self.assertEqual(entrada.costo_total, Decimal('100.00000'))

    def test_recibida_no_duplica_stock_y_no_permite_reabrir_flujo(self):
        compra = self._crear_compra(estado=Compra.Estado.APROBADA)

        primera = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )
        segunda = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )
        reabrir = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.APROBADA},
            format='json',
        )
        tercera = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )

        self.assertEqual(primera.status_code, 200, primera.data)
        self.assertEqual(segunda.status_code, 200, segunda.data)
        self.assertEqual(reabrir.status_code, 400)
        self.assertIn('Transición inválida para Compra', str(reabrir.data['estado']))
        self.assertEqual(tercera.status_code, 200, tercera.data)
        self.assertEqual(
            InventarioMovimiento.objects.filter(
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
                motivo=f'Entrada automática por compra #{compra.id}',
            ).count(),
            1,
        )

    def test_pendiente_a_recibida_es_transicion_invalida(self):
        compra = self._crear_compra(estado=Compra.Estado.PENDIENTE)

        response = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Transición inválida para Compra', str(response.data['estado']))
        self.assertFalse(InventarioMovimiento.objects.exists())

    def test_compra_recibida_no_permite_editar_items(self):
        compra = self._crear_compra(estado=Compra.Estado.RECIBIDA)

        response = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {
                'items': [
                    {
                        'producto': self.otro_producto.id,
                        'cantidad': '1.000',
                        'costo_unitario': '120.00',
                    }
                ]
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data['detail'],
            'No se pueden modificar productos de una compra ya recibida.',
        )

    def test_movimientos_respetan_tenant_y_usuario(self):
        compra = self._crear_compra(estado=Compra.Estado.APROBADA)

        response = self.client.patch(
            f'/api/ordenes-compra/{compra.id}/',
            {'estado': Compra.Estado.RECIBIDA},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        entrada = InventarioMovimiento.objects.get(
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
        )
        self.assertEqual(entrada.tenant, self.tenant)
        self.assertEqual(entrada.sucursal, self.sucursal)
        self.assertEqual(entrada.usuario, self.user)
        self.assertEqual(entrada.motivo, f'Entrada automática por compra #{compra.id}')

    def _crear_compra(self, estado):
        compra = Compra.objects.create(
            tenant=self.tenant,
            proveedor=self.proveedor,
            usuario=self.user,
            estado=estado,
            total=Decimal('100.00'),
        )
        CompraItem.objects.create(
            compra=compra,
            producto=self.producto,
            cantidad=Decimal('2.000'),
            costo_unitario=Decimal('50.00'),
            subtotal=Decimal('100.00'),
        )
        return compra
