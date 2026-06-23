from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class InventarioMovimiento(models.Model):
    class TipoMovimiento(models.TextChoices):
        ENTRADA = 'entrada', 'Entrada'
        SALIDA = 'salida', 'Salida'
        AJUSTE = 'ajuste', 'Ajuste'
        MERMA = 'merma', 'Merma'
        DESPERDICIO = 'desperdicio', 'Desperdicio'
        VENCIMIENTO = 'vencimiento', 'Vencimiento'
        DEVOLUCION = 'devolucion', 'Devolucion'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='inventario_movimientos',
    )
    sucursal = models.ForeignKey(
        'tenants.Sucursal',
        on_delete=models.PROTECT,
        related_name='inventario_movimientos',
    )
    producto = models.ForeignKey(
        'products.Producto',
        on_delete=models.PROTECT,
        related_name='inventario_movimientos',
    )
    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TipoMovimiento.choices,
    )
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    costo_total = models.DecimalField(max_digits=12, decimal_places=2)
    motivo = models.TextField(blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='inventario_movimientos',
    )
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Movimiento de inventario'
        verbose_name_plural = 'Movimientos de inventario'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'producto', 'fecha']),
            models.Index(fields=['tenant', 'sucursal', 'fecha']),
            models.Index(fields=['tenant', 'tipo_movimiento', 'fecha']),
        ]

    def __str__(self):
        return f'{self.tipo_movimiento} - {self.producto} - {self.cantidad}'

    def clean(self):
        errors = {}
        if self.tenant_id and self.sucursal_id and self.sucursal.tenant_id != self.tenant_id:
            errors['sucursal'] = 'La sucursal no pertenece a la empresa del movimiento.'
        if self.tenant_id and self.producto_id and self.producto.tenant_id != self.tenant_id:
            errors['producto'] = 'El producto no pertenece a la empresa del movimiento.'
        if self.cantidad is not None:
            if self.tipo_movimiento == self.TipoMovimiento.AJUSTE:
                if self.cantidad == 0:
                    errors['cantidad'] = 'La cantidad de ajuste no puede ser cero.'
            elif self.cantidad <= 0:
                errors['cantidad'] = 'La cantidad debe ser mayor que cero.'
        if self.costo_unitario is not None and self.costo_unitario <= 0:
            errors['costo_unitario'] = 'El costo unitario debe ser mayor que cero.'
        if errors:
            raise ValidationError(errors)
