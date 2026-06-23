from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    class Estado(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        INACTIVO = 'inactivo', 'Inactivo'
        SUSPENDIDO = 'suspendido', 'Suspendido'
        VACACIONES = 'vacaciones', 'Vacaciones'

    tenant = models.ForeignKey(
        'tenants.Tenant',
        verbose_name='Empresa',
        on_delete=models.PROTECT,
        related_name='usuarios',
        null=True,
        blank=True,
    )
    sucursal_principal = models.ForeignKey(
        'tenants.Sucursal',
        verbose_name='Sucursal principal',
        on_delete=models.SET_NULL,
        related_name='usuarios_principales',
        null=True,
        blank=True,
    )
    telefono = models.CharField(max_length=30, blank=True)
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=Estado.choices,
        default=Estado.ACTIVO,
    )
    ultimo_acceso = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']

    def __str__(self):
        return self.get_full_name() or self.username


class Rol(models.Model):
    codigo = models.CharField(max_length=80, unique=True)
    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return self.codigo or self.nombre


class Permiso(models.Model):
    codigo = models.CharField(max_length=120, unique=True)
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['codigo']

    def __str__(self):
        return self.codigo


class UserRole(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='user_roles',
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        related_name='user_roles',
    )

    class Meta:
        verbose_name = 'Rol asignado'
        verbose_name_plural = 'Roles asignados'
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'rol'],
                name='unique_usuario_rol',
            ),
        ]

    def __str__(self):
        return f'{self.usuario} -> {self.rol}'


class RolePermission(models.Model):
    rol = models.ForeignKey(
        Rol,
        on_delete=models.CASCADE,
        related_name='role_permissions',
    )
    permiso = models.ForeignKey(
        Permiso,
        on_delete=models.CASCADE,
        related_name='role_permissions',
    )

    class Meta:
        verbose_name = 'Permiso del rol'
        verbose_name_plural = 'Permisos del rol'
        constraints = [
            models.UniqueConstraint(
                fields=['rol', 'permiso'],
                name='unique_rol_permiso',
            ),
        ]

    def __str__(self):
        return f'{self.rol} -> {self.permiso}'
