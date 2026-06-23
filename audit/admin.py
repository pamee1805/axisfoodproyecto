from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'tenant', 'usuario', 'accion', 'recurso', 'recurso_id')
    list_filter = ('accion', 'recurso', 'tenant')
    search_fields = ('accion', 'recurso', 'recurso_id', 'usuario__username')
    readonly_fields = (
        'tenant',
        'usuario',
        'accion',
        'recurso',
        'recurso_id',
        'datos_anteriores',
        'datos_nuevos',
        'ip',
        'user_agent',
        'fecha',
    )

    def has_add_permission(self, request):
        return False
