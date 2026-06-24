from django.db import migrations


def attach_admin_to_demo_tenant(apps, schema_editor):
    Usuario = apps.get_model('accounts', 'Usuario')
    Tenant = apps.get_model('tenants', 'Tenant')
    Sucursal = apps.get_model('tenants', 'Sucursal')

    admin = Usuario.objects.filter(username='admin').first()
    tenant = Tenant.objects.filter(nombre='AxisFood Demo').first()

    if admin is None or tenant is None:
        return

    sucursal = Sucursal.objects.filter(
        tenant=tenant,
        nombre='Sucursal Central',
    ).first()

    admin.tenant_id = tenant.id
    admin.sucursal_principal_id = sucursal.id if sucursal else None
    admin.estado = 'activo'
    admin.is_active = True
    admin.is_staff = True
    admin.is_superuser = True
    admin.save(
        update_fields=[
            'tenant',
            'sucursal_principal',
            'estado',
            'is_active',
            'is_staff',
            'is_superuser',
        ]
    )


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0003_alter_tenant_options_alter_tenant_cuit_and_more'),
        ('accounts', '0003_create_admin_superuser'),
    ]

    operations = [
        migrations.RunPython(attach_admin_to_demo_tenant, migrations.RunPython.noop),
    ]
