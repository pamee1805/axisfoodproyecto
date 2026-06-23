from django.contrib import admin

from .models import Cliente, Pago, Pedido, PedidoItem


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'tenant', 'telefono', 'email', 'created_at')
    list_filter = ('tenant',)
    search_fields = ('nombre', 'apellido', 'telefono', 'email', 'direccion')
    readonly_fields = ('created_at', 'updated_at')


class PedidoItemInline(admin.TabularInline):
    model = PedidoItem
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    inlines = (PedidoItemInline,)
    list_display = (
        'id',
        'tenant',
        'cliente',
        'canal',
        'estado',
        'total',
        'fecha',
    )
    list_filter = ('estado', 'canal', 'tenant', 'sucursal', 'fecha')
    search_fields = ('cliente__nombre', 'cliente__apellido', 'cliente__telefono')
    readonly_fields = ('tenant', 'created_by', 'subtotal', 'total', 'created_at', 'updated_at')
    date_hierarchy = 'fecha'


@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'producto', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('pedido__tenant', 'producto')
    search_fields = ('pedido__cliente__nombre', 'producto__nombre')
    readonly_fields = ('subtotal',)


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tenant',
        'pedido',
        'monto',
        'metodo_pago',
        'estado',
        'fecha',
    )
    list_filter = ('estado', 'metodo_pago', 'tenant', 'fecha')
    search_fields = ('pedido__cliente__nombre', 'pedido__cliente__telefono')
    readonly_fields = ('tenant', 'created_at')
    date_hierarchy = 'fecha'
