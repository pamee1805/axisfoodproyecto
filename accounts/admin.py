from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Permiso, Rol, RolePermission, UserRole, Usuario


class UserRoleInline(admin.TabularInline):
    model = UserRole
    extra = 0


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    inlines = (UserRoleInline,)
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'tenant',
        'sucursal_principal',
        'estado',
        'is_staff',
    )
    list_filter = ('estado', 'tenant', 'sucursal_principal', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'telefono')
    fieldsets = UserAdmin.fieldsets + (
        (
            'AxisFood',
            {
                'fields': (
                    'tenant',
                    'sucursal_principal',
                    'telefono',
                    'estado',
                    'ultimo_acceso',
                ),
            },
        ),
    )
    readonly_fields = ('last_login', 'date_joined')


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'created_at')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('created_at',)


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre')
    search_fields = ('codigo', 'nombre', 'descripcion')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'rol')
    list_filter = ('rol',)
    search_fields = ('usuario__username', 'usuario__email', 'rol__nombre')


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('rol', 'permiso')
    list_filter = ('rol',)
    search_fields = ('rol__nombre', 'permiso__codigo', 'permiso__nombre')
