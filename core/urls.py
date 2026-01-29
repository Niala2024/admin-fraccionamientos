from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter

# --- VISTAS ---
# 1. Usuarios (Descomentamos Login y Perfil porque ya funcionan)
from usuarios.views import UsuarioViewSet, LoginView, PerfilView

# 2. Inmuebles (CORREGIDO: Importamos lo que realmente tienes en tu código)
from inmuebles.views import CasaViewSet, FraccionamientoViewSet, CalleViewSet

# 3. Otras Apps
from finanzas.views import ReciboViewSet, PagoViewSet
from seguridad.views import TrabajadorViewSet, VisitaViewSet
from servicios.views import SolicitudServicioViewSet
from comunidad.views import (
    EncuestaViewSet, PublicacionViewSet, QuejaViewSet, 
    AvisoViewSet, ServicioExternoViewSet, ConfiguracionComunidadViewSet
)

router = DefaultRouter()

# --- RUTAS ---
router.register(r'usuarios', UsuarioViewSet)

# CORREGIDO: Usamos CasaViewSet en lugar de InmuebleViewSet
router.register(r'inmuebles', CasaViewSet)
router.register(r'fraccionamientos', FraccionamientoViewSet, basename='fraccionamientos')
router.register(r'calles', CalleViewSet)

# (Aquí quitamos reservaciones porque ya no existen)

router.register(r'recibos', ReciboViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'trabajadores', TrabajadorViewSet)
router.register(r'visitas', VisitaViewSet)
router.register(r'solicitudes', SolicitudServicioViewSet)

# Comunidad
router.register(r'foro', PublicacionViewSet, basename='foro')
router.register(r'encuestas', EncuestaViewSet)
router.register(r'quejas', QuejaViewSet, basename='quejas')
router.register(r'avisos', AvisoViewSet)
router.register(r'servicios-externos', ServicioExternoViewSet)
router.register(r'config-comunidad', ConfiguracionComunidadViewSet, basename='config-comunidad')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Reactivamos el login y perfil
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/perfil/', PerfilView.as_view(), name='perfil'),
    
    path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico', permanent=True)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    from django.views.static import serve
    urlpatterns += [
        path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
    ]