from rest_framework.permissions import BasePermission

from .models import Permiso, RolePermission, UserRole, Usuario


ACTION_PERMISSION_SUFFIX = {
    'list': 'view',
    'retrieve': 'view',
    'create': 'create',
    'update': 'update',
    'partial_update': 'update',
    'destroy': 'delete',
}


def get_user_roles(user):
    if not getattr(user, 'is_authenticated', False):
        return set()
    if getattr(user, 'is_superuser', False):
        return set(UserRole.objects.values_list('rol__codigo', flat=True).distinct())
    return set(
        UserRole.objects.filter(usuario=user)
        .values_list('rol__codigo', flat=True)
        .distinct()
    )


def get_user_permissions(user):
    if not getattr(user, 'is_authenticated', False):
        return set()
    if getattr(user, 'is_superuser', False):
        return set(Permiso.objects.values_list('codigo', flat=True))

    role_ids = UserRole.objects.filter(usuario=user).values_list('rol_id', flat=True)
    return set(
        RolePermission.objects.filter(rol_id__in=role_ids)
        .values_list('permiso__codigo', flat=True)
        .distinct()
    )


def user_has_role(user, role_code):
    if getattr(user, 'is_superuser', False):
        return True
    return role_code in get_user_roles(user)


def user_has_permission(user, permission_code):
    if getattr(user, 'is_superuser', False):
        return True
    return permission_code in get_user_permissions(user)


class HasAxisFoodPermission(BasePermission):
    message = 'No tenes permiso para realizar esta accion.'

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        if not getattr(user, 'is_active', False):
            return False
        if getattr(user, 'estado', None) == Usuario.Estado.SUSPENDIDO:
            return False
        if getattr(user, 'is_superuser', False):
            return True

        required_permission = self._get_required_permission(view)
        if required_permission is None:
            return False

        return user_has_permission(user, required_permission)

    def _get_required_permission(self, view):
        action = getattr(view, 'action', None)
        required_permissions = getattr(view, 'required_permissions', None)
        if required_permissions and action in required_permissions:
            return required_permissions[action]
        return getattr(view, 'required_permission', None)
