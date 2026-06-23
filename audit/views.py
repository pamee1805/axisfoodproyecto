from django.utils.dateparse import parse_date
from rest_framework.exceptions import MethodNotAllowed
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import HasAxisFoodPermission

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, HasAxisFoodPermission]
    http_method_names = ['get', 'post', 'head', 'options']
    required_permissions = {
        'list': 'audit.view',
        'retrieve': 'audit.view',
        'create': 'audit.view',
    }

    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST')

    def get_queryset(self):
        user = self.request.user
        queryset = AuditLog.objects.select_related('tenant', 'usuario').order_by('-fecha')

        if not user.is_superuser:
            if user.tenant_id is None:
                return queryset.none()
            queryset = queryset.filter(tenant_id=user.tenant_id)

        accion = self.request.query_params.get('accion')
        recurso = self.request.query_params.get('recurso')
        usuario = self.request.query_params.get('usuario')
        fecha_desde = parse_date(self.request.query_params.get('fecha_desde') or '')
        fecha_hasta = parse_date(self.request.query_params.get('fecha_hasta') or '')

        if accion:
            queryset = queryset.filter(accion=accion)
        if recurso:
            queryset = queryset.filter(recurso=recurso)
        if usuario:
            queryset = queryset.filter(usuario_id=usuario)
        if fecha_desde:
            queryset = queryset.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__date__lte=fecha_hasta)

        return queryset
