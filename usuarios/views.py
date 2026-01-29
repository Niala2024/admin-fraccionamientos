from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from django.core.mail import send_mail
from django.conf import settings

from .models import Usuario
from .serializers import UsuarioSerializer
from inmuebles.models import Casa

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['post'])
    def enviar_correo_vecino(self, request):
        destinatario = request.data.get('destinatario')
        asunto = request.data.get('asunto')
        mensaje = request.data.get('mensaje')
        if not destinatario or not asunto or not mensaje:
            return Response({'error': 'Faltan datos'}, status=400)
        try:
            send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, [destinatario], fail_silently=False)
            return Response({'status': 'Enviado'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

# ✅ ESTA CLASE ES VITAL: Coincide con tu urls.py y Login.jsx
class CustomAuthToken(ObtainAuthToken):
    authentication_classes = []  
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # Lógica para encontrar la casa del usuario
        datos_casa = None
        casa_str = "Sin Asignar"

        if hasattr(user, 'casa') and user.casa:
            casa_obj = user.casa
            datos_casa = {
                'id': casa_obj.id,
                'calle': casa_obj.calle.nombre if casa_obj.calle else '',
                'numero': casa_obj.numero_exterior,
                'saldo_pendiente': str(casa_obj.saldo_pendiente)
            }
            casa_str = str(casa_obj)
        else:
            # Intento de busqueda inversa si es propietario
            try:
                casa_obj = Casa.objects.filter(propietario=user).first()
                if casa_obj:
                    datos_casa = {'id': casa_obj.id, 'numero': casa_obj.numero_exterior}
                    casa_str = str(casa_obj)
            except:
                pass

        return Response({
            'token': token.key,
            'user': UsuarioSerializer(user).data, 
            'casa': datos_casa,
            'casa_nombre': casa_str
        })