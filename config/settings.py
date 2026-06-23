"""
Django settings for AxisFood project.
"""

from datetime import timedelta
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-fz!i+atih6n3a0(qui-q@tw6&a)2euc2g=h^uhl*zk0(lyq&cx"

DEBUG = True


def env_list(name, default=None):
    value = os.environ.get(name, '')
    if not value:
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


DEV_ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    '.ngrok-free.dev',
    '.ngrok-free.app',
    '.ngrok.app',
]

ALLOWED_HOSTS = env_list(
    'DJANGO_ALLOWED_HOSTS',
    DEV_ALLOWED_HOSTS if DEBUG else [],
)

CSRF_TRUSTED_ORIGINS = env_list(
    'DJANGO_CSRF_TRUSTED_ORIGINS',
    [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://*.ngrok-free.dev',
        'https://*.ngrok-free.app',
        'https://*.ngrok.app',
    ] if DEBUG else [],
)

CORS_ALLOWED_ORIGINS = env_list(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ] if DEBUG else [],
)

CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    'DJANGO_CORS_ALLOWED_ORIGIN_REGEXES',
    [
        r'^https://.*\.ngrok-free\.dev$',
        r'^https://.*\.ngrok-free\.app$',
        r'^https://.*\.ngrok\.app$',
    ] if DEBUG else [],
)


INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "rest_framework_simplejwt",

    # Local apps
    "accounts",
    "tenants",
    "audit",
    "core",
    "inventory",
    "products",
    "purchases",
    "sales",
    "cash",
    "dashboard",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "core.middleware.DevelopmentCorsMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "axisfood_bd",
        "USER": "postgres",
        "PASSWORD": "1405",
        "HOST": "localhost",
        "PORT": "5432",
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "es-ar"

TIME_ZONE = "America/Argentina/Buenos_Aires"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
AUTH_USER_MODEL = "accounts.Usuario"
