from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from django.core.mail import send_mail
from django.conf import settings
from django.apps import apps 

from .models import Usuario
from .serializers import UsuarioSerializer
from inmuebles.models import Casa

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['post'])
    def enviar_correo_vecino(self, request):
        print("--- DIAGNÓSTICO DE CORREO ---")
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
    # Permisos abiertos para poder loguearse
    authentication_classes = []  
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        # 1. Validar credenciales
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # 2. Generar Token
        token, created = Token.objects.get_or_create(user=user)

        # 3. Lógica Robusta para encontrar la Casa
        datos_casa = None
        casa_str = "Sin Asignar"

        # Opción A: Buscar si el usuario tiene la casa en su perfil (Relación directa)
        if hasattr(user, 'casa') and user.casa:
            casa_obj = user.casa
            datos_casa = {
                'id': casa_obj.id,
                'calle': casa_obj.calle.nombre if casa_obj.calle else '',
                'numero': casa_obj.numero_exterior,
                'saldo_pendiente': str(casa_obj.saldo_pendiente)
            }
            casa_str = str(casa_obj)

        # Opción B: Si no funcionó la A, buscar si es Propietario en la tabla Casa
        if not datos_casa:
            try:
                casa_obj = Casa.objects.filter(propietario=user).first()
                if casa_obj:
                    datos_casa = {
                        'id': casa_obj.id,
                        'calle': casa_obj.calle.nombre if casa_obj.calle else '',
                        'numero': casa_obj.numero_exterior,
                        'saldo_pendiente': str(casa_obj.saldo_pendiente)
                    }
                    casa_str = str(casa_obj)
            except Exception:
                pass

        # 4. Respuesta Final
        # ✅ CAMBIO CLAVE: Usamos 'UsuarioSerializer(user).data' en lugar de construirlo a mano.
        # Esto asegura que se envíen: telefono, nombre completo, rol, etc.
        return Response({
            'token': token.key,
            'user': UsuarioSerializer(user).data, 
            'casa': datos_casa, # Objeto con detalles (id, calle, saldo)
            'casa_nombre': casa_str # Texto simple para mostrar
        })