from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter

# --- IMPORTACIONES QUE FALTABAN ---
from usuarios.views import UsuarioViewSet, LoginView, PerfilView
from inmuebles.views import InmuebleViewSet, ReservacionAmenidadViewSet
from finanzas.views import ReciboViewSet, PagoViewSet
from seguridad.views import TrabajadorViewSet, VisitaViewSet
from servicios.views import SolicitudServicioViewSet
from comunidad.views import (
    EncuestaViewSet, PublicacionViewSet, QuejaViewSet, 
    AvisoViewSet, ServicioExternoViewSet, ConfiguracionComunidadViewSet
)

router = DefaultRouter()
# Rutas principales
router.register(r'usuarios', UsuarioViewSet)
router.register(r'inmuebles', InmuebleViewSet)
router.register(r'reservaciones', ReservacionAmenidadViewSet)
router.register(r'recibos', ReciboViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'trabajadores', TrabajadorViewSet)
router.register(r'visitas', VisitaViewSet)
router.register(r'solicitudes', SolicitudServicioViewSet)

# Rutas de Comunidad
router.register(r'foro', PublicacionViewSet, basename='foro')
router.register(r'encuestas', EncuestaViewSet)
router.register(r'quejas', QuejaViewSet, basename='quejas')
router.register(r'avisos', AvisoViewSet)
router.register(r'servicios-externos', ServicioExternoViewSet)
router.register(r'config-comunidad', ConfiguracionComunidadViewSet, basename='config-comunidad')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/perfil/', PerfilView.as_view(), name='perfil'),
    
    # Redirección para evitar error 404 del favicon
    path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico', permanent=True)),
]

# Configuración para servir imágenes (MEDIA)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    from django.views.static import serve
    urlpatterns += [
        path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
    # Configuración actualizada