from rest_framework import viewsets

from accounts.permissions import HasAxisFoodPermission
from audit.models import AuditLog

from .models import CajaMovimiento, CajaSession
from .serializers import CajaMovimientoSerializer, CajaSessionSerializer
from .services import actualizar_caja_con_workflow


class AuditMixin:
    def audit(self, accion, instance, datos_anteriores=None, datos_nuevos=None):
        AuditLog.objects.create(
            tenant=instance.tenant,
            usuario=self.request.user,
            accion=accion,
            recurso=instance.__class__.__name__,
            recurso_id=str(instance.pk),
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class CajaSessionViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = CajaSessionSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'cash.view',
        'retrieve': 'cash.view',
        'create': 'cash.create',
        'update': 'cash.update',
        'partial_update': 'cash.update',
        'destroy': 'cash.delete',
    }

    def get_queryset(self):
        queryset = CajaSession.objects.select_related(
            'tenant',
            'sucursal',
            'usuario',
        ).filter(tenant=self.request.user.tenant)

        estado = self.request.query_params.get('estado')
        sucursal = self.request.query_params.get('sucursal')

        if estado:
            queryset = queryset.filter(estado=estado)
        if sucursal:
            queryset = queryset.filter(sucursal_id=sucursal)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            tenant=self.request.user.tenant,
            usuario=self.request.user,
        )
        self.audit('apertura_caja', instance, None, CajaSessionSerializer(instance).data)

    def perform_update(self, serializer):
        previous_estado = serializer.instance.estado
        previous = CajaSessionSerializer(serializer.instance).data
        instance, resumen = actualizar_caja_con_workflow(serializer)
        if (
            previous_estado == CajaSession.Estado.ABIERTA
            and instance.estado == CajaSession.Estado.CERRADA
        ):
            datos_nuevos = CajaSessionSerializer(instance).data
            datos_nuevos['resumen_conciliacion'] = resumen
            self.audit('cierre_caja', instance, previous, datos_nuevos)


class CajaMovimientoViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = CajaMovimientoSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'cash.view',
        'retrieve': 'cash.view',
        'create': 'cash.create',
        'update': 'cash.update',
        'partial_update': 'cash.update',
        'destroy': 'cash.delete',
    }

    def get_queryset(self):
        queryset = CajaMovimiento.objects.select_related(
            'tenant',
            'caja_session',
            'usuario',
        ).filter(tenant=self.request.user.tenant)

        caja_session = self.request.query_params.get('caja_session')
        tipo = self.request.query_params.get('tipo')

        if caja_session:
            queryset = queryset.filter(caja_session_id=caja_session)
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            tenant=self.request.user.tenant,
            usuario=self.request.user,
        )
        self.audit(
            'creacion_movimiento_caja',
            instance,
            None,
            CajaMovimientoSerializer(instance).data,
        )
