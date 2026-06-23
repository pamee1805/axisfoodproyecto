from rest_framework.routers import DefaultRouter

from .views import (
    PermisoViewSet,
    RolViewSet,
    RolePermissionViewSet,
    UserRoleViewSet,
    UsuarioViewSet,
)


router = DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuario')
router.register('roles', RolViewSet, basename='rol')
router.register('permisos', PermisoViewSet, basename='permiso')
router.register('user-roles', UserRoleViewSet, basename='user-role')
router.register('role-permissions', RolePermissionViewSet, basename='role-permission')

urlpatterns = router.urls
