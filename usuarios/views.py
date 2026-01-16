from rest_framework import viewsets, status
from rest_framework.decorators import action # <--- IMPORTANTE
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.core.mail import send_mail # <--- IMPORTANTE
from django.conf import settings       # <--- IMPORTANTE

from .models import Usuario
from .serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    # ✅ NUEVA ACCIÓN: Enviar correo personalizado desde el Admin Panel
    @action(detail=False, methods=['post'])
    def enviar_correo_vecino(self, request):
        destinatario = request.data.get('destinatario')
        asunto = request.data.get('asunto')
        mensaje = request.data.get('mensaje')

        if not destinatario or not asunto or not mensaje:
            return Response({'error': 'Faltan datos (destinatario, asunto o mensaje)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_mail(
                asunto,
                mensaje,
                settings.DEFAULT_FROM_EMAIL,
                [destinatario],
                fail_silently=False,
            )
            return Response({'status': 'Correo enviado correctamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        rol_usuario = getattr(user, 'rol', 'residente')

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'rol': rol_usuario,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff
        })