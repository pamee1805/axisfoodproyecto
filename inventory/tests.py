from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.models import Usuario
from products.models import Producto
from tenants.models import Sucursal, Tenant

from .models import InventarioMovimiento
from .serializers import InventarioMovimientoSerializer


class InventoryHardeningTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa A',
            razon_social='Empresa A SA',
            cuit='40-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Empresa B',
            razon_social='Empresa B SA',
            cuit='40-00000002-2',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.otra_sucursal = Sucursal.objects.create(
            tenant=self.otro_tenant,
            nombre='Central',
        )
        self.user = Usuario.objects.create_user(
            username='inventario',
            password='test',
            tenant=self.tenant,
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
        request = APIRequestFactory().post('/api/inventario/')
        request.user = self.user
        self.context = {'request': request}

    def test_rechaza_producto_de_otro_tenant(self):
        serializer = InventarioMovimientoSerializer(
            data=self._movimiento_data(producto=self.otro_producto.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('producto', serializer.errors)

    def test_rechaza_sucursal_de_otro_tenant(self):
        serializer = InventarioMovimientoSerializer(
            data=self._movimiento_data(sucursal=self.otra_sucursal.id),
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('sucursal', serializer.errors)

    def test_permite_cantidad_negativa_solo_en_ajuste(self):
        serializer = InventarioMovimientoSerializer(
            data=self._movimiento_data(
                tipo_movimiento=InventarioMovimiento.TipoMovimiento.AJUSTE,
                cantidad='-1.000',
            ),
            context=self.context,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def _movimiento_data(self, producto=None, sucursal=None, tipo_movimiento=None, cantidad='1.000'):
        return {
            'sucursal': sucursal or self.sucursal.id,
            'producto': producto or self.producto.id,
            'tipo_movimiento': tipo_movimiento or InventarioMovimiento.TipoMovimiento.ENTRADA,
            'cantidad': cantidad,
            'costo_unitario': '50.00',
            'motivo': 'Test',
        }
