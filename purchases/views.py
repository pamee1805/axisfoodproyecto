from rest_framework import viewsets

from accounts.permissions import HasAxisFoodPermission
from audit.models import AuditLog
from inventory.serializers import InventarioMovimientoSerializer

from .models import Compra, Proveedor
from .serializers import CompraSerializer, ProveedorSerializer
from .services import actualizar_compra_con_stock


class AuditMixin:
    audit_resource = None

    def audit(self, accion, instance, datos_anteriores=None, datos_nuevos=None):
        AuditLog.objects.create(
            tenant=instance.tenant,
            usuario=self.request.user,
            accion=accion,
            recurso=self.audit_resource or instance.__class__.__name__,
            recurso_id=str(instance.pk),
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class ProveedorViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'purchases.view',
        'retrieve': 'purchases.view',
        'create': 'purchases.create',
        'update': 'purchases.update',
        'partial_update': 'purchases.update',
        'destroy': 'purchases.delete',
    }
    audit_resource = 'Proveedor'

    def get_queryset(self):
        queryset = Proveedor.objects.filter(tenant=self.request.user.tenant)
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.request.user.tenant)
        self.audit('creacion', instance, None, ProveedorSerializer(instance).data)

    def perform_update(self, serializer):
        previous = ProveedorSerializer(serializer.instance).data
        instance = serializer.save()
        self.audit('modificacion', instance, previous, ProveedorSerializer(instance).data)

    def perform_destroy(self, instance):
        previous = ProveedorSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()


class CompraViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = CompraSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'purchases.view',
        'retrieve': 'purchases.view',
        'create': 'purchases.create',
        'update': 'purchases.update',
        'partial_update': 'purchases.update',
        'destroy': 'purchases.delete',
    }
    audit_resource = 'Compra'

    def get_queryset(self):
        queryset = Compra.objects.select_related(
            'tenant',
            'proveedor',
            'usuario',
        ).prefetch_related('items__producto').filter(tenant=self.request.user.tenant)

        estado = self.request.query_params.get('estado')
        proveedor = self.request.query_params.get('proveedor')
        fecha = self.request.query_params.get('fecha')

        if estado:
            queryset = queryset.filter(estado=estado)
        if proveedor:
            queryset = queryset.filter(proveedor_id=proveedor)
        if fecha:
            queryset = queryset.filter(fecha__date=fecha)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            tenant=self.request.user.tenant,
            usuario=self.request.user,
        )
        self.audit('creacion', instance, None, CompraSerializer(instance).data)

    def perform_update(self, serializer):
        previous = CompraSerializer(serializer.instance).data
        instance, movimientos = actualizar_compra_con_stock(
            serializer=serializer,
            usuario=self.request.user,
        )
        self.audit('modificacion', instance, previous, CompraSerializer(instance).data)
        for movimiento in movimientos:
            AuditLog.objects.create(
                tenant=movimiento.tenant,
                usuario=self.request.user,
                accion='creacion',
                recurso='InventarioMovimiento',
                recurso_id=str(movimiento.pk),
                datos_anteriores=None,
                datos_nuevos=InventarioMovimientoSerializer(movimiento).data,
                ip=self.request.META.get('REMOTE_ADDR'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            )

    def perform_destroy(self, instance):
        previous = CompraSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()
