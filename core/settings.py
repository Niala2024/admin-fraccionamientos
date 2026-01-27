"""
Django settings for core project.
Configuración Final: HARDENING DE SEGURIDAD (Producción).
"""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv
from corsheaders.defaults import default_headers

# Cargar variables de entorno
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- 1. SEGURIDAD Y ENTORNO ---
# Detectamos si estamos corriendo en Railway
EN_PRODUCCION = 'RAILWAY_ENVIRONMENT' in os.environ

# Clave secreta: En producción la toma de Railway, en local usa la default
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-default')

# 🛑 DEBUG: Se apaga automáticamente en la nube para proteger datos sensibles
DEBUG = not EN_PRODUCCION

# 🔒 ALLOWED_HOSTS: Solo permitimos tráfico legítimo
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.railway.app', # Permite cualquier subdominio de railway
    'admin-fraccionamientos-production.up.railway.app' # Tu dominio específico
]

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

# --- 7. CONFIGURACIÓN SMTP2GO ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.smtp2go.com'
EMAIL_PORT = 443
EMAIL_USE_SSL = True
EMAIL_USE_TLS = False
EMAIL_HOST_USER = 'railwayapp'
EMAIL_HOST_PASSWORD = os.getenv('SMTP2GO_PASSWORD')
DEFAULT_FROM_EMAIL = "Administración <admicountry@hotmail.com>"

# --- 8. SEGURIDAD CORS Y CSRF (HARDENING) ---

# 🛑 Ya no permitimos "todos los orígenes". Solo tu dominio real.
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "https://admin-fraccionamientos-production.up.railway.app",
    "http://localhost:5173", # Útil si sigues desarrollando en local
    "http://127.0.0.1:5173"
]

# Lista de confianza para evitar error 403 en Forms/Login
CSRF_TRUSTED_ORIGINS = [
    'https://admin-fraccionamientos-production.up.railway.app'
]

CORS_ALLOW_CREDENTIALS = False 

CORS_ALLOW_HEADERS = list(default_headers) + [
    "content-disposition",
    "accept-encoding",
    "content-type",
    "accept",
    "origin",
    "authorization",
]

# --- 9. CONFIGURACIÓN DRF (SEGURIDAD ACTIVADA) ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        # SessionAuthentication DESACTIVADA para evitar conflictos CSRF
    ],
    # 🔒 CAMBIO DE SEGURIDAD FINAL:
    # Por defecto, TODO requiere estar logueado.
    # (El Login funciona porque en views.py le pusimos AllowAny explícitamente).
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')