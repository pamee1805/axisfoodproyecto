from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Permiso, Rol, RolePermission, UserRole, Usuario
from tenants.models import Sucursal, Tenant

from .models import Categoria, Producto


class ProductosAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Tenant Uno',
            razon_social='Tenant Uno SA',
            cuit='20111111112',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Tenant Dos',
            razon_social='Tenant Dos SA',
            cuit='20222222223',
        )
        self.sucursal = Sucursal.objects.create(
            tenant=self.tenant,
            nombre='Principal',
        )
        self.user = Usuario.objects.create_user(
            username='manager',
            password='testpass123',
            tenant=self.tenant,
            sucursal_principal=self.sucursal,
        )
        self.rol = Rol.objects.create(
            codigo='manager_test',
            nombre='Manager test',
        )
        for codigo in ('products.view', 'products.create'):
            permiso = Permiso.objects.create(
                codigo=codigo,
                nombre=codigo,
            )
            RolePermission.objects.create(rol=self.rol, permiso=permiso)
        UserRole.objects.create(usuario=self.user, rol=self.rol)
        self.client.force_authenticate(self.user)

    def test_crea_categoria_asignando_tenant_del_usuario(self):
        response = self.client.post(
            reverse('categoria-list'),
            {
                'nombre': 'Bebidas',
                'descripcion': 'Bebidas frias',
                'estado': 'activo',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        categoria = Categoria.objects.get(nombre='Bebidas')
        self.assertEqual(categoria.tenant, self.tenant)

    def test_lista_productos_solo_del_tenant_del_usuario(self):
        categoria = Categoria.objects.create(tenant=self.tenant, nombre='Comidas')
        otra_categoria = Categoria.objects.create(
            tenant=self.otro_tenant,
            nombre='Comidas',
        )
        Producto.objects.create(
            tenant=self.tenant,
            categoria=categoria,
            nombre='Pizza',
            precio='1000.00',
            costo='500.00',
        )
        Producto.objects.create(
            tenant=self.otro_tenant,
            categoria=otra_categoria,
            nombre='Empanada',
            precio='100.00',
            costo='50.00',
        )

        response = self.client.get(reverse('producto-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [item['nombre'] for item in response.data]
        self.assertEqual(nombres, ['Pizza'])

    def test_no_permite_producto_con_categoria_de_otro_tenant(self):
        categoria = Categoria.objects.create(tenant=self.otro_tenant, nombre='Externa')

        response = self.client.post(
            reverse('producto-list'),
            {
                'categoria': categoria.id,
                'nombre': 'Producto invalido',
                'precio': '100.00',
                'costo': '50.00',
                'stock_minimo': '0',
                'stock_maximo': '0',
                'punto_reposicion': '0',
                'estado': 'activo',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
