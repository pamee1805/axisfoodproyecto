from django.db import models


class Tenant(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = "activo", "Activo"
        PRUEBA = "prueba", "Prueba"
        SUSPENDIDO = "suspendido", "Suspendido"
        CANCELADO = "cancelado", "Cancelado"

    nombre = models.CharField(max_length=150)
    razon_social = models.CharField(max_length=200, blank=True)
    cuit = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PRUEBA,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Sucursal(models.Model):
    class Estado(models.TextChoices):
        ACTIVA = "activa", "Activa"
        INACTIVA = "inactiva", "Inactiva"

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="sucursales",
        verbose_name="Empresa",
    )
    nombre = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVA,
        verbose_name="Estado",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"
        ordering = ["tenant__nombre", "nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "nombre"],
                name="unique_sucursal_nombre_por_tenant",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.tenant}"
