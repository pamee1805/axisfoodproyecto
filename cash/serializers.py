from django.utils import timezone
from rest_framework import serializers

from .models import CajaMovimiento, CajaSession
from .services import calcular_resumen_caja, validar_caja_abierta_para_movimiento


class CajaSessionSerializer(serializers.ModelSerializer):
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    resumen_conciliacion = serializers.SerializerMethodField()

    class Meta:
        model = CajaSession
        fields = (
            'id',
            'tenant',
            'sucursal',
            'sucursal_nombre',
            'usuario',
            'usuario_username',
            'fecha_apertura',
            'fecha_cierre',
            'saldo_inicial',
            'saldo_final',
            'estado',
            'resumen_conciliacion',
        )
        read_only_fields = (
            'id',
            'tenant',
            'usuario',
            'usuario_username',
            'sucursal_nombre',
            'fecha_apertura',
            'resumen_conciliacion',
        )

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )

        sucursal = attrs.get('sucursal', getattr(self.instance, 'sucursal', None))
        estado = attrs.get('estado', getattr(self.instance, 'estado', CajaSession.Estado.ABIERTA))
        saldo_final = attrs.get('saldo_final', getattr(self.instance, 'saldo_final', None))

        if sucursal and sucursal.tenant_id != tenant.id:
            raise serializers.ValidationError(
                {'sucursal': 'La sucursal no pertenece a la empresa del usuario.'}
            )
        saldo_inicial = attrs.get(
            'saldo_inicial',
            getattr(self.instance, 'saldo_inicial', None),
        )
        if saldo_inicial is not None and saldo_inicial < 0:
            raise serializers.ValidationError(
                {'saldo_inicial': 'El saldo inicial no puede ser negativo.'}
            )
        if saldo_final is not None and saldo_final < 0:
            raise serializers.ValidationError(
                {'saldo_final': 'El saldo final no puede ser negativo.'}
            )
        if estado == CajaSession.Estado.CERRADA and saldo_final is None:
            raise serializers.ValidationError(
                {'saldo_final': 'El saldo final es obligatorio para cerrar caja.'}
            )

        return attrs

    def update(self, instance, validated_data):
        closing = (
            instance.estado == CajaSession.Estado.ABIERTA
            and validated_data.get('estado') == CajaSession.Estado.CERRADA
        )
        if closing and validated_data.get('fecha_cierre') is None:
            validated_data['fecha_cierre'] = timezone.now()
        return super().update(instance, validated_data)

    def get_resumen_conciliacion(self, obj):
        return calcular_resumen_caja(obj)


class CajaMovimientoSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = CajaMovimiento
        fields = (
            'id',
            'tenant',
            'caja_session',
            'tipo',
            'monto',
            'descripcion',
            'usuario',
            'usuario_username',
            'fecha',
        )
        read_only_fields = (
            'id',
            'tenant',
            'usuario',
            'usuario_username',
            'fecha',
        )

    def validate_caja_session(self, caja_session):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )
        if caja_session.tenant_id != tenant.id:
            raise serializers.ValidationError(
                'La caja no pertenece a la empresa del usuario.'
            )
        validar_caja_abierta_para_movimiento(caja_session)
        return caja_session

    def validate_monto(self, monto):
        if monto <= 0:
            raise serializers.ValidationError('El monto debe ser mayor que cero.')
        return monto

    def validate(self, attrs):
        caja_session = attrs.get(
            'caja_session',
            getattr(self.instance, 'caja_session', None),
        )
        if caja_session is not None:
            validar_caja_abierta_para_movimiento(caja_session)
        return attrs
