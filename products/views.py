from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from accounts.permissions import HasAxisFoodPermission
from audit.models import AuditLog

from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer


class TenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'products.view',
        'retrieve': 'products.view',
        'create': 'products.create',
        'update': 'products.update',
        'partial_update': 'products.update',
        'destroy': 'products.delete',
    }
    filter_backends = [SearchFilter, OrderingFilter]

    def get_queryset(self):
        queryset = super().get_queryset().filter(tenant=self.request.user.tenant)
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.request.user.tenant)
        self._audit('creacion', instance, None, serializer.data)

    def perform_update(self, serializer):
        previous = self.get_serializer(serializer.instance).data
        instance = serializer.save()
        self._audit('modificacion', instance, previous, serializer.data)

    def perform_destroy(self, instance):
        previous = self.get_serializer(instance).data
        self._audit('eliminacion', instance, previous, None)
        instance.delete()

    def _audit(self, accion, instance, datos_anteriores, datos_nuevos):
        AuditLog.objects.create(
            tenant=self.request.user.tenant,
            usuario=self.request.user,
            accion=accion,
            recurso=instance.__class__.__name__,
            recurso_id=str(instance.pk),
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class CategoriaViewSet(TenantScopedViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'estado', 'created_at']


class ProductoViewSet(TenantScopedViewSet):
    queryset = Producto.objects.select_related('tenant', 'categoria')
    serializer_class = ProductoSerializer
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
    ordering_fields = ['nombre', 'precio', 'costo', 'estado', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        return queryset
