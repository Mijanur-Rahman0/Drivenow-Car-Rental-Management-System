"""
Django settings — DriveNow Car Rental (BACKEND / REST API only).

The frontend lives in a separate project (../frontend) and talks to this
server over HTTP using JSON + Token authentication.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-car-rental-2024-university-project-secret-key-change-in-production',
)

DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # local
    'backend',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'car_rental_project.urls'

# Only needed for the built-in Django admin site at /database/
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'car_rental_project.wsgi.application'

# ─── DATABASE ────────────────────────────────────────────────────────────────
from pymongo import MongoClient

MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017')

USE_MONGO = False
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.server_info()  # raises exception if MongoDB is down
    USE_MONGO = True
except Exception:
    USE_MONGO = False

if USE_MONGO:
    DATABASES = {
        'default': {
            'ENGINE': 'djongo',
            'NAME': 'car_rental_db',
            'ENFORCE_SCHEMA': False,
            'CLIENT': {
                'host': MONGO_URI,
            }
        }
    }
    print("Using MongoDB for database")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("MongoDB not found, using SQLite instead")

# ─── STATIC & MEDIA ──────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── AUTH ─────────────────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'backend.UserProfile'

# ─── REST FRAMEWORK ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ─── CORS (frontend runs on a different origin/port) ─────────────────────────
# Auth is done with an "Authorization: Token ..." header (no cookies), so
# allowing all origins is fine during development.
# In production set CORS_ALLOW_ALL_ORIGINS = False and list your frontend URL:
#   CORS_ALLOWED_ORIGINS = ["https://your-frontend.example.com"]
CORS_ALLOW_ALL_ORIGINS = True

# ─── INTERNATIONALIZATION ─────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dhaka'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
