from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tenants.models import Sucursal, Tenant

from .models import Permiso, Rol, RolePermission, UserRole, Usuario


class AccountsRBACAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Uno',
            razon_social='Empresa Uno SA',
            cuit='70-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Empresa Dos',
            razon_social='Empresa Dos SA',
            cuit='70-00000002-2',
        )
        self.sucursal = Sucursal.objects.create(
            tenant=self.tenant,
            nombre='Casa Central',
        )
        self.admin_user = Usuario.objects.create_user(
            username='admin_tenant',
            password='testpass123',
            tenant=self.tenant,
            sucursal_principal=self.sucursal,
        )
        self.user_sin_permiso = Usuario.objects.create_user(
            username='sin_permiso',
            password='testpass123',
            tenant=self.tenant,
        )
        self.usuario_tenant = Usuario.objects.create_user(
            username='usuario_tenant',
            password='testpass123',
            tenant=self.tenant,
        )
        self.usuario_otro_tenant = Usuario.objects.create_user(
            username='usuario_otro_tenant',
            password='testpass123',
            tenant=self.otro_tenant,
        )
        self.rol_gestion = Rol.objects.create(
            codigo='gestion_usuarios_test',
            nombre='Gestion usuarios test',
        )
        self.rol_asignable = Rol.objects.create(
            codigo='rol_asignable_test',
            nombre='Rol asignable test',
        )
        for codigo in ('users.view', 'users.create', 'users.update', 'users.delete'):
            permiso = Permiso.objects.create(codigo=codigo, nombre=codigo)
            RolePermission.objects.create(rol=self.rol_gestion, permiso=permiso)
        UserRole.objects.create(usuario=self.admin_user, rol=self.rol_gestion)

    def authenticate_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_usuario_sin_permiso_recibe_403(self):
        self.client.force_authenticate(user=self.user_sin_permiso)

        response = self.client.get(reverse('usuario-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_con_users_view_lista_usuarios_de_su_tenant(self):
        self.authenticate_admin()

        response = self.client.get(reverse('usuario-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {item['username'] for item in response.data}
        self.assertIn('admin_tenant', usernames)
        self.assertIn('usuario_tenant', usernames)

    def test_usuario_no_ve_usuarios_de_otro_tenant(self):
        self.authenticate_admin()

        response = self.client.get(reverse('usuario-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {item['username'] for item in response.data}
        self.assertNotIn('usuario_otro_tenant', usernames)

    def test_crear_usuario_asigna_tenant_automaticamente(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse('usuario-list'),
            {
                'username': 'nuevo_usuario',
                'password': 'testpass123',
                'email': 'nuevo@example.com',
                'first_name': 'Nuevo',
                'last_name': 'Usuario',
                'telefono': '',
                'estado': 'activo',
                'sucursal_principal': self.sucursal.id,
                'is_active': True,
                'is_staff': False,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = Usuario.objects.get(username='nuevo_usuario')
        self.assertEqual(user.tenant, self.tenant)

    def test_no_se_devuelve_password(self):
        self.authenticate_admin()

        response = self.client.get(reverse('usuario-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('password', response.data[0])

    def test_asignar_rol_a_usuario_del_mismo_tenant_funciona(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse('user-role-list'),
            {
                'usuario': self.usuario_tenant.id,
                'rol': self.rol_asignable.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            UserRole.objects.filter(
                usuario=self.usuario_tenant,
                rol=self.rol_asignable,
            ).exists()
        )

    def test_asignar_rol_a_usuario_de_otro_tenant_falla(self):
        self.authenticate_admin()

        response = self.client.post(
            reverse('user-role-list'),
            {
                'usuario': self.usuario_otro_tenant.id,
                'rol': self.rol_asignable.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('usuario', response.data)
