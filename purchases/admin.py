from django.contrib import admin

from .models import Compra, CompraItem, Proveedor


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tenant', 'telefono', 'email', 'estado', 'created_at')
    list_filter = ('estado', 'tenant')
    search_fields = ('nombre', 'telefono', 'email', 'direccion', 'tenant__nombre')
    readonly_fields = ('created_at', 'updated_at')


class CompraItemInline(admin.TabularInline):
    model = CompraItem
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    inlines = (CompraItemInline,)
    list_display = ('id', 'tenant', 'proveedor', 'usuario', 'estado', 'total', 'fecha')
    list_filter = ('estado', 'tenant', 'proveedor', 'fecha')
    search_fields = ('proveedor__nombre', 'usuario__username', 'tenant__nombre')
    readonly_fields = ('tenant', 'usuario', 'total', 'created_at', 'updated_at')
    date_hierarchy = 'fecha'


@admin.register(CompraItem)
class CompraItemAdmin(admin.ModelAdmin):
    list_display = ('compra', 'producto', 'cantidad', 'costo_unitario', 'subtotal')
    list_filter = ('compra__tenant', 'producto')
    search_fields = ('compra__proveedor__nombre', 'producto__nombre')
    readonly_fields = ('subtotal',)
