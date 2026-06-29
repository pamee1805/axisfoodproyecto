"""
Django settings for AxisFood project.
"""

from datetime import timedelta
import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_int(name, default=0):
    value = os.environ.get(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise ImproperlyConfigured(f'{name} debe ser un entero.') from exc


DEBUG = env_bool('DEBUG', True)

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-local-dev-axisfood'
    else:
        raise ImproperlyConfigured('SECRET_KEY debe estar configurada en producción.')


def env_list(*names, default=None):
    value = ''
    for name in names:
        value = os.environ.get(name, '')
        if value:
            break
    if not value:
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


def merge_unique(*groups):
    return list(dict.fromkeys(item for group in groups for item in group))


def database_from_url(value):
    parsed = urlparse(value)
    engine_by_scheme = {
        'postgres': 'django.db.backends.postgresql',
        'postgresql': 'django.db.backends.postgresql',
        'sqlite': 'django.db.backends.sqlite3',
    }
    engine = engine_by_scheme.get(parsed.scheme)
    if not engine:
        raise ImproperlyConfigured('DATABASE_URL debe usar postgres://, postgresql:// o sqlite://.')

    if engine == 'django.db.backends.sqlite3':
        return {
            'ENGINE': engine,
            'NAME': parsed.path.lstrip('/') or BASE_DIR / 'db.sqlite3',
        }

    config = {
        'ENGINE': engine,
        'NAME': unquote(parsed.path.lstrip('/')),
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or '',
        'PORT': str(parsed.port or ''),
        'CONN_MAX_AGE': 600,
    }
    query = parse_qs(parsed.query)
    sslmode = query.get('sslmode', [None])[0]
    if sslmode:
        config['OPTIONS'] = {'sslmode': sslmode}
    return config


DEV_ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '[::1]',
]

PRODUCTION_ALLOWED_HOSTS = [
    'axisfood-backend.onrender.com',
]

FRONTEND_ALLOWED_ORIGINS = [
    'https://axisfoodproyecto-git-main-pamee1805s-projects.vercel.app',
    'https://axisfoodproyecto.vercel.app',
]

DEV_FRONTEND_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

ALLOWED_HOSTS = env_list(
    'ALLOWED_HOSTS',
    'DJANGO_ALLOWED_HOSTS',
    default=DEV_ALLOWED_HOSTS if DEBUG else PRODUCTION_ALLOWED_HOSTS,
)

CSRF_TRUSTED_ORIGINS = merge_unique(
    FRONTEND_ALLOWED_ORIGINS,
    env_list(
        'CSRF_TRUSTED_ORIGINS',
        'DJANGO_CSRF_TRUSTED_ORIGINS',
    ),
    DEV_FRONTEND_ORIGINS if DEBUG else [],
)

CORS_ALLOWED_ORIGINS = merge_unique(
    FRONTEND_ALLOWED_ORIGINS,
    env_list(
        'CORS_ALLOWED_ORIGINS',
        'DJANGO_CORS_ALLOWED_ORIGINS',
    ),
    DEV_FRONTEND_ORIGINS if DEBUG else [],
)

CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    'DJANGO_CORS_ALLOWED_ORIGIN_REGEXES',
    default=[],
)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_URLS_REGEX = r'^/api/.*$'


INSTALLED_APPS = [
    "corsheaders",

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
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', not DEBUG)
SESSION_COOKIE_SECURE = env_bool('SESSION_COOKIE_SECURE', not DEBUG)
CSRF_COOKIE_SECURE = env_bool('CSRF_COOKIE_SECURE', not DEBUG)
SECURE_HSTS_SECONDS = env_int('SECURE_HSTS_SECONDS', 31536000 if not DEBUG else 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', False)
SECURE_HSTS_PRELOAD = env_bool('SECURE_HSTS_PRELOAD', False)


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


DATABASE_URL = os.environ.get('DATABASE_URL')

DATABASES = {
    "default": database_from_url(DATABASE_URL) if DATABASE_URL else ({
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    } if DEBUG else {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "axisfood_bd"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    })
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


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
WHITENOISE_USE_FINDERS = env_bool("WHITENOISE_USE_FINDERS", True)

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
