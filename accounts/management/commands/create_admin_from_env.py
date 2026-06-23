import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


class Command(BaseCommand):
    help = (
        'Crea o actualiza un superusuario usando variables de entorno. '
        'Pensado para bootstrap seguro en produccion.'
    )

    REQUIRED_ENV_VARS = (
        'DJANGO_SUPERUSER_USERNAME',
        'DJANGO_SUPERUSER_EMAIL',
        'DJANGO_SUPERUSER_PASSWORD',
    )

    def handle(self, *args, **options):
        values = {name: os.environ.get(name, '').strip() for name in self.REQUIRED_ENV_VARS}
        missing = [name for name, value in values.items() if not value]

        if missing:
            raise CommandError(
                'Faltan variables de entorno requeridas: '
                f'{", ".join(missing)}. No se creo ni actualizo ningun usuario.'
            )

        username = values['DJANGO_SUPERUSER_USERNAME']
        email = values['DJANGO_SUPERUSER_EMAIL']
        password = values['DJANGO_SUPERUSER_PASSWORD']
        User = get_user_model()

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                },
            )

            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save(
                update_fields=[
                    'email',
                    'is_staff',
                    'is_superuser',
                    'is_active',
                    'password',
                ]
            )

        action = 'creado' if created else 'actualizado'
        self.stdout.write(
            self.style.SUCCESS(f'Superusuario "{username}" {action} correctamente.')
        )
