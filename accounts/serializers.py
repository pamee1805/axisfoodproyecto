from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from tenants.models import Sucursal, Tenant

from .models import Permiso, Rol, RolePermission, UserRole, Usuario


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ('id', 'nombre', 'razon_social', 'cuit', 'estado')


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = ('id', 'nombre', 'direccion', 'telefono', 'estado')


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ('id', 'codigo', 'nombre', 'descripcion', 'created_at')
        read_only_fields = ('id', 'created_at')


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ('id', 'codigo', 'nombre', 'descripcion')
        read_only_fields = ('id',)


class UsuarioMeSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    sucursal_principal = SucursalSerializer(read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'telefono',
            'estado',
            'tenant',
            'sucursal_principal',
            'roles',
        )

    def get_roles(self, obj):
        roles = Rol.objects.filter(user_roles__usuario=obj).order_by('codigo')
        return RolSerializer(roles, many=True).data


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UsuarioMeSerializer(self.user).data
        return data


class UsuarioAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = (
            'id',
            'username',
            'password',
            'email',
            'first_name',
            'last_name',
            'telefono',
            'estado',
            'tenant',
            'sucursal_principal',
            'is_active',
            'is_staff',
            'date_joined',
            'roles',
        )
        read_only_fields = ('id', 'tenant', 'date_joined', 'roles')
        extra_kwargs = {
            'username': {'required': True},
        }

    def get_roles(self, obj):
        roles = Rol.objects.filter(user_roles__usuario=obj).order_by('codigo')
        return RolSerializer(roles, many=True).data

    def validate(self, attrs):
        request = self.context.get('request')
        request_user = getattr(request, 'user', None)

        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError(
                {'password': 'La contraseña es obligatoria para crear usuarios.'}
            )

        if (
            request_user
            and not getattr(request_user, 'is_superuser', False)
            and getattr(request_user, 'tenant_id', None) is None
        ):
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )

        sucursal = attrs.get(
            'sucursal_principal',
            getattr(self.instance, 'sucursal_principal', None),
        )
        tenant = getattr(request_user, 'tenant', None)
        if (
            sucursal
            and request_user
            and not getattr(request_user, 'is_superuser', False)
            and tenant
            and sucursal.tenant_id != tenant.id
        ):
            raise serializers.ValidationError(
                {'sucursal_principal': 'La sucursal no pertenece a la empresa del usuario.'}
            )

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        request_user = getattr(request, 'user', None)
        password = validated_data.pop('password')

        if request_user and not getattr(request_user, 'is_superuser', False):
            validated_data['tenant'] = request_user.tenant

        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserRoleSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    rol_codigo = serializers.CharField(source='rol.codigo', read_only=True)

    class Meta:
        model = UserRole
        fields = ('id', 'usuario', 'usuario_username', 'rol', 'rol_codigo')
        read_only_fields = ('id', 'usuario_username', 'rol_codigo')

    def validate_usuario(self, usuario):
        request = self.context.get('request')
        request_user = getattr(request, 'user', None)

        if request_user and getattr(request_user, 'is_superuser', False):
            return usuario

        if getattr(request_user, 'tenant_id', None) is None:
            raise serializers.ValidationError(
                'El usuario autenticado debe tener una empresa asociada.'
            )

        if usuario.tenant_id != request_user.tenant_id:
            raise serializers.ValidationError(
                'No se puede asignar un rol a un usuario de otra empresa.'
            )
        return usuario


class RolePermissionSerializer(serializers.ModelSerializer):
    rol_codigo = serializers.CharField(source='rol.codigo', read_only=True)
    permiso_codigo = serializers.CharField(source='permiso.codigo', read_only=True)

    class Meta:
        model = RolePermission
        fields = (
            'id',
            'rol',
            'rol_codigo',
            'permiso',
            'permiso_codigo',
        )
        read_only_fields = ('id', 'rol_codigo', 'permiso_codigo')
