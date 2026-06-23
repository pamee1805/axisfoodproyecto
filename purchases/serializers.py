from rest_framework import serializers

from products.models import Producto

from .models import Compra, CompraItem, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = (
            'id',
            'tenant',
            'nombre',
            'telefono',
            'email',
            'direccion',
            'estado',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class CompraItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = CompraItem
        fields = (
            'id',
            'producto',
            'producto_nombre',
            'cantidad',
            'costo_unitario',
            'subtotal',
        )
        read_only_fields = ('id', 'producto_nombre', 'subtotal')

    def validate_producto(self, producto):
        tenant = self.context.get('tenant')
        if tenant and producto.tenant_id != tenant.id:
            raise serializers.ValidationError(
                'El producto no pertenece a la empresa de la orden.'
            )
        return producto

    def validate(self, attrs):
        cantidad = attrs.get('cantidad')
        costo_unitario = attrs.get('costo_unitario')
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError(
                {'cantidad': 'La cantidad debe ser mayor que cero.'}
            )
        if costo_unitario is not None and costo_unitario <= 0:
            raise serializers.ValidationError(
                {'costo_unitario': 'El costo unitario debe ser mayor que cero.'}
            )
        if cantidad is not None and costo_unitario is not None:
            attrs['subtotal'] = cantidad * costo_unitario
        return attrs


class CompraSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    items = CompraItemSerializer(many=True)

    class Meta:
        model = Compra
        fields = (
            'id',
            'tenant',
            'proveedor',
            'proveedor_nombre',
            'usuario',
            'usuario_username',
            'estado',
            'total',
            'fecha',
            'created_at',
            'updated_at',
            'items',
        )
        read_only_fields = (
            'id',
            'tenant',
            'usuario',
            'usuario_username',
            'proveedor_nombre',
            'total',
            'created_at',
            'updated_at',
        )

    def validate_proveedor(self, proveedor):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )
        if proveedor.tenant_id != tenant.id:
            raise serializers.ValidationError(
                'El proveedor no pertenece a la empresa del usuario.'
            )
        return proveedor

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('La orden debe tener al menos un detalle.')

        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        for item in items:
            producto = item.get('producto')
            if isinstance(producto, Producto) and producto.tenant_id != tenant.id:
                raise serializers.ValidationError(
                    'No se permiten productos de otra empresa.'
                )
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        total = sum(item['subtotal'] for item in items_data)
        compra = Compra.objects.create(total=total, **validated_data)

        CompraItem.objects.bulk_create(
            CompraItem(compra=compra, **item_data)
            for item_data in items_data
        )
        return compra

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            total = sum(item['subtotal'] for item in items_data)
            CompraItem.objects.bulk_create(
                CompraItem(compra=instance, **item_data)
                for item_data in items_data
            )
            instance.total = total

        instance.save()
        return instance

    def to_representation(self, instance):
        instance = Compra.objects.prefetch_related('items__producto').get(pk=instance.pk)
        return super().to_representation(instance)
