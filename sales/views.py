from rest_framework import viewsets

from accounts.permissions import HasAxisFoodPermission
from audit.models import AuditLog
from cash.serializers import CajaMovimientoSerializer
from inventory.serializers import InventarioMovimientoSerializer

from .models import Cliente, Pago, Pedido
from .serializers import ClienteSerializer, PagoSerializer, PedidoSerializer
from .services import actualizar_pago_con_caja, actualizar_pedido_con_stock


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


class ClienteViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'sales.view',
        'retrieve': 'sales.view',
        'create': 'sales.create',
        'update': 'sales.update',
        'partial_update': 'sales.update',
        'destroy': 'sales.delete',
    }
    audit_resource = 'Cliente'

    def get_queryset(self):
        return Cliente.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.request.user.tenant)
        self.audit('creacion', instance, None, ClienteSerializer(instance).data)

    def perform_update(self, serializer):
        previous = ClienteSerializer(serializer.instance).data
        instance = serializer.save()
        self.audit('modificacion', instance, previous, ClienteSerializer(instance).data)

    def perform_destroy(self, instance):
        previous = ClienteSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()


class PedidoViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'sales.view',
        'retrieve': 'sales.view',
        'create': 'sales.create',
        'update': 'sales.update',
        'partial_update': 'sales.update',
        'destroy': 'sales.delete',
    }
    audit_resource = 'Pedido'

    def get_queryset(self):
        queryset = Pedido.objects.select_related(
            'tenant',
            'sucursal',
            'cliente',
            'created_by',
        ).prefetch_related('items__producto').filter(tenant=self.request.user.tenant)

        estado = self.request.query_params.get('estado')
        canal = self.request.query_params.get('canal')
        cliente = self.request.query_params.get('cliente')
        sucursal = self.request.query_params.get('sucursal')

        if estado:
            queryset = queryset.filter(estado=estado)
        if canal:
            queryset = queryset.filter(canal=canal)
        if cliente:
            queryset = queryset.filter(cliente_id=cliente)
        if sucursal:
            queryset = queryset.filter(sucursal_id=sucursal)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user,
        )
        self.audit('creacion', instance, None, PedidoSerializer(instance).data)

    def perform_update(self, serializer):
        previous = PedidoSerializer(serializer.instance).data
        instance, movimientos = actualizar_pedido_con_stock(
            serializer=serializer,
            usuario=self.request.user,
        )
        self.audit('modificacion', instance, previous, PedidoSerializer(instance).data)
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
        previous = PedidoSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()


class PagoViewSet(AuditMixin, viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    permission_classes = [HasAxisFoodPermission]
    required_permissions = {
        'list': 'sales.view',
        'retrieve': 'sales.view',
        'create': 'sales.create',
        'update': 'sales.update',
        'partial_update': 'sales.update',
        'destroy': 'sales.delete',
    }
    audit_resource = 'Pago'

    def get_queryset(self):
        queryset = Pago.objects.select_related('tenant', 'pedido').filter(
            tenant=self.request.user.tenant
        )

        estado = self.request.query_params.get('estado')
        metodo_pago = self.request.query_params.get('metodo_pago')
        pedido = self.request.query_params.get('pedido')

        if estado:
            queryset = queryset.filter(estado=estado)
        if metodo_pago:
            queryset = queryset.filter(metodo_pago=metodo_pago)
        if pedido:
            queryset = queryset.filter(pedido_id=pedido)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(tenant=self.request.user.tenant)
        self.audit('creacion', instance, None, PagoSerializer(instance).data)

    def perform_update(self, serializer):
        previous = PagoSerializer(serializer.instance).data
        instance, movimiento = actualizar_pago_con_caja(
            serializer=serializer,
            usuario=self.request.user,
        )
        self.audit('modificacion', instance, previous, PagoSerializer(instance).data)
        if movimiento is not None:
            AuditLog.objects.create(
                tenant=movimiento.tenant,
                usuario=self.request.user,
                accion='creacion_movimiento_caja',
                recurso='CajaMovimiento',
                recurso_id=str(movimiento.pk),
                datos_anteriores=None,
                datos_nuevos=CajaMovimientoSerializer(movimiento).data,
                ip=self.request.META.get('REMOTE_ADDR'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            )

    def perform_destroy(self, instance):
        previous = PagoSerializer(instance).data
        self.audit('eliminacion', instance, previous, None)
        instance.delete()
