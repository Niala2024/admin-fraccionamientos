"""
Django settings for core project.
Configuración: Brevo API (Puerto 443) + Hotmail Verificado.
"""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- 1. SEGURIDAD Y ENTORNO ---
EN_PRODUCCION = 'RAILWAY_ENVIRONMENT' in os.environ
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-default')
DEBUG = True
ALLOWED_HOSTS = ["*"]

# --- 2. APLICACIONES INSTALADAS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps de Terceros
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'anymail',  # ✅ Librería para conectar con Brevo API

    # Tus Apps
    'usuarios.apps.UsuariosConfig',
    'inmuebles',
    'seguridad',
    'finanzas',
    'comunidad',
    'servicios',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['/app/frontend/dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# --- 3. BASE DE DATOS ---
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'),
        conn_max_age=600
    )
}

# --- 4. USUARIO Y AUTH ---
AUTH_USER_MODEL = 'usuarios.Usuario'

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# --- 5. IDIOMA Y ZONA HORARIA ---
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

# --- 6. ARCHIVOS ESTÁTICOS ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = ['/app/frontend/dist']

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# settings.py

# --- CONFIGURACIÓN SMTP2GO ---
# Usamos el backend estándar de Django (no anymail)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.smtp2go.com'

# 👇 EL TRUCO: Usamos el puerto 2525 (a veces Railway deja pasar este)
EMAIL_PORT = 2525 
EMAIL_USE_TLS = True

# Tu usuario y contraseña de SMTP2GO
EMAIL_HOST_USER = 'adminfracc@infinitummail.com' # (No es tu email, es el usuario que creaste en el panel)
EMAIL_HOST_PASSWORD = os.getenv('SMTP2GO_PASSWORD')

# Remitente
DEFAULT_FROM_EMAIL = "Administración <adminfracc@infinitummail.com>"
# --- 8. CORS Y DRF ---
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["https://*.railway.app", "https://*.up.railway.app", "http://localhost:5173"]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')