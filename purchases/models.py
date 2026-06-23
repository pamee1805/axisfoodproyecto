from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Proveedor(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='proveedores',
    )
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    estado = models.CharField('Estado', max_length=30, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'nombre'],
                name='unique_proveedor_nombre_por_tenant',
            ),
        ]

    def __str__(self):
        return self.nombre


class Compra(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        APROBADA = 'aprobada', 'Aprobada'
        RECHAZADA = 'rechazada', 'Rechazada'
        RECIBIDA = 'recibida', 'Recibida'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='compras',
    )
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='compras',
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='compras',
    )
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Orden de compra'
        verbose_name_plural = 'Órdenes de compra'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'proveedor', 'fecha']),
            models.Index(fields=['tenant', 'estado', 'fecha']),
        ]

    def __str__(self):
        return f'Orden de compra #{self.pk}'

    def clean(self):
        errors = {}
        if self.tenant_id and self.proveedor_id and self.proveedor.tenant_id != self.tenant_id:
            errors['proveedor'] = 'El proveedor no pertenece a la empresa de la orden.'
        if self.total is not None and self.total <= 0:
            errors['total'] = 'El total debe ser mayor que cero.'
        if errors:
            raise ValidationError(errors)


class CompraItem(models.Model):
    compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        related_name='items',
    )
    producto = models.ForeignKey(
        'products.Producto',
        on_delete=models.PROTECT,
        related_name='compra_items',
    )
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Producto de la orden'
        verbose_name_plural = 'Productos de la orden'
        ordering = ['id']

    def __str__(self):
        return f'{self.producto} x {self.cantidad}'

    def clean(self):
        errors = {}
        if self.cantidad is not None and self.cantidad <= 0:
            errors['cantidad'] = 'La cantidad debe ser mayor que cero.'
        if self.costo_unitario is not None and self.costo_unitario <= 0:
            errors['costo_unitario'] = 'El costo unitario debe ser mayor que cero.'
        if self.subtotal is not None and self.subtotal <= 0:
            errors['subtotal'] = 'El subtotal debe ser mayor que cero.'
        if (
            self.compra_id
            and self.producto_id
            and self.producto.tenant_id != self.compra.tenant_id
        ):
            errors['producto'] = 'El producto no pertenece a la empresa de la orden.'
        if errors:
            raise ValidationError(errors)
