"""
Django settings for core project.
Versión DEFINITIVA: 
- Correo: SMTP2GO (Puerto 443/SSL)
- CORS: Estricto (Permite subir imágenes y bajar PDFs)
"""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv
from corsheaders.defaults import default_headers # Importante para los headers

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

    # Tus Apps
    'usuarios.apps.UsuariosConfig',
    'inmuebles',
    'seguridad',
    'finanzas',
    'comunidad',
    'servicios',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',            # ✅ VITAL: Debe ir al inicio
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

# --- 7. CONFIGURACIÓN DE CORREO (SMTP2GO - FUNCIONANDO) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.smtp2go.com'
EMAIL_PORT = 443              # Puerto seguro SSL (Anti-bloqueo Railway)
EMAIL_USE_SSL = True          # ✅ SSL Activado
EMAIL_USE_TLS = False         # ❌ TLS Desactivado
EMAIL_HOST_USER = 'railwayapp'
EMAIL_HOST_PASSWORD = os.getenv('SMTP2GO_PASSWORD')
DEFAULT_FROM_EMAIL = "Administración <admicountry@hotmail.com>"

# --- 8. CORS Y DRF (CORREGIDO PARA IMÁGENES Y PDFS) ---

# 1. ❌ IMPORTANTE: Apagamos "Permitir a todos" para evitar conflictos
CORS_ALLOW_ALL_ORIGINS = False 

# 2. ✅ Activamos credenciales para que pasen las cookies/tokens
CORS_ALLOW_CREDENTIALS = True

# 3. Lista Blanca EXACTA (Tus dominios reales)
CORS_ALLOWED_ORIGINS = [
    "https://admin-fraccionamientos-production.up.railway.app", # Tu Frontend
    "https://web-production-619e0.up.railway.app",              # Tu Backend
    "http://localhost:5173",                                      # Tu Localhost (pruebas)
]

# 4. Confianza CSRF (Igual que arriba + comodines de Railway)
CSRF_TRUSTED_ORIGINS = [
    "https://admin-fraccionamientos-production.up.railway.app",
    "https://web-production-619e0.up.railway.app",
    "https://*.railway.app",
    "https://*.up.railway.app",
]

# 5. Headers permitidos (Incluye 'content-disposition' para descargar PDFs)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "content-disposition",
    "accept-encoding",
    "content-type",
    "accept",
    "origin",
    "authorization",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')