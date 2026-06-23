from django.contrib import admin
from django import forms

from .models import CajaMovimiento, CajaSession


class CajaSessionAdminForm(forms.ModelForm):
    class Meta:
        model = CajaSession
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tenant'].required = False
        self.fields['sucursal'].required = False

    def clean(self):
        cleaned_data = super().clean()
        usuario = cleaned_data.get('usuario')
        tenant = cleaned_data.get('tenant') or getattr(usuario, 'tenant', None)
        sucursal = cleaned_data.get('sucursal') or getattr(
            usuario,
            'sucursal_principal',
            None,
        )

        if tenant is not None:
            cleaned_data['tenant'] = tenant
            self.instance.tenant = tenant
        if sucursal is not None:
            cleaned_data['sucursal'] = sucursal
            self.instance.sucursal = sucursal

        if tenant is None:
            self.add_error(
                'tenant',
                'Seleccioná una empresa o un usuario con empresa asignada.',
            )
        if sucursal is None:
            self.add_error(
                'sucursal',
                'Seleccioná una sucursal o un usuario con sucursal asignada.',
            )
        if tenant is not None and sucursal is not None and sucursal.tenant_id != tenant.id:
            self.add_error(
                'sucursal',
                'La sucursal no pertenece a la empresa seleccionada.',
            )

        return cleaned_data


class CajaMovimientoInline(admin.TabularInline):
    model = CajaMovimiento
    extra = 0
    readonly_fields = ('tenant', 'usuario', 'fecha')


@admin.register(CajaSession)
class CajaSessionAdmin(admin.ModelAdmin):
    form = CajaSessionAdminForm
    inlines = (CajaMovimientoInline,)
    list_display = (
        'tenant',
        'sucursal',
        'usuario',
        'estado',
        'saldo_inicial',
        'saldo_final',
        'fecha_apertura',
        'fecha_cierre',
    )
    list_filter = ('estado', 'tenant', 'sucursal', 'fecha_apertura')
    search_fields = ('sucursal__nombre', 'usuario__username', 'tenant__nombre')
    readonly_fields = ('fecha_apertura',)
    date_hierarchy = 'fecha_apertura'


@admin.register(CajaMovimiento)
class CajaMovimientoAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant', 'caja_session', 'tipo', 'monto', 'usuario', 'fecha')
    list_filter = ('tipo', 'tenant', 'fecha')
    search_fields = (
        'caja_session__sucursal__nombre',
        'usuario__username',
        'descripcion',
        'tenant__nombre',
    )
    readonly_fields = ('tenant', 'usuario', 'fecha')
    date_hierarchy = 'fecha'
