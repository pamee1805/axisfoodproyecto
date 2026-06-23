from rest_framework import serializers

from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = (
            'id',
            'tenant',
            'nombre',
            'descripcion',
            'estado',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model = Producto
        fields = (
            'id',
            'tenant',
            'categoria',
            'categoria_nombre',
            'nombre',
            'descripcion',
            'precio',
            'costo',
            'stock_minimo',
            'stock_maximo',
            'punto_reposicion',
            'estado',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'tenant',
            'categoria_nombre',
            'created_at',
            'updated_at',
        )

    def validate_categoria(self, categoria):
        request = self.context.get('request')
        if (
            request
            and request.user.is_authenticated
            and categoria.tenant_id != request.user.tenant_id
        ):
            raise serializers.ValidationError(
                'La categoria no pertenece al tenant del usuario.'
            )
        return categoria
