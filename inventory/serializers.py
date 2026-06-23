from rest_framework import serializers

from .models import InventarioMovimiento


class InventarioMovimientoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = InventarioMovimiento
        fields = (
            'id',
            'tenant',
            'sucursal',
            'sucursal_nombre',
            'producto',
            'producto_nombre',
            'tipo_movimiento',
            'cantidad',
            'costo_unitario',
            'costo_total',
            'motivo',
            'usuario',
            'usuario_username',
            'fecha',
        )
        read_only_fields = (
            'id',
            'tenant',
            'costo_total',
            'usuario',
            'usuario_username',
            'producto_nombre',
            'sucursal_nombre',
            'fecha',
        )

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)

        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )

        sucursal = attrs.get('sucursal')
        producto = attrs.get('producto')

        if sucursal and sucursal.tenant_id != tenant.id:
            raise serializers.ValidationError(
                {'sucursal': 'La sucursal no pertenece a la empresa del usuario.'}
            )
        if producto and producto.tenant_id != tenant.id:
            raise serializers.ValidationError(
                {'producto': 'El producto no pertenece a la empresa del usuario.'}
            )

        cantidad = attrs.get('cantidad')
        costo_unitario = attrs.get('costo_unitario')
        tipo_movimiento = attrs.get(
            'tipo_movimiento',
            getattr(self.instance, 'tipo_movimiento', None),
        )
        if cantidad is not None:
            if tipo_movimiento == InventarioMovimiento.TipoMovimiento.AJUSTE:
                if cantidad == 0:
                    raise serializers.ValidationError(
                        {'cantidad': 'La cantidad de ajuste no puede ser cero.'}
                    )
            elif cantidad <= 0:
                raise serializers.ValidationError(
                    {'cantidad': 'La cantidad debe ser mayor que cero.'}
                )
        if costo_unitario is not None and costo_unitario <= 0:
            raise serializers.ValidationError(
                {'costo_unitario': 'El costo unitario debe ser mayor que cero.'}
            )
        if cantidad is not None and costo_unitario is not None:
            attrs['costo_total'] = cantidad * costo_unitario

        return attrs
