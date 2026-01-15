from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import Pago, TipoEgreso, Egreso
from .serializers import PagoSerializer, TipoEgresoSerializer, EgresoSerializer
from inmuebles.models import Casa
from decimal import Decimal
from django.http import HttpResponse
from django.core.mail import EmailMessage
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .utils import generar_pdf_financiero
User = get_user_model()

class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all().order_by('-fecha_pago')
    serializer_class = PagoSerializer
    filterset_fields = ['casa', 'estado']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        pago = self.get_object()
        if pago.estado == 'APROBADO':
            return Response({'error': 'Ya aprobado'}, status=400)

        pago.estado = 'APROBADO'
        pago.save()

        casa = pago.casa
        casa.saldo_pendiente -= pago.monto
        casa.save()

        if casa.propietario and casa.propietario.email:
            try:
                asunto = f"✅ Recibo de Pago #{pago.id} - Validado"
                mensaje = f"""
                Estimado vecino,
                Su pago ha sido validado correctamente.
                Concepto: {pago.concepto}
                Monto: ${pago.monto}
                Fecha: {pago.fecha_pago}
                Saldo Restante: ${casa.saldo_pendiente}
                """
                send_mail(asunto, mensaje, settings.EMAIL_HOST_USER, [casa.propietario.email], fail_silently=True)
            except: pass
            
        return Response({'status': 'Aprobado'})

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        pago = self.get_object()
        pago.estado = 'RECHAZADO'
        pago.save()
        return Response({'status': 'Rechazado'})

    @action(detail=False, methods=['post'])
    def cargo_masivo(self, request):
        monto = request.data.get('monto')
        if not monto: return Response({'error': 'Falta monto'}, status=400)
        
        casas = Casa.objects.all()
        for c in casas:
            c.saldo_pendiente += Decimal(str(monto))
            c.save()
        return Response({'status': 'Cargo aplicado a todas las casas'})

class TipoEgresoViewSet(viewsets.ModelViewSet):
    queryset = TipoEgreso.objects.all()
    serializer_class = TipoEgresoSerializer

class EgresoViewSet(viewsets.ModelViewSet):
    queryset = Egreso.objects.all().order_by('-fecha_pago')
    serializer_class = EgresoSerializer

class ReporteFinancieroView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Descargar PDF """
        inicio = request.query_params.get('inicio')
        fin = request.query_params.get('fin')
        
        if not inicio or not fin:
            return Response({'error': 'Fechas requeridas'}, status=400)

        pdf_buffer = generar_pdf_financiero(inicio, fin)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="reporte_financiero_{inicio}_{fin}.pdf"'
        return response

    def post(self, request):
        """ Enviar PDF por Correo """
        inicio = request.data.get('inicio')
        fin = request.data.get('fin')
        destinatarios = request.data.get('destinatarios') # 'todos' o lista de IDs

        if not inicio or not fin:
            return Response({'error': 'Fechas requeridas'}, status=400)

        # 1. Generar PDF
        pdf_buffer = generar_pdf_financiero(inicio, fin)
        pdf_content = pdf_buffer.getvalue()

        # 2. Filtrar Usuarios
        if destinatarios == 'todos':
            users = User.objects.filter(is_active=True).exclude(email='')
            emails = [u.email for u in users]
        else:
            # Si se enviaron IDs específicos (opcional para futuro)
            users = User.objects.filter(id__in=destinatarios).exclude(email='')
            emails = [u.email for u in users]

        if not emails:
            return Response({'error': 'No hay destinatarios con email'}, status=400)

        # 3. Enviar Correo con Adjunto
        try:
            email = EmailMessage(
                subject=f'📊 Estado Financiero: {inicio} al {fin}',
                body='Adjunto encontrará el reporte financiero detallado del periodo solicitado.\n\nAtte. La Administración.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                bcc=emails, # Usamos Copia Oculta para privacidad
            )
            email.attach(f'Reporte_{inicio}_{fin}.pdf', pdf_content, 'application/pdf')
            email.send()
            
            return Response({'status': f'Reporte enviado a {len(emails)} vecinos.'})
        except Exception as e:
            print(e)
            return Response({'error': 'Fallo al enviar correos'}, status=500)