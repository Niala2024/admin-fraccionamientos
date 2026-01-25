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
EN_PRODUCCION = 'RAILWAY_ENVIRONMENT' in os.environ

# --- 2. SEGURIDAD ---
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-default-para-local')
DEBUG = True 
ALLOWED_HOSTS = ["*"]

# --- 3. APPLICACIONES INSTALADAS (LISTA ÚNICA Y COMPLETA) ---
INSTALLED_APPS = [
    # APPS BASE DE DJANGO (¡NO BORRAR!)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes', # Esta faltaba y causaba el error
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # APPS DE TERCEROS
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders', 
    'anymail',  # ✅ Librería para correo por API (Brevo)

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

# --- 4. BASE DE DATOS ---
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

# --- 5. ARCHIVOS ESTÁTICOS ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    '/app/frontend/dist', 
]

# --- 6. ARCHIVOS MEDIA ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760 
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760

# --- 7. CONFIGURACIÓN DE CORREO (API ANYMAIL / BREVO) ---
# Usamos el backend de Anymail para conectar por API (HTTPS) y evitar bloqueos de puerto.
EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"

ANYMAIL = {
    "SENDINBLUE_API_KEY": os.getenv('BREVO_API_KEY'),
}

DEFAULT_FROM_EMAIL = "Administración <mision.country.dgo@gmail.com>"

# --- 8. CORS Y CSRF ---
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