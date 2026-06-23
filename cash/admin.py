from django.contrib import admin

from .models import CajaMovimiento, CajaSession


class CajaMovimientoInline(admin.TabularInline):
    model = CajaMovimiento
    extra = 0
    readonly_fields = ('tenant', 'usuario', 'fecha')


@admin.register(CajaSession)
class CajaSessionAdmin(admin.ModelAdmin):
    inlines = (CajaMovimientoInline,)
    list_display = (
        'sucursal',
        'usuario',
        'estado',
        'saldo_inicial',
        'saldo_final',
        'fecha_apertura',
        'fecha_cierre',
    )
    list_filter = ('estado', 'tenant', 'sucursal', 'fecha_apertura')
    search_fields = ('sucursal__nombre', 'usuario__username', 'tenant__nombre')
    readonly_fields = ('tenant', 'usuario', 'fecha_apertura')
    date_hierarchy = 'fecha_apertura'


@admin.register(CajaMovimiento)
class CajaMovimientoAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'caja_session', 'tipo', 'monto', 'usuario', 'fecha')
    list_filter = ('tipo', 'tenant', 'fecha')
    search_fields = (
        'caja_session__sucursal__nombre',
        'usuario__username',
        'descripcion',
        'tenant__nombre',
    )
    readonly_fields = ('tenant', 'usuario', 'fecha')
    date_hierarchy = 'fecha'
