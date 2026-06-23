from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.SET_NULL,
        related_name='audit_logs',
        null=True,
        blank=True,
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
        null=True,
        blank=True,
    )
    accion = models.CharField(max_length=80)
    recurso = models.CharField(max_length=120)
    recurso_id = models.CharField(max_length=80, blank=True)
    datos_anteriores = models.JSONField(null=True, blank=True)
    datos_nuevos = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Registro de auditoría'
        verbose_name_plural = 'Registros de auditoría'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['tenant', 'recurso', 'recurso_id']),
            models.Index(fields=['accion', 'fecha']),
        ]

    def __str__(self):
        return f'{self.fecha} - {self.accion} - {self.recurso}'
