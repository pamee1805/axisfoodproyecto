from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Cliente(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='clientes',
    )
    nombre = models.CharField(max_length=120)
    apellido = models.CharField(max_length=120, blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    notas = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nombre', 'apellido']

    def __str__(self):
        nombre_completo = f'{self.nombre} {self.apellido}'.strip()
        return nombre_completo or self.telefono or str(self.pk)


class Pedido(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PREPARACION = 'en_preparacion', 'En preparacion'
        LISTO = 'listo', 'Listo'
        EN_CAMINO = 'en_camino', 'En camino'
        ENTREGADO = 'entregado', 'Entregado'
        FINALIZADO = 'finalizado', 'Finalizado'
        CANCELADO = 'cancelado', 'Cancelado'

    class Canal(models.TextChoices):
        MOSTRADOR = 'mostrador', 'Mostrador'
        DELIVERY = 'delivery', 'Delivery'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        WEB = 'web', 'Web'
        TELEFONO = 'telefono', 'Telefono'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='pedidos',
    )
    sucursal = models.ForeignKey(
        'tenants.Sucursal',
        on_delete=models.PROTECT,
        related_name='pedidos',
    )
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        related_name='pedidos',
    )
    canal = models.CharField(max_length=20, choices=Canal.choices)
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pedidos_creados',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'sucursal', 'fecha']),
            models.Index(fields=['tenant', 'estado', 'fecha']),
        ]

    def __str__(self):
        return f'Pedido #{self.pk}'

    def clean(self):
        errors = {}
        if self.tenant_id and self.sucursal_id and self.sucursal.tenant_id != self.tenant_id:
            errors['sucursal'] = 'La sucursal no pertenece a la empresa del pedido.'
        if self.tenant_id and self.cliente_id and self.cliente.tenant_id != self.tenant_id:
            errors['cliente'] = 'El cliente no pertenece a la empresa del pedido.'
        if self.descuento is not None and self.descuento < 0:
            errors['descuento'] = 'El descuento no puede ser negativo.'
        if (
            self.subtotal is not None
            and self.descuento is not None
            and self.descuento > self.subtotal
        ):
            errors['descuento'] = 'El descuento no puede superar el subtotal.'
        if self.total is not None and self.total < 0:
            errors['total'] = 'El total no puede ser negativo.'
        if errors:
            raise ValidationError(errors)


class PedidoItem(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='items',
    )
    producto = models.ForeignKey(
        'products.Producto',
        on_delete=models.PROTECT,
        related_name='pedido_items',
    )
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Producto del pedido'
        verbose_name_plural = 'Productos del pedido'
        ordering = ['id']

    def __str__(self):
        return f'{self.producto} x {self.cantidad}'

    def clean(self):
        errors = {}
        if self.cantidad is not None and self.cantidad <= 0:
            errors['cantidad'] = 'La cantidad debe ser mayor que cero.'
        if self.precio_unitario is not None and self.precio_unitario <= 0:
            errors['precio_unitario'] = 'El precio unitario debe ser mayor que cero.'
        if self.subtotal is not None and self.subtotal <= 0:
            errors['subtotal'] = 'El subtotal debe ser mayor que cero.'
        if (
            self.pedido_id
            and self.producto_id
            and self.producto.tenant_id != self.pedido.tenant_id
        ):
            errors['producto'] = 'El producto no pertenece a la empresa del pedido.'
        if errors:
            raise ValidationError(errors)


class Pago(models.Model):
    class MetodoPago(models.TextChoices):
        EFECTIVO = 'efectivo', 'Efectivo'
        TARJETA = 'tarjeta', 'Tarjeta'
        TRANSFERENCIA = 'transferencia', 'Transferencia'
        MERCADO_PAGO = 'mercado_pago', 'Mercado Pago'

    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        APROBADO = 'aprobado', 'Aprobado'
        RECHAZADO = 'rechazado', 'Rechazado'
        REINTEGRADO = 'reintegrado', 'Reintegrado'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='pagos',
    )
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.PROTECT,
        related_name='pagos',
    )
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=MetodoPago.choices)
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    fecha = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'pedido', 'fecha']),
            models.Index(fields=['tenant', 'estado', 'fecha']),
        ]

    def __str__(self):
        return f'Pago #{self.pk} - {self.monto}'

    def clean(self):
        errors = {}
        if self.monto is not None and self.monto <= 0:
            errors['monto'] = 'El monto debe ser mayor que cero.'
        if self.tenant_id and self.pedido_id and self.pedido.tenant_id != self.tenant_id:
            errors['pedido'] = 'El pedido no pertenece a la empresa del pago.'
        if errors:
            raise ValidationError(errors)
