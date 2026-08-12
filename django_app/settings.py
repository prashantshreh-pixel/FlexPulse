"""
FlexPulse Django Settings Configuration
File: django_app/settings.py
Includes mssql-django database backend configuration for SSMS / Microsoft SQL Server
and HTMX integration settings.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'flexpulse-super-secret-key-production-2026')

DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party HTMX integration
    'django_htmx',
    
    # FlexPulse Core App
    'workout_tracker',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # HTMX Middleware for header detection (request.htmx)
    'django_htmx.middleware.HtmxMiddleware',
]

ROOT_URLCONF = 'flexpulse.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

WSGI_APPLICATION = 'flexpulse.wsgi.application'

# ===============================================================================
# DATABASE CONFIGURATION: Microsoft SQL Server (SSMS) via mssql-django
# ===============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.getenv('SQL_SERVER_DB', 'FlexPulseDB'),
        'USER': os.getenv('SQL_SERVER_USER', 'sa'),
        'PASSWORD': os.getenv('SQL_SERVER_PASSWORD', 'YourStrongPass123!'),
        'HOST': os.getenv('SQL_SERVER_HOST', 'localhost'),
        'PORT': os.getenv('SQL_SERVER_PORT', '1433'),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'TrustServerCertificate': 'yes',
            'connection_timeout': 30,
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
