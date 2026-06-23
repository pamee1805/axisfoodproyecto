from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class CajaSession(models.Model):
    class Estado(models.TextChoices):
        ABIERTA = 'abierta', 'Abierta'
        CERRADA = 'cerrada', 'Cerrada'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='caja_sessions',
    )
    sucursal = models.ForeignKey(
        'tenants.Sucursal',
        on_delete=models.PROTECT,
        related_name='caja_sessions',
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='caja_sessions',
    )
    fecha_apertura = models.DateTimeField(default=timezone.now)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.ABIERTA,
    )

    class Meta:
        verbose_name = 'Caja'
        verbose_name_plural = 'Caja'
        ordering = ['-fecha_apertura']
        indexes = [
            models.Index(fields=['tenant', 'sucursal', 'estado']),
            models.Index(fields=['tenant', 'fecha_apertura']),
        ]

    def __str__(self):
        return f'Caja #{self.pk} - {self.sucursal} - {self.estado}'

    def clean(self):
        errors = {}
        if self.tenant_id and self.sucursal_id and self.sucursal.tenant_id != self.tenant_id:
            errors['sucursal'] = 'La sucursal no pertenece a la empresa de la caja.'
        if self.saldo_inicial is not None and self.saldo_inicial < 0:
            errors['saldo_inicial'] = 'El saldo inicial no puede ser negativo.'
        if self.saldo_final is not None and self.saldo_final < 0:
            errors['saldo_final'] = 'El saldo final no puede ser negativo.'
        if self.estado == self.Estado.CERRADA and self.saldo_final is None:
            errors['saldo_final'] = 'El saldo final es obligatorio para cerrar caja.'
        if errors:
            raise ValidationError(errors)


class CajaMovimiento(models.Model):
    class Tipo(models.TextChoices):
        INGRESO = 'ingreso', 'Ingreso'
        EGRESO = 'egreso', 'Egreso'
        AJUSTE = 'ajuste', 'Ajuste'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='caja_movimientos',
    )
    caja_session = models.ForeignKey(
        CajaSession,
        on_delete=models.PROTECT,
        related_name='movimientos',
    )
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    descripcion = models.TextField(blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='caja_movimientos',
    )
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Movimiento de caja'
        verbose_name_plural = 'Movimientos de caja'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'caja_session', 'fecha']),
            models.Index(fields=['tenant', 'tipo', 'fecha']),
        ]

    def __str__(self):
        return f'{self.tipo} - {self.monto}'

    def clean(self):
        errors = {}
        if self.monto is not None and self.monto <= 0:
            errors['monto'] = 'El monto debe ser mayor que cero.'
        if (
            self.tenant_id
            and self.caja_session_id
            and self.caja_session.tenant_id != self.tenant_id
        ):
            errors['caja_session'] = 'La caja no pertenece a la empresa del movimiento.'
        if errors:
            raise ValidationError(errors)
