from rest_framework import serializers

from .models import AuditLog


ACTION_LABELS = {
    'creacion': 'Creación',
    'modificacion': 'Modificación',
    'eliminacion': 'Eliminación',
    'apertura_caja': 'Apertura de caja',
    'cierre_caja': 'Cierre de caja',
    'creacion_movimiento_caja': 'Movimiento de caja',
    'asignacion_rol_usuario': 'Asignación de rol',
    'modificacion_rol_usuario': 'Modificación de rol',
    'eliminacion_rol_usuario': 'Eliminación de rol',
    'asignacion_permiso_rol': 'Asignación de permiso',
    'modificacion_permiso_rol': 'Modificación de permiso',
    'eliminacion_permiso_rol': 'Eliminación de permiso',
}


class AuditLogSerializer(serializers.ModelSerializer):
    tenant_nombre = serializers.CharField(source='tenant.nombre', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    accion_label = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id',
            'tenant',
            'tenant_nombre',
            'usuario',
            'usuario_username',
            'accion',
            'accion_label',
            'recurso',
            'recurso_id',
            'datos_anteriores',
            'datos_nuevos',
            'ip',
            'user_agent',
            'fecha',
        )
        read_only_fields = fields

    def get_accion_label(self, obj):
        return ACTION_LABELS.get(obj.accion, obj.accion)
