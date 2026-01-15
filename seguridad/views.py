from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Q

# Importaciones Correctas de Modelos
from .models import Visita, Bitacora, AccesoTrabajador, Trabajador
from .serializers import VisitaSerializer, BitacoraSerializer, AccesoTrabajadorSerializer, TrabajadorSerializer

# Importación de la utilidad PDF
from .utils import generar_pdf_accesos

class VisitaViewSet(viewsets.ModelViewSet):
    serializer_class = VisitaSerializer
    
    def get_queryset(self):
        qs = Visita.objects.all().order_by('-fecha_llegada')
        inicio = self.request.query_params.get('inicio')
        fin = self.request.query_params.get('fin')
        
        if inicio and fin:
            qs = qs.filter(fecha_llegada__range=[inicio, f"{fin} 23:59:59"])
        
        user = self.request.user
        if user.rol in ['guardia', 'Seguridad', 'admin', 'Administrador', 'Guardia de Seguridad']:
            return qs
        if hasattr(user, 'casa') and user.casa:
            return qs.filter(casa=user.casa)
        return qs.none()

    @action(detail=False, methods=['post'])
    def validar_qr(self, request):
        qr_code = request.data.get('qr')
        if not qr_code: return Response({'error': 'Falta código QR'}, status=400)

        if qr_code.startswith('WORKER-'):
            try:
                id_trabajador = qr_code.split('-')[1]
                trabajador = Trabajador.objects.get(id=id_trabajador, activo=True)
                acceso_activo = AccesoTrabajador.objects.filter(trabajador=trabajador, fecha_salida__isnull=True).last()
                
                if acceso_activo:
                    acceso_activo.fecha_salida = timezone.now()
                    acceso_activo.save()
                    return Response({'status': 'SALIDA REGISTRADA', 'nombre': trabajador.nombre_completo, 'tipo': 'Trabajador', 'foto': trabajador.foto.url if trabajador.foto else None})
                else:
                    AccesoTrabajador.objects.create(trabajador=trabajador, fecha_entrada=timezone.now())
                    dest = f"Casa {trabajador.casa_asignada.numero_exterior}" if trabajador.casa_asignada else "General"
                    return Response({'status': 'ENTRADA AUTORIZADA', 'nombre': trabajador.nombre_completo, 'tipo': 'Trabajador', 'destino': dest, 'foto': trabajador.foto.url if trabajador.foto else None})
            except Trabajador.DoesNotExist: return Response({'error': 'Trabajador no encontrado'}, status=404)

        try:
            visita = Visita.objects.get(codigo_qr=qr_code)
            if visita.estatus == 'COMPLETADO': return Response({'error': 'Pase ya utilizado'}, status=400)
            
            if visita.fecha_salida_real is None:
                return Response({'status': 'ENTRADA AUTORIZADA', 'nombre': visita.nombre_visitante, 'tipo': visita.get_tipo_display(), 'destino': str(visita.casa)})
            
            visita.estatus = 'COMPLETADO'
            visita.fecha_salida_real = timezone.now()
            visita.save()
            return Response({'status': 'SALIDA REGISTRADA', 'nombre': visita.nombre_visitante})
        except Visita.DoesNotExist: return Response({'error': 'Código QR no válido'}, status=404)

class TrabajadorViewSet(viewsets.ModelViewSet):
    serializer_class = TrabajadorSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser) 
    
    def get_queryset(self):
        user = self.request.user
        if user.rol in ['admin', 'Administrador', 'Guardia de Seguridad']: return Trabajador.objects.all()
        if hasattr(user, 'casa') and user.casa: return Trabajador.objects.filter(casa_asignada=user.casa, activo=True)
        return Trabajador.objects.none()
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'casa') and self.request.user.casa: serializer.save(casa_asignada=self.request.user.casa)
        else: serializer.save()

class AccesoTrabajadorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccesoTrabajadorSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = AccesoTrabajador.objects.all().order_by('-fecha_entrada')
        inicio = self.request.query_params.get('inicio')
        fin = self.request.query_params.get('fin')
        if inicio and fin: qs = qs.filter(fecha_entrada__range=[inicio, f"{fin} 23:59:59"])
        return qs

class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all().order_by('-fecha')
    serializer_class = BitacoraSerializer
    permission_classes = [IsAuthenticated]

# --- VISTA DE REPORTE CONECTADA A UTILS ---
class ReporteAccesosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inicio = request.query_params.get('inicio')
        fin = request.query_params.get('fin')
        
        if not inicio or not fin:
            return Response({'error': 'Fechas requeridas'}, status=400)

        fecha_fin_ajustada = f"{fin} 23:59:59"
        
        accesos_trab = AccesoTrabajador.objects.filter(fecha_entrada__range=[inicio, fecha_fin_ajustada])
        accesos_prov = Visita.objects.filter(
            fecha_llegada__range=[inicio, fecha_fin_ajustada],
            tipo='PROVEEDOR'
        )

        try:
            # Usamos la función de utils.py
            buffer = generar_pdf_accesos(accesos_trab, accesos_prov, inicio, fin)
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Accesos_{inicio}_{fin}.pdf"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)