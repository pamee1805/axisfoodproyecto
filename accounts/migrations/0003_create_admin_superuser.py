from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_admin_superuser(apps, schema_editor):
    Usuario = apps.get_model('accounts', 'Usuario')
    username = 'admin'
    user, _ = Usuario.objects.get_or_create(
        username=username,
        defaults={
            'email': 'admin@axisfood.local',
            'first_name': 'Admin',
            'last_name': 'AxisFood',
        },
    )
    user.email = user.email or 'admin@axisfood.local'
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.password = make_password('admin1234')
    user.save(
        update_fields=[
            'email',
            'is_active',
            'is_staff',
            'is_superuser',
            'password',
        ]
    )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_permiso_options_alter_rol_options_and_more'),
    ]

    operations = [
        migrations.RunPython(create_admin_superuser, migrations.RunPython.noop),
    ]
