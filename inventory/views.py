from rest_framework import viewsets

from accounts.permissions import HasAxisFoodPermission
from audit.models import AuditLog

from .models import InventarioMovimiento
from .serializers import InventarioMovimientoSerializer


class InventarioMovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = InventarioMovimientoSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'inventory.view',
        'retrieve': 'inventory.view',
        'create': 'inventory.create',
        'update': 'inventory.update',
        'partial_update': 'inventory.update',
        'destroy': 'inventory.delete',
    }

    def get_queryset(self):
        tenant = self.request.user.tenant
        queryset = InventarioMovimiento.objects.select_related(
            'tenant',
            'sucursal',
            'producto',
            'usuario',
        ).filter(tenant=tenant)

        producto = self.request.query_params.get('producto')
        sucursal = self.request.query_params.get('sucursal')
        tipo_movimiento = self.request.query_params.get('tipo_movimiento')

        if producto:
            queryset = queryset.filter(producto_id=producto)
        if sucursal:
            queryset = queryset.filter(sucursal_id=sucursal)
        if tipo_movimiento:
            queryset = queryset.filter(tipo_movimiento=tipo_movimiento)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            tenant=self.request.user.tenant,
            usuario=self.request.user,
        )
        AuditLog.objects.create(
            tenant=instance.tenant,
            usuario=self.request.user,
            accion='creacion',
            recurso='InventarioMovimiento',
            recurso_id=str(instance.pk),
            datos_anteriores=None,
            datos_nuevos=InventarioMovimientoSerializer(instance).data,
            ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
