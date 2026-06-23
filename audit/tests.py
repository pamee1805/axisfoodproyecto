from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Permiso, Rol, RolePermission, UserRole, Usuario
from tenants.models import Tenant

from .models import AuditLog


class AuditLogAPITests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Tenant Uno',
            razon_social='Tenant Uno SA',
            cuit='30-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Tenant Dos',
            razon_social='Tenant Dos SA',
            cuit='30-00000002-2',
        )
        self.user = Usuario.objects.create_user(
            username='auditor',
            password='testpass123',
            tenant=self.tenant,
        )
        self.user_sin_permiso = Usuario.objects.create_user(
            username='operador',
            password='testpass123',
            tenant=self.tenant,
        )
        self.superuser = Usuario.objects.create_superuser(
            username='root',
            password='testpass123',
        )
        self.rol = Rol.objects.create(
            codigo='auditor_test',
            nombre='Auditor test',
        )
        self.permiso = Permiso.objects.create(
            codigo='audit.view',
            nombre='audit.view',
        )
        RolePermission.objects.create(rol=self.rol, permiso=self.permiso)
        UserRole.objects.create(usuario=self.user, rol=self.rol)

        self.log_producto = AuditLog.objects.create(
            tenant=self.tenant,
            usuario=self.user,
            accion='creacion',
            recurso='Producto',
            recurso_id='1',
            datos_nuevos={'nombre': 'Pizza'},
        )
        self.log_compra = AuditLog.objects.create(
            tenant=self.tenant,
            usuario=self.user,
            accion='modificacion',
            recurso='Compra',
            recurso_id='2',
            datos_anteriores={'estado': 'pendiente'},
            datos_nuevos={'estado': 'aprobada'},
        )
        self.log_otro_tenant = AuditLog.objects.create(
            tenant=self.otro_tenant,
            usuario=None,
            accion='eliminacion',
            recurso='Producto',
            recurso_id='3',
        )

    def test_usuario_sin_audit_view_recibe_403(self):
        self.client.force_authenticate(user=self.user_sin_permiso)

        response = self.client.get(reverse('auditoria-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_con_audit_view_lista_logs_de_su_tenant(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('auditoria-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertIn(self.log_producto.id, ids)
        self.assertIn(self.log_compra.id, ids)

    def test_usuario_no_ve_logs_de_otro_tenant(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('auditoria-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertNotIn(self.log_otro_tenant.id, ids)

    def test_superuser_ve_todos_los_logs(self):
        self.client.force_authenticate(user=self.superuser)

        response = self.client.get(reverse('auditoria-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertIn(self.log_producto.id, ids)
        self.assertIn(self.log_otro_tenant.id, ids)

    def test_post_no_permitido(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('auditoria-list'),
            {
                'accion': 'creacion',
                'recurso': 'Producto',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_filtro_por_accion_funciona(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('auditoria-list'), {'accion': 'creacion'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.log_producto.id)
        self.assertEqual(response.data[0]['accion_label'], 'Creación')

    def test_filtro_por_recurso_funciona(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('auditoria-list'), {'recurso': 'Compra'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.log_compra.id)
