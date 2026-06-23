from django.contrib import admin

from .models import Sucursal, Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'razon_social', 'cuit', 'estado')
    list_filter = ('estado',)
    search_fields = ('nombre', 'razon_social', 'cuit', 'email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tenant', 'estado', 'telefono', 'created_at')
    list_filter = ('estado', 'tenant')
    search_fields = ('nombre', 'tenant__nombre', 'direccion', 'telefono')
    readonly_fields = ('created_at', 'updated_at')
