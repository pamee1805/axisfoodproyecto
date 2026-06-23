from django.db import models


class Categoria(models.Model):
    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='categorias',
    )
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    estado = models.CharField('Estado', max_length=30, default='activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'nombre'],
                name='unique_categoria_nombre_por_tenant',
            ),
        ]

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    class Estado(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        INACTIVO = 'inactivo', 'Inactivo'
        AGOTADO = 'agotado', 'Agotado'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.CASCADE,
        related_name='productos',
    )
    categoria = models.ForeignKey(
        Categoria,
        verbose_name='Categoría',
        on_delete=models.PROTECT,
        related_name='productos',
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField('Precio de venta', max_digits=12, decimal_places=2)
    costo = models.DecimalField('Costo de compra', max_digits=12, decimal_places=2)
    stock_minimo = models.DecimalField(
        'Reposición mínima',
        max_digits=12,
        decimal_places=3,
        default=0,
    )
    stock_maximo = models.DecimalField(
        'Stock máximo recomendado',
        max_digits=12,
        decimal_places=3,
        default=0,
    )
    punto_reposicion = models.DecimalField(
        'Avisar reposición cuando queden',
        max_digits=12,
        decimal_places=3,
        default=0,
    )
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'nombre'],
                name='unique_producto_nombre_por_tenant',
            ),
        ]

    def __str__(self):
        return self.nombre
