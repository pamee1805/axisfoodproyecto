from rest_framework import serializers

from products.models import Producto

from .models import Cliente, Pago, Pedido, PedidoItem


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = (
            'id',
            'tenant',
            'nombre',
            'apellido',
            'telefono',
            'email',
            'direccion',
            'notas',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class PedidoItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = PedidoItem
        fields = (
            'id',
            'producto',
            'producto_nombre',
            'cantidad',
            'precio_unitario',
            'subtotal',
        )
        read_only_fields = ('id', 'producto_nombre', 'subtotal')

    def validate(self, attrs):
        cantidad = attrs.get('cantidad')
        precio_unitario = attrs.get('precio_unitario')
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError(
                {'cantidad': 'La cantidad debe ser mayor que cero.'}
            )
        if precio_unitario is not None and precio_unitario <= 0:
            raise serializers.ValidationError(
                {'precio_unitario': 'El precio unitario debe ser mayor que cero.'}
            )
        if cantidad is not None and precio_unitario is not None:
            attrs['subtotal'] = cantidad * precio_unitario
        return attrs


class PedidoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items = PedidoItemSerializer(many=True)

    class Meta:
        model = Pedido
        fields = (
            'id',
            'tenant',
            'sucursal',
            'sucursal_nombre',
            'cliente',
            'cliente_nombre',
            'canal',
            'estado',
            'subtotal',
            'descuento',
            'total',
            'fecha',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
            'items',
        )
        read_only_fields = (
            'id',
            'tenant',
            'sucursal_nombre',
            'cliente_nombre',
            'subtotal',
            'total',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        )

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )

        sucursal = attrs.get('sucursal', getattr(self.instance, 'sucursal', None))
        cliente = attrs.get('cliente', getattr(self.instance, 'cliente', None))
        items = attrs.get('items')

        if sucursal and sucursal.tenant_id != tenant.id:
            raise serializers.ValidationError(
                {'sucursal': 'La sucursal no pertenece a la empresa del usuario.'}
            )
        if cliente and cliente.tenant_id != tenant.id:
            raise serializers.ValidationError(
                {'cliente': 'El cliente no pertenece a la empresa del usuario.'}
            )
        if items is not None and not items:
            raise serializers.ValidationError({'items': 'El pedido debe tener productos.'})

        if items is not None:
            for item in items:
                producto = item.get('producto')
                if isinstance(producto, Producto) and producto.tenant_id != tenant.id:
                    raise serializers.ValidationError(
                        {'items': 'No se permiten productos de otra empresa.'}
                    )

            subtotal = sum(item['subtotal'] for item in items)
        elif self.instance is not None:
            subtotal = sum(item.subtotal for item in self.instance.items.all())
        else:
            subtotal = 0

        descuento = attrs.get('descuento', getattr(self.instance, 'descuento', 0))
        if descuento < 0:
            raise serializers.ValidationError(
                {'descuento': 'El descuento no puede ser negativo.'}
            )
        if descuento > subtotal:
            raise serializers.ValidationError(
                {'descuento': 'El descuento no puede superar el subtotal.'}
            )

        attrs['subtotal'] = subtotal
        attrs['total'] = subtotal - descuento
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        pedido = Pedido.objects.create(**validated_data)
        PedidoItem.objects.bulk_create(
            PedidoItem(pedido=pedido, **item_data)
            for item_data in items_data
        )
        return pedido

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            PedidoItem.objects.bulk_create(
                PedidoItem(pedido=instance, **item_data)
                for item_data in items_data
            )
            if hasattr(instance, '_prefetched_objects_cache'):
                instance._prefetched_objects_cache.pop('items', None)

        subtotal = sum(
            PedidoItem.objects.filter(pedido=instance).values_list('subtotal', flat=True)
        )
        if instance.descuento > subtotal:
            raise serializers.ValidationError(
                {'descuento': 'El descuento no puede superar el subtotal.'}
            )
        instance.subtotal = subtotal
        instance.total = subtotal - instance.descuento
        instance.save()
        return instance

    def to_representation(self, instance):
        instance = Pedido.objects.prefetch_related('items__producto').get(pk=instance.pk)
        return super().to_representation(instance)

    def get_cliente_nombre(self, obj):
        return str(obj.cliente)


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = (
            'id',
            'tenant',
            'pedido',
            'monto',
            'metodo_pago',
            'estado',
            'fecha',
            'created_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at')

    def validate_pedido(self, pedido):
        request = self.context.get('request')
        tenant = getattr(getattr(request, 'user', None), 'tenant', None)
        if tenant is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )
        if pedido.tenant_id != tenant.id:
            raise serializers.ValidationError(
                'El pedido no pertenece a la empresa del usuario.'
            )
        return pedido

    def validate_monto(self, monto):
        if monto <= 0:
            raise serializers.ValidationError('El monto debe ser mayor que cero.')
        return monto
