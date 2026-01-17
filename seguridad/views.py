from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q

# Importaciones para PDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from .models import Visita, Trabajador, AccesoTrabajador, Bitacora, ReporteDiario
from .serializers import (
    VisitaSerializer, TrabajadorSerializer, AccesoTrabajadorSerializer, 
    BitacoraSerializer, ReporteDiarioSerializer
)

# --- 1. REPORTE DIARIO (NOVEDADES) ---
class ReporteDiarioViewSet(viewsets.ModelViewSet):
    queryset = ReporteDiario.objects.all().order_by('-fecha')
    serializer_class = ReporteDiarioSerializer

    def get_queryset(self):
        # Mostramos los últimos 50 mensajes para el feed
        return super().get_queryset()[:50]

    def perform_create(self, serializer):
        serializer.save(guardia=self.request.user)

# --- 2. ACCESOS Y ESCÁNER ---
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

    # Endpoint para ver empleados que están ADENTRO
    @action(detail=False, methods=['get'])
    def activos(self, request):
        activos = AccesoTrabajador.objects.filter(fecha_salida__isnull=True).order_by('-fecha_entrada')
        serializer = self.get_serializer(activos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def escanear_qr(self, request):
        codigo = request.data.get('codigo') 
        
        if not codigo:
            return Response({'error': 'Código QR requerido'}, status=400)

        # A) LÓGICA TRABAJADORES
        if codigo.startswith('WORKER-'):
            try:
                trabajador_id = int(codigo.split('-')[1])
                trabajador = Trabajador.objects.get(id=trabajador_id)
                
                acceso_abierto = AccesoTrabajador.objects.filter(trabajador=trabajador, fecha_salida__isnull=True).last()
                foto_url = trabajador.foto.url if trabajador.foto else None

                if acceso_abierto: # SALIDA
                    acceso_abierto.fecha_salida = timezone.now()
                    acceso_abierto.save()
                    return Response({
                        'mensaje': f'SALIDA: {trabajador.nombre_completo}', 'tipo': 'SALIDA', 
                        'foto': foto_url, 'nombre': trabajador.nombre_completo,
                        'puesto': trabajador.direccion, 'casa': str(trabajador.casa), 'hora': acceso_abierto.fecha_salida
                    })
                else: # ENTRADA
                    nuevo = AccesoTrabajador.objects.create(trabajador=trabajador, fecha_entrada=timezone.now())
                    return Response({
                        'mensaje': f'ENTRADA: {trabajador.nombre_completo}', 'tipo': 'ENTRADA', 
                        'foto': foto_url, 'nombre': trabajador.nombre_completo,
                        'puesto': trabajador.direccion, 'casa': str(trabajador.casa), 'hora': nuevo.fecha_entrada
                    })
            except Exception as e:
                return Response({'error': str(e)}, status=400)

        # B) LÓGICA VISITAS
        elif codigo.startswith('VISIT-'):
            try:
                visita_id = int(codigo.split('-')[1])
                visita = Visita.objects.get(id=visita_id)

                if visita.fecha_salida_real:
                     return Response({'error': 'Este código ya fue cerrado.', 'tipo': 'ERROR'}, status=400)

                if not visita.fecha_llegada_real: # ENTRADA
                    visita.fecha_llegada_real = timezone.now()
                    visita.save()
                    return Response({
                        'mensaje': f'ENTRADA VISITA: {visita.nombre_visitante}', 'tipo': 'ENTRADA',
                        'nombre': visita.nombre_visitante, 'destino': f'Casa {visita.casa}', 'hora': visita.fecha_llegada_real
                    })
                else: # SALIDA
                    visita.fecha_salida_real = timezone.now()
                    visita.save()
                    return Response({
                        'mensaje': f'SALIDA VISITA: {visita.nombre_visitante}', 'tipo': 'SALIDA',
                        'nombre': visita.nombre_visitante, 'destino': f'Casa {visita.casa}', 'hora': visita.fecha_salida_real
                    })
            except Exception as e:
                return Response({'error': str(e)}, status=400)
        
        return Response({'error': 'QR no reconocido'}, status=400)

# --- 3. VISITAS ---
class VisitaViewSet(viewsets.ModelViewSet):
    queryset = Visita.objects.all()
    serializer_class = VisitaSerializer

    @action(detail=False, methods=['get'])
    def activas(self, request):
        activas = Visita.objects.filter(fecha_llegada_real__isnull=False, fecha_salida_real__isnull=True).order_by('-fecha_llegada_real')
        serializer = self.get_serializer(activas, many=True)
        return Response(serializer.data)

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer
    
    def perform_create(self, serializer):
        casa_id = self.request.data.get('casa')
        if casa_id: serializer.save(casa_id=casa_id)
        else: serializer.save()

# --- 4. BITÁCORA ---
class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('dia') == 'hoy':
            ayer = timezone.now() - timezone.timedelta(hours=24)
            qs = qs.filter(fecha__gte=ayer).order_by('-fecha')
        return qs
    
    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

# --- 5. REPORTE PDF (CLASE IMPORTANTE) ---
class ReporteAccesosView(APIView):
    def get(self, request):
        inicio = request.query_params.get('inicio')
        fin = request.query_params.get('fin')
        if not inicio or not fin: return Response({'error': 'Faltan fechas'}, status=400)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="accesos.pdf"'
        
        p = canvas.Canvas(response, pagesize=letter)
        p.drawString(50, 750, f"Reporte de Accesos: {inicio} al {fin}")
        p.save()
        return response