"""
Django settings for core project.
"""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv  # <--- IMPORTANTE: Para leer el archivo .env

# Cargar variables de entorno desde el archivo .env (si existe)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- SEGURIDAD ---
# 1. SECRET_KEY: Lee del .env, si no existe usa una por defecto (solo para dev)
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-default-para-local')

# 2. DEBUG: Lee del .env. Solo será True si escribes DEBUG=True en el archivo.
# Por seguridad, si no encuentra la variable, asume False.
DEBUG = os.getenv('DEBUG') == 'True'

# 3. ALLOWED_HOSTS: Lee del .env y separa por comas.
# Ejemplo en .env: ALLOWED_HOSTS=localhost,127.0.0.1,mi-sitio.com
allowed_hosts_env = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = allowed_hosts_env.split(',')


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
    'corsheaders',
    # TUS APPS
    'usuarios.apps.UsuariosConfig',
    'inmuebles',
    'seguridad',
    'finanzas',
    'comunidad',
]

AUTH_USER_MODEL = 'usuarios.Usuario'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Para servir estáticos en producción
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Para conectar con React
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
        'DIRS': [],
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

# --- BASE DE DATOS ---
# Usa la del .env (DATABASE_URL) si existe (Prod), si no usa SQLite (Local)
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

# --- ARCHIVOS ESTÁTICOS (CSS, JS) ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- ARCHIVOS MEDIA (FOTOS) ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- EMAIL (CONFIGURACIÓN GMAIL) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mision.country.dgo@gmail.com'
EMAIL_HOST_PASSWORD = 'bnkmjgctfxxwvbhw'
DEFAULT_FROM_EMAIL = 'Administración Fraccionamiento <mision.country.dgo@gmail.com>'

# --- CORS (Conexión Frontend-Backend) ---
# En desarrollo permitimos todo. En producción, deberías poner aquí la URL de Vercel/Netlify.
CORS_ALLOW_ALL_ORIGINS = True 

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # Opcional: Paginación global para que no colapse con muchos datos
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}