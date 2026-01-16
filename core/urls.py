from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# --- NUEVOS IMPORTS NECESARIOS PARA LA LLAVE MAESTRA ---
from django.http import HttpResponse
from django.contrib.auth.models import User
# -------------------------------------------------------

from usuarios.views import UsuarioViewSet, CustomAuthToken
from inmuebles.views import FraccionamientoViewSet, CasaViewSet, CalleViewSet
from finanzas.views import PagoViewSet, TipoEgresoViewSet, EgresoViewSet, ReporteFinancieroView
from seguridad.views import VisitaViewSet, BitacoraViewSet, TrabajadorViewSet, AccesoTrabajadorViewSet, ReporteAccesosView
from comunidad.views import EncuestaViewSet, PublicacionViewSet, QuejaViewSet, AvisoViewSet

# --- FUNCIÓN DE EMERGENCIA (LLAVE MAESTRA) ---
def crear_superusuario_forzoso(request):
    try:
        # Verifica si el usuario 'master' ya existe
        if User.objects.filter(username='master').exists():
            usuario = User.objects.get(username='master')
            usuario.set_password('Zebra571@')  # Restablece la contraseña a la fuerza
            usuario.is_superuser = True
            usuario.is_staff = True
            usuario.save()
            mensaje = "<h1>✅ ACTUALIZADO</h1><p>El usuario 'master' ya existía. Se ha reseteado su contraseña a: Zebra571@</p>"
        else:
            # Si no existe, lo crea desde cero
            User.objects.create_superuser('master', 'admin@admin.com', 'Zebra571@')
            mensaje = "<h1>✅ CREADO</h1><p>Usuario 'master' creado exitosamente con contraseña: Zebra571@</p>"
            
        return HttpResponse(f"{mensaje}<br><a href='/admin/' style='font-size:20px'>👉 IR AL LOGIN DE ADMIN</a>")
    except Exception as e:
        return HttpResponse(f"<h1>❌ ERROR</h1><p>{str(e)}</p>")
# ---------------------------------------------

router = DefaultRouter()
# CORRECCIÓN: Agregamos basename
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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('api/generar-reporte/', ReporteFinancieroView.as_view(), name='generar_reporte'),
    path('api/reporte-accesos/', ReporteAccesosView.as_view(), name='reporte_accesos'),

    # --- RUTA MÁGICA PARA ACTIVAR EL USUARIO ---
    path('activar-admin/', crear_superusuario_forzoso),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)