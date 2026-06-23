from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework_simplejwt.views import TokenObtainPairView

from audit.models import AuditLog

from .models import Permiso, Rol, RolePermission, UserRole, Usuario
from .permissions import HasAxisFoodPermission
from .serializers import (
    LoginSerializer,
    PermisoSerializer,
    RolSerializer,
    RolePermissionSerializer,
    UserRoleSerializer,
    UsuarioAdminSerializer,
    UsuarioMeSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioMeSerializer(request.user)
        return Response(serializer.data)


class AuditMixin:
    audit_resource = None

    def audit(self, accion, instance, datos_anteriores=None, datos_nuevos=None):
        tenant = getattr(instance, 'tenant', None)
        if tenant is None and isinstance(instance, UserRole):
            tenant = instance.usuario.tenant

        AuditLog.objects.create(
            tenant=tenant,
            usuario=self.request.user,
            accion=accion,
            recurso=self.audit_resource or instance.__class__.__name__,
            recurso_id=str(instance.pk),
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class AxisFoodPermissionViewSet(viewsets.ModelViewSet):
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'users.view',
        'retrieve': 'users.view',
        'create': 'users.update',
        'update': 'users.update',
        'partial_update': 'users.update',
        'destroy': 'users.update',
    }


class UsuarioViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = UsuarioAdminSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'users.view',
        'retrieve': 'users.view',
        'create': 'users.create',
        'update': 'users.update',
        'partial_update': 'users.update',
        'destroy': 'users.delete',
    }
    audit_resource = 'Usuario'

    def get_queryset(self):
        queryset = Usuario.objects.select_related(
            'tenant',
            'sucursal_principal',
        ).prefetch_related('user_roles__rol').order_by('username')

        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        instance = serializer.save()
        self.audit('creacion', instance, None, UsuarioAdminSerializer(instance).data)

    def perform_update(self, serializer):
        previous = UsuarioAdminSerializer(serializer.instance).data
        instance = serializer.save()
        self.audit('modificacion', instance, previous, UsuarioAdminSerializer(instance).data)

    def perform_destroy(self, instance):
        previous = UsuarioAdminSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()


class RolViewSet(AxisFoodPermissionViewSet):
    queryset = Rol.objects.all().order_by('codigo')
    serializer_class = RolSerializer


class PermisoViewSet(AxisFoodPermissionViewSet):
    queryset = Permiso.objects.all().order_by('codigo')
    serializer_class = PermisoSerializer


class UserRoleViewSet(AuditMixin, AxisFoodPermissionViewSet):
    serializer_class = UserRoleSerializer
    audit_resource = 'UserRole'

    def get_queryset(self):
        queryset = UserRole.objects.select_related('usuario', 'rol').order_by(
            'usuario__username',
            'rol__codigo',
        )

        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(usuario__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        instance = serializer.save()
        self.audit('asignacion_rol_usuario', instance, None, UserRoleSerializer(instance).data)

    def perform_update(self, serializer):
        previous = UserRoleSerializer(serializer.instance).data
        instance = serializer.save()
        self.audit('modificacion_rol_usuario', instance, previous, UserRoleSerializer(instance).data)

    def perform_destroy(self, instance):
        previous = UserRoleSerializer(instance).data
        self.audit('eliminacion_rol_usuario', instance, previous, None)
        instance.delete()


class RolePermissionViewSet(AuditMixin, AxisFoodPermissionViewSet):
    # RolePermission es global porque Rol y Permiso son globales en el modelo actual.
    queryset = RolePermission.objects.select_related('rol', 'permiso').order_by(
        'rol__codigo',
        'permiso__codigo',
    )
    serializer_class = RolePermissionSerializer
    audit_resource = 'RolePermission'

    def perform_create(self, serializer):
        instance = serializer.save()
        self.audit(
            'asignacion_permiso_rol',
            instance,
            None,
            RolePermissionSerializer(instance).data,
        )

    def perform_update(self, serializer):
        previous = RolePermissionSerializer(serializer.instance).data
        instance = serializer.save()
        self.audit(
            'modificacion_permiso_rol',
            instance,
            previous,
            RolePermissionSerializer(instance).data,
        )

    def perform_destroy(self, instance):
        previous = RolePermissionSerializer(instance).data
        self.audit('eliminacion_permiso_rol', instance, previous, None)
        instance.delete()
