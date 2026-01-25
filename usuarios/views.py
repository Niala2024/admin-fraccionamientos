from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
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
        print("--- DIAGNÓSTICO DE CORREO ---")
        print(f"PUERTO ACTUAL: {settings.EMAIL_PORT}")
        print(f"USA SSL: {settings.EMAIL_USE_SSL}")
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

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # Buscar casa del usuario
        datos_casa = None
        try:
            casa = Casa.objects.filter(propietario=user).first()
            if casa:
                datos_casa = {
                    'id': casa.id,
                    'calle': casa.calle.nombre if casa.calle else '',
                    'numero': casa.numero_exterior,
                    'saldo_pendiente': str(casa.saldo_pendiente)
                }
        except Exception:
            pass

        return Response({
            'token': token.key,
            'user': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}".strip() or user.username,
                'rol': getattr(user, 'rol', 'residente'),
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff
            },
            'casa': datos_casa
        })