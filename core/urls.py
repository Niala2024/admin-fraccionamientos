from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from django.views.generic import TemplateView

# --- TUS IMPORTS ---
from usuarios.views import UsuarioViewSet, CustomAuthToken
from inmuebles.views import FraccionamientoViewSet, CasaViewSet, CalleViewSet
from finanzas.views import PagoViewSet, TipoEgresoViewSet, EgresoViewSet, ReporteFinancieroView
from comunidad.views import EncuestaViewSet, PublicacionViewSet, QuejaViewSet, AvisoViewSet, ServicioExternoViewSet
from servicios.views import ServicioViewSet
from seguridad.views import (
    VisitaViewSet, BitacoraViewSet, TrabajadorViewSet, 
    AccesoTrabajadorViewSet, ReporteAccesosView, 
    ReporteDiarioViewSet, MensajeChatViewSet
)

router = DefaultRouter()
router.register(r'fraccionamientos', FraccionamientoViewSet, basename='fraccionamiento')
router.register(r'usuarios', UsuarioViewSet)
router.register(r'casas', CasaViewSet)
router.register(r'calles', CalleViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'visitas', VisitaViewSet, basename='visita')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajador')
router.register(r'accesos-trabajadores', AccesoTrabajadorViewSet, basename='acceso_trabajador')
router.register(r'bitacora', BitacoraViewSet)
router.register(r'reportes-diarios', ReporteDiarioViewSet)
router.register(r'chat', MensajeChatViewSet, basename='chat')
router.register(r'encuestas', EncuestaViewSet)
router.register(r'foro', PublicacionViewSet)
router.register(r'quejas', QuejaViewSet, basename='queja')
router.register(r'avisos', AvisoViewSet)
router.register(r'tipos-egresos', TipoEgresoViewSet)
router.register(r'egresos', EgresoViewSet)
router.register(r'servicios', ServicioViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # ✅ RUTA CORREGIDA: Coincide con lo que busca tu Login.jsx (/api/api-token-auth/)
    path('api/api-token-auth/', CustomAuthToken.as_view(), name='api_token_auth'),
    
    path('api/generar-reporte/', ReporteFinancieroView.as_view(), name='generar_reporte'),
    path('api/reporte-accesos/', ReporteAccesosView.as_view(), name='reporte_accesos'),
]

# Configuración de Imágenes
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# "Atrapa-todo" para React
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]