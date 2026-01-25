"""
Django settings for core project.
Configuración HÍBRIDA: Funciona en Local (SQLite) y Railway (PostgreSQL) automáticamente.
"""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Cargar variables de entorno desde .env (Solo para local)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- 1. DETECCIÓN DE ENTORNO ---
# Si Railway pone esta variable, sabemos que estamos en la nube.
EN_PRODUCCION = 'RAILWAY_ENVIRONMENT' in os.environ

# --- 2. SEGURIDAD ---
# En producción usamos la clave secreta real, en local una por defecto
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-default-para-local')

# DEBUG se apaga solo en producción (Por seguridad)
DEBUG = True 

# Permitir todos los hosts es necesario en Railway por sus IPs dinámicas
ALLOWED_HOSTS = ["*"]


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # APPS DE TERCEROS
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders', # ✅ INDISPENSABLE
    # TUS APPS
    'usuarios.apps.UsuariosConfig',
    'inmuebles',
    'seguridad',
    'finanzas',
    'comunidad',
    'servicios',
]

AUTH_USER_MODEL = 'usuarios.Usuario'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # ✅ EL PRIMERO
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ✅ Para archivos estáticos
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
        # 👇 CAMBIO: Ponemos la ruta en texto plano (Hardcoded)
        'DIRS': ['/app/frontend/dist'], 
        'APP_DIRS': True,
        'OPTIONS': {
            # ... (deja el resto igual)
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# --- 3. BASE DE DATOS HÍBRIDA ---
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'),
        conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

# --- 4. ARCHIVOS ESTÁTICOS ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# Compresión y caché eficiente para producción
#STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 👇 CAMBIO 2: Agregamos esto para que Django encuentre los JS y CSS de React
STATICFILES_DIRS = [
    '/app/frontend/dist',  # 👇 Ruta en texto plano
]

# --- ARCHIVOS MEDIA ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Configuración de subida (10MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760 
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760

# --- EMAIL ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp-relay.brevo.com'  # 👈 El servidor de Brevo
EMAIL_PORT = 587                       # Brevo funciona mejor en el 587
EMAIL_USE_TLS = True                   # Usamos TLS
EMAIL_USE_SSL = False                  # SSL Apagado

# Tu correo con el que te registraste en Brevo
EMAIL_HOST_USER = 'mision.country.dgo@gmail.com' 

# 👇 Aquí pegas la CLAVE LARGA que te dio Brevo (NO tu contraseña de Gmail)
# Lo ideal es usar os.getenv, pero para probar pégala aquí:
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD') 

DEFAULT_FROM_EMAIL = 'Administración <mision.country.dgo@gmail.com>'
# --- 5. CORS Y CSRF ---
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",          
    "http://127.0.0.1:8000",          
    "https://*.railway.app",          
    "https://*.up.railway.app",       
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
# FORZANDO ACTUALIZACION DE CORREO - INTENTO FINAL