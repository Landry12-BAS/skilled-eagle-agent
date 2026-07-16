"""
Django settings configuration.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent
BASE_DIR = PROJECT_DIR if (PROJECT_DIR / "backend").exists() else BACKEND_DIR
CORE_DIR = BACKEND_DIR

# Load environment variables from stable paths.
load_dotenv(BASE_DIR / '.env')
load_dotenv(CORE_DIR / '.env', override=True)

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-key-for-local-dev-only')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]

# Application definition
INSTALLED_APPS = [
    'daphne',
    'unfold',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.core',
    'apps.accounts',
    'apps.ai',
    'apps.chat',
    'apps.clients',
    'apps.documents',
    'apps.agent',
    'channels',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [CORE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

if os.environ.get('REDIS_URL'):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.pubsub.RedisPubSubChannelLayer',
            'CONFIG': {
                "hosts": [os.environ.get('REDIS_URL')],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
elif os.environ.get('DB_NAME'):
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }

AUTH_USER_MODEL = 'accounts.CustomUser'

AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS
CORS_ALLOWED_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV.split(',') if origin.strip()
]
if not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True

# CSRF
CSRF_TRUSTED_ORIGINS_ENV = os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000')
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in CSRF_TRUSTED_ORIGINS_ENV.split(',') if origin.strip()
]

# GitHub OAuth for SEA
GITHUB_OAUTH_CLIENT_ID = os.environ.get('GITHUB_OAUTH_CLIENT_ID', '')
GITHUB_OAUTH_CLIENT_SECRET = os.environ.get('GITHUB_OAUTH_CLIENT_SECRET', '')
GITHUB_OAUTH_REDIRECT_URI = os.environ.get('GITHUB_OAUTH_REDIRECT_URI', '')
GITHUB_OAUTH_SCOPE = os.environ.get('GITHUB_OAUTH_SCOPE', 'repo read:user')
GITHUB_OAUTH_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('GITHUB_OAUTH_ALLOWED_ORIGINS', CORS_ALLOWED_ORIGINS_ENV).split(',')
    if origin.strip()
]

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = CORE_DIR / 'static'
STATICFILES_DIRS = [CORE_DIR / 'staticfiles']
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = CORE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
        },
    },
}

# Unfold configuration for black & white theme
UNFOLD = {
    "SITE_TITLE": "Skilled Eagle Admin",
    "SITE_HEADER": "Skilled Eagle",
    "SITE_URL": "/",
    "SITE_LOGO": {
        "light": lambda request: "/static/img/logo_light.png",
        "dark": lambda request: "/static/img/logo_dark.png",
    },
    "COLORS": {
        "primary": {
            "50":  "238 240 255",   # #eef0ff  - very light indigo tint
            "100": "224 226 255",   # #e0e2ff
            "200": "199 202 255",   # #c7caff
            "300": "163 166 235",   # #a3a6eb
            "400": "118 120 210",   # #7678d2
            "500": "79 80 175",     # #4f50af  - mid indigo
            "600": "47 49 140",     # #2f318c  - Unfold uses this for buttons
            "700": "35 36 105",     # #232469
            "800": "22 22 70",      # #161646
            "900": "12 12 40",      # #0c0c28
            "950": "4 4 16",        # #040410
        }
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            # ── Backend ──────────────────────────────────────────────────────
            {
                "title": "Backend",
                "separator": False,
                "collapsible": False,
                "items": [
                    {
                        "title": "AI Providers",
                        "icon": "smart_toy",
                        "link": "/admin/ai/aiprovider/",
                        "add_link": "/admin/ai/aiprovider/add/",
                    },
                    {
                        "title": "Users",
                        "icon": "group",
                        "link": "/admin/accounts/customuser/",
                        "add_link": "/admin/accounts/customuser/add/",
                    },
                ],
            },
            # ── Chat ─────────────────────────────────────────────────────────
            {
                "title": "Chat",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Conversations",
                        "icon": "forum",
                        "link": "/admin/chat/conversation/",
                        "add_link": "/admin/chat/conversation/add/",
                    },
                    {
                        "title": "Messages",
                        "icon": "chat_bubble",
                        "link": "/admin/chat/chatmessage/",
                        "add_link": "/admin/chat/chatmessage/add/",
                    },
                ],
            },
            # ── System ───────────────────────────────────────────────────────
            {
                "title": "System",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Groups",
                        "icon": "shield",
                        "link": "/admin/auth/group/",
                        "add_link": "/admin/auth/group/add/",
                    },
                ],
            },
        ],
    },
    "STYLES": [
        lambda request: "/static/css/unfold_fixes.css?v=6",
    ],
}
