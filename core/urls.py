from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
import os

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

# ✅ FUNCIÓN PARA SERVIR REACT MANUALMENTE
# Esto evita el error 500 al no usar el motor de plantillas de Django
def serve_react(request, resource=""):
    try:
        # Buscamos el index.html en la carpeta donde Vite lo construyó
        path = os.path.join(settings.BASE_DIR, 'frontend/dist/index.html')
        with open(path, 'r') as file:
            return HttpResponse(file.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse(
            "Error: El archivo 'frontend/dist/index.html' no existe. Asegúrate de haber ejecutado 'npm run build'.",
            status=501
        )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    path('api/api-token-auth/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('api/generar-reporte/', ReporteFinancieroView.as_view(), name='generar_reporte'),
    path('api/reporte-accesos/', ReporteAccesosView.as_view(), name='reporte_accesos'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ✅ RUTA CATCH-ALL SEGURA
# Usa nuestra función manual en lugar de TemplateView
urlpatterns += [
    re_path(r'^.*$', serve_react)
]