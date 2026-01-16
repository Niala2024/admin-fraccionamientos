from django.shortcuts import render
from rest_framework import viewsets, status
from django.contrib.auth import get_user_model
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser 
from .models import Usuario
from .serializers import UsuarioSerializer

import csv
from django.db import transaction
from inmuebles.models import Casa 

User = get_user_model()

class UsuarioViewSet(viewsets.ModelViewSet):
    # CORRECCIÓN: Agregamos .order_by('username')
    queryset = User.objects.all().order_by('username')
    serializer_class = UsuarioSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def subir_avatar(self, request):
        user = request.user
        avatar = request.data.get('avatar')
        if avatar:
            user.avatar = avatar
            user.save()
            return Response({'status': 'Avatar actualizado'}, status=status.HTTP_200_OK)
        return Response({'error': 'No se envió imagen'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def importar_masivo(self, request):
        file = request.FILES.get('file')
        if not file: return Response({'error': 'No se envió archivo'}, status=400)
        if not file.name.endswith('.csv'): return Response({'error': 'Debe ser CSV'}, status=400)

        try:
            decoded_file = file.read().decode('utf-8').splitlines()
            reader = csv.DictReader(decoded_file)
            creados = 0
            errores = []

            with transaction.atomic():
                for index, row in enumerate(reader):
                    linea = index + 2
                    username = row.get('username', '').strip()
                    password = row.get('password', '').strip()
                    
                    if not username or not password:
                        errores.append(f"Línea {linea}: Falta usuario/pass")
                        continue
                    if User.objects.filter(username=username).exists():
                        errores.append(f"Línea {linea}: Usuario '{username}' existe")
                        continue

                    casa_obj = None
                    calle = row.get('calle', '').strip()
                    num = row.get('numero_casa', '').strip()
                    if calle and num:
                        casa_obj = Casa.objects.filter(calle__nombre__iexact=calle, numero_exterior=num).first()
                        if not casa_obj:
                            errores.append(f"Línea {linea}: Casa '{calle} #{num}' no existe")
                            continue

                    rol = 'Guardia de Seguridad' if 'guardia' in row.get('rol','').lower() else 'Residente'
                    
                    user = User.objects.create(
                        username=username, email=row.get('email',''), 
                        first_name=row.get('nombre',''), last_name=row.get('apellido',''),
                        telefono=row.get('telefono',''), rol=rol, casa=casa_obj
                    )
                    user.set_password(password)
                    user.save()
                    if casa_obj:
                        casa_obj.propietario = user
                        casa_obj.save()
                    creados += 1

            return Response({'mensaje': f'Creados: {creados}', 'errores': errores})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'rol': user.rol, # Asegúrate de que tu modelo Usuario tenga este campo
            'is_superuser': user.is_superuser, # <--- ¡ESTA ES LA LÍNEA CLAVE! 🔑
            'is_staff': user.is_staff
        })