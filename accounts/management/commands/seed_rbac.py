from django.core.management.base import BaseCommand

from accounts.models import Permiso, Rol, RolePermission


PERMISSIONS = (
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'purchases.view',
    'purchases.create',
    'purchases.update',
    'purchases.delete',
    'sales.view',
    'sales.create',
    'sales.update',
    'sales.delete',
    'cash.view',
    'cash.create',
    'cash.update',
    'cash.delete',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'audit.view',
    'dashboard.view',
)


ROLE_PERMISSIONS = {
    'system_admin': PERMISSIONS,
    'tenant_admin': PERMISSIONS,
    'manager': (
        'products.view',
        'products.create',
        'products.update',
        'inventory.view',
        'inventory.create',
        'inventory.update',
        'purchases.view',
        'purchases.create',
        'purchases.update',
        'sales.view',
        'sales.create',
        'sales.update',
        'cash.view',
        'cash.create',
        'cash.update',
        'audit.view',
        'dashboard.view',
    ),
    'operator': (
        'products.view',
        'inventory.view',
        'sales.view',
        'sales.create',
        'cash.view',
        'dashboard.view',
    ),
    'viewer': (
        'products.view',
        'inventory.view',
        'purchases.view',
        'sales.view',
        'cash.view',
        'dashboard.view',
    ),
}


class Command(BaseCommand):
    help = 'Crea roles, permisos y asignaciones RBAC iniciales de AxisFood.'

    def handle(self, *args, **options):
        permisos = {}
        for code in PERMISSIONS:
            permiso, _ = Permiso.objects.update_or_create(
                codigo=code,
                defaults={
                    'nombre': code,
                    'descripcion': f'Permiso {code}',
                },
            )
            permisos[code] = permiso

        for role_code, permission_codes in ROLE_PERMISSIONS.items():
            rol, _ = Rol.objects.update_or_create(
                codigo=role_code,
                defaults={
                    'nombre': role_code,
                    'descripcion': f'Rol {role_code}',
                },
            )
            for permission_code in permission_codes:
                RolePermission.objects.get_or_create(
                    rol=rol,
                    permiso=permisos[permission_code],
                )

        self.stdout.write(self.style.SUCCESS('RBAC inicial creado/actualizado.'))
