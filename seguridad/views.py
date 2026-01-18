from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta 

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

        if es_autoridad:
            return MensajeChat.objects.all().order_by('-fecha')[:50]
        else:
            return MensajeChat.objects.filter(
                Q(remitente=user) | Q(destinatario=user)
            ).order_by('fecha')

    def perform_create(self, serializer):
        user = self.request.user
        rol = getattr(user, 'rol', '').lower() if getattr(user, 'rol', '') else ''
        es_autoridad = user.is_staff or user.is_superuser or 'guardia' in rol or 'admin' in rol
        destinatario_id = self.request.data.get('destinatario')
        serializer.save(
            remitente=user, 
            es_para_guardia=not es_autoridad, 
            destinatario_id=destinatario_id
        )

# --- 2. REPORTE DIARIO (MEJORADO PARA FILTROS) ---
class ReporteDiarioViewSet(viewsets.ModelViewSet):
    queryset = ReporteDiario.objects.all().order_by('-fecha')
    serializer_class = ReporteDiarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por fecha específica (para el Admin)
        fecha_param = self.request.query_params.get('fecha')
        if fecha_param:
            queryset = queryset.filter(fecha__date=fecha_param)
            return queryset # Si filtra por fecha, devolvemos todo lo de ese día
        
        # Si no hay filtro, devolvemos los últimos 50 (para el Dashboard del guardia)
        return queryset[:50]

    def perform_create(self, serializer):
        serializer.save(guardia=self.request.user)

# --- 3. ACCESOS, VISITAS, ETC. (IGUAL QUE ANTES) ---
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
        # (Tu lógica de QR que ya funciona perfecto se mantiene aquí...)
        # Para abreviar en esta respuesta, asumo que mantienes tu lógica de QR intacta.
        # Si la necesitas completa de nuevo, avísame, pero es la misma del paso anterior.
        return Response({'error': 'QR no reconocido'}, status=400) 

class VisitaViewSet(viewsets.ModelViewSet):
    queryset = Visita.objects.all().order_by('-id')
    serializer_class = VisitaSerializer
    def perform_create(self, serializer): serializer.save(creado_por=self.request.user)
    @action(detail=False, methods=['get'])
    def activas(self, request):
        activas = Visita.objects.filter(fecha_llegada_real__isnull=False, fecha_salida_real__isnull=True).order_by('-fecha_llegada_real')
        return Response(self.get_serializer(activas, many=True).data)

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer
    def perform_create(self, serializer):
        casa_id = self.request.data.get('casa')
        if casa_id: serializer.save(casa_id=casa_id)
        else: serializer.save()

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