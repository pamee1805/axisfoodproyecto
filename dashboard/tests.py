from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Permiso, Rol, RolePermission, UserRole, Usuario
from tenants.models import Tenant


class DashboardPermissionsTests(TestCase):
    url = '/api/dashboard/resumen/'

    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(
            nombre='Empresa A',
            razon_social='Empresa A SA',
            cuit='60-00000001-1',
        )
        self.permiso = Permiso.objects.create(
            codigo='dashboard.view',
            nombre='dashboard.view',
        )
        self.rol = Rol.objects.create(codigo='viewer', nombre='Viewer')
        RolePermission.objects.create(rol=self.rol, permiso=self.permiso)

    def test_usuario_sin_tenant_recibe_error_claro(self):
        user = Usuario.objects.create_user(username='sin_tenant', password='test')
        UserRole.objects.create(usuario=user, rol=self.rol)
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_usuario_sin_permiso_dashboard_recibe_forbidden(self):
        user = Usuario.objects.create_user(
            username='sin_permiso',
            password='test',
            tenant=self.tenant,
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_con_permiso_dashboard_recibe_resumen(self):
        user = Usuario.objects.create_user(
            username='con_permiso',
            password='test',
            tenant=self.tenant,
        )
        UserRole.objects.create(usuario=user, rol=self.rol)
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('ventas_hoy', response.data)
        self.assertIn('resumen', response.data)
