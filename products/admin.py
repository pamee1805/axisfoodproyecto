from django.contrib import admin

from .models import Categoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tenant', 'estado', 'created_at')
    list_filter = ('estado', 'tenant')
    search_fields = ('nombre', 'descripcion', 'tenant__nombre')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tenant', 'categoria', 'precio', 'costo', 'estado')
    list_filter = ('estado', 'tenant', 'categoria')
    search_fields = ('nombre', 'descripcion', 'tenant__nombre', 'categoria__nombre')
    readonly_fields = ('created_at', 'updated_at')
