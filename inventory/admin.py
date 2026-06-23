from django.contrib import admin

from .models import InventarioMovimiento


@admin.register(InventarioMovimiento)
class InventarioMovimientoAdmin(admin.ModelAdmin):
    list_display = (
        'fecha',
        'tenant',
        'sucursal',
        'producto',
        'tipo_movimiento',
        'cantidad',
        'costo_total',
        'usuario',
    )
    list_filter = ('tipo_movimiento', 'tenant', 'sucursal', 'producto')
    search_fields = (
        'producto__nombre',
        'sucursal__nombre',
        'tenant__nombre',
        'usuario__username',
        'motivo',
    )
    readonly_fields = ('tenant', 'usuario', 'fecha')
