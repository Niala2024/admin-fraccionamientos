from rest_framework import viewsets
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

# Importamos tu modelo y serializador (Asegúrate que los nombres sean correctos)
from .models import Usuario
from .serializers import UsuarioSerializer

# --- CLASE QUE FALTABA (RESTAURADA) ---
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

# --- CLASE DE LOGIN MEJORADA ---
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # Obtenemos el rol de forma segura (si no tiene, ponemos 'residente')
        rol_usuario = getattr(user, 'rol', 'residente')

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'rol': rol_usuario,
            'is_superuser': user.is_superuser, # ¡La clave para el admin!
            'is_staff': user.is_staff
        })