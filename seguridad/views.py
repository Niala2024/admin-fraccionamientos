from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta 
from django.apps import apps # Necesario para buscar el modelo Casa

from .models import Visita, Trabajador, AccesoTrabajador, Bitacora, ReporteDiario, MensajeChat
from .serializers import (
    VisitaSerializer, TrabajadorSerializer, AccesoTrabajadorSerializer, 
    BitacoraSerializer, ReporteDiarioSerializer, MensajeChatSerializer
)

# --- 1. CHAT INTERNO ---
class MensajeChatViewSet(viewsets.ModelViewSet):
    queryset = MensajeChat.objects.all().order_by('fecha')
    serializer_class = MensajeChatSerializer

    def get_queryset(self):
        user = self.request.user
        rol = getattr(user, 'rol', '').lower() if getattr(user, 'rol', '') else ''
        es_autoridad = user.is_staff or user.is_superuser or 'guardia' in rol or 'admin' in rol

        ver_archivados = self.request.query_params.get('archivados') == 'true'
        queryset = MensajeChat.objects.filter(archivado=ver_archivados).order_by('fecha')

        otro_usuario_id = self.request.query_params.get('usuario')

        if es_autoridad:
            if otro_usuario_id:
                return queryset.filter(
                    Q(remitente_id=otro_usuario_id) | Q(destinatario_id=otro_usuario_id)
                ).order_by('fecha')
            else:
                return queryset.order_by('-fecha')[:50]
        else:
            return queryset.filter(
                Q(remitente=user) | Q(destinatario=user)
            ).order_by('fecha')

    def perform_create(self, serializer):
        user = self.request.user
        rol = getattr(user, 'rol', '').lower() if getattr(user, 'rol', '') else ''
        es_autoridad = user.is_staff or user.is_superuser or 'guardia' in rol or 'admin' in rol
        serializer.save(remitente=user, es_guardia=es_autoridad)

    @action(detail=True, methods=['patch'])
    def archivar(self, request, pk=None):
        mensaje = self.get_object()
        mensaje.archivado = True
        mensaje.save()
        return Response({'status': 'Mensaje archivado'})

    @action(detail=True, methods=['patch'])
    def desarchivar(self, request, pk=None):
        mensaje = self.get_object()
        mensaje.archivado = False
        mensaje.save()
        return Response({'status': 'Mensaje restaurado'})

# --- 2. REPORTE DIARIO ---
class ReporteDiarioViewSet(viewsets.ModelViewSet):
    queryset = ReporteDiario.objects.all().order_by('-fecha')
    serializer_class = ReporteDiarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        fecha_param = self.request.query_params.get('fecha')
        if fecha_param:
            queryset = queryset.filter(fecha__date=fecha_param)
            return queryset
        else:
            hoy = timezone.now().date()
            queryset = queryset.filter(fecha__date=hoy)
        return queryset.order_by('-fecha')

    def perform_create(self, serializer):
        serializer.save(guardia=self.request.user)

# --- 3. ACCESOS Y VISITAS (AQUI ESTÁ LA CORRECCIÓN CLAVE) ---
class AccesoTrabajadorViewSet(viewsets.ModelViewSet):
    queryset = AccesoTrabajador.objects.all()
    serializer_class = AccesoTrabajadorSerializer
    def get_queryset(self):
        queryset = super().get_queryset()
        inicio = self.request.query_params.get('inicio')
        fin = self.request.query_params.get('fin')
        if inicio and fin:
            queryset = queryset.filter(fecha_entrada__date__range=[inicio, fin])
        return queryset
    @action(detail=False, methods=['get'])
    def activos(self, request):
        activos = AccesoTrabajador.objects.filter(fecha_salida__isnull=True).order_by('-fecha_entrada')
        serializer = self.get_serializer(activos, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['post'])
    def escanear_qr(self, request):
        codigo = request.data.get('codigo') 
        if not codigo: return Response({'error': 'Código QR requerido'}, status=400)
        return Response({'mensaje': 'Escaneo recibido (Simulado)'}, status=200)

class VisitaViewSet(viewsets.ModelViewSet):
    queryset = Visita.objects.all().order_by('-id')
    serializer_class = VisitaSerializer

    def perform_create(self, serializer): 
        # ✅ LÓGICA INTELIGENTE DE ASIGNACIÓN DE CASA
        # Esto soluciona el error "No tienes casa asignada"
        user = self.request.user
        casa_obj = None

        # 1. Opción A: El usuario tiene el campo 'casa' directo (Tu configuración actual en Admin)
        if hasattr(user, 'casa') and user.casa:
            casa_obj = user.casa
        
        # 2. Opción B: El usuario es 'propietario' en la tabla Casa (Configuración estándar)
        if not casa_obj:
            try:
                Casa = apps.get_model('inmuebles', 'Casa')
                casa_obj = Casa.objects.filter(propietario=user).first()
            except Exception:
                pass

        # 3. Guardamos la visita con la casa que encontramos
        if casa_obj:
            serializer.save(creado_por=user, casa=casa_obj)
        else:
            # Si es admin o guardia creando visita, la casa podría venir en el request
            serializer.save(creado_por=user)
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        activas = Visita.objects.filter(fecha_llegada_real__isnull=False, fecha_salida_real__isnull=True).order_by('-fecha_llegada_real')
        return Response(self.get_serializer(activas, many=True).data)

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer
    def perform_create(self, serializer):
        # Aplicamos la misma lógica para trabajadores
        user = self.request.user
        casa_id = self.request.data.get('casa')
        
        if casa_id: 
            serializer.save(casa_id=casa_id)
        elif hasattr(user, 'casa') and user.casa:
            serializer.save(casa=user.casa)
        else:
            serializer.save()

class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('dia') == 'hoy':
            ayer = timezone.now() - timezone.timedelta(hours=24)
            qs = qs.filter(fecha__gte=ayer).order_by('-fecha')
        return qs
    def perform_create(self, serializer): serializer.save(autor=self.request.user)

class ReporteAccesosView(APIView):
    def get(self, request): return Response({'status': 'PDF'})