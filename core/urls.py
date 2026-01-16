from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from django.http import HttpResponse
from django.contrib.auth import get_user_model

# Importamos las vistas de tus apps
from usuarios.views import UsuarioViewSet, CustomAuthToken
from inmuebles.views import FraccionamientoViewSet, CasaViewSet, CalleViewSet
from finanzas.views import PagoViewSet, TipoEgresoViewSet, EgresoViewSet, ReporteFinancieroView
from seguridad.views import VisitaViewSet, BitacoraViewSet, TrabajadorViewSet, AccesoTrabajadorViewSet, ReporteAccesosView
from comunidad.views import EncuestaViewSet, PublicacionViewSet, QuejaViewSet, AvisoViewSet

# ✅ NUEVO IMPORT PARA SERVICIOS
from servicios.views import ServicioViewSet

# --- FUNCIÓN DE EMERGENCIA ---
def crear_superusuario_forzoso(request):
    User = get_user_model() 
    try:
        if User.objects.filter(username='master').exists():
            usuario = User.objects.get(username='master')
            usuario.set_password('Zebra571@')
            usuario.is_superuser = True
            usuario.is_staff = True
            usuario.save()
            mensaje = "<h1>✅ ACTUALIZADO</h1><p>El usuario 'master' ya existía. Contraseña reseteada a: Zebra571@</p>"
        else:
            User.objects.create_superuser(username='master', email='admin@admin.com', password='Zebra571@')
            mensaje = "<h1>✅ CREADO</h1><p>Usuario 'master' creado exitosamente. <br>Usuario: master<br>Pass: Zebra571@</p>"
            
        return HttpResponse(f"{mensaje}<br><br><a href='/admin/' style='font-size:24px; font-weight:bold;'>👉 IR AL LOGIN</a>")
    except Exception as e:
        return HttpResponse(f"<h1>❌ ERROR</h1><p>No se pudo crear el usuario. Detalles:</p><pre>{str(e)}</pre>")
# ----------------------------------------------------------------------------

router = DefaultRouter()
router.register(r'fraccionamientos', FraccionamientoViewSet, basename='fraccionamiento')
router.register(r'usuarios', UsuarioViewSet)
router.register(r'casas', CasaViewSet)
router.register(r'calles', CalleViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'tipos-egresos', TipoEgresoViewSet)
router.register(r'egresos', EgresoViewSet)
router.register(r'visitas', VisitaViewSet, basename='visita')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajador')
router.register(r'accesos-trabajadores', AccesoTrabajadorViewSet, basename='acceso_trabajador')
router.register(r'bitacora', BitacoraViewSet)
router.register(r'encuestas', EncuestaViewSet)
router.register(r'foro', PublicacionViewSet)
router.register(r'quejas', QuejaViewSet, basename='queja')
router.register(r'avisos', AvisoViewSet)

# ✅ REGISTRAR LA RUTA DE SERVICIOS
router.register(r'servicios', ServicioViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('api/generar-reporte/', ReporteFinancieroView.as_view(), name='generar_reporte'),
    path('api/reporte-accesos/', ReporteAccesosView.as_view(), name='reporte_accesos'),

    # RUTA DE EMERGENCIA
    path('activar-admin/', crear_superusuario_forzoso),
]

# ESTO ASEGURA QUE VEAS LAS FOTOS EN LOCAL (DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)