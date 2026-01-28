from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import (
    Encuesta, OpcionEncuesta, VotoUsuario, Publicacion, 
    Comentario, Queja, Aviso, ServicioExterno, CalificacionServicio, ConfiguracionComunidad
)
from .serializers import (
    EncuestaSerializer, PublicacionSerializer, ComentarioSerializer, 
    QuejaSerializer, AvisoSerializer, ServicioExternoSerializer, 
    CalificacionServicioSerializer, ConfiguracionComunidadSerializer
)

User = get_user_model()

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        autor = getattr(obj, 'autor', None) or getattr(obj, 'usuario', None) or getattr(obj, 'creado_por', None)
        return autor == request.user or request.user.is_staff

class ConfiguracionComunidadViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def list(self, request):
        config = ConfiguracionComunidad.objects.first()
        if not config:
            return Response({})
        # ✅ CAMBIO: Agregamos context={'request': request} para URL absoluta
        serializer = ConfiguracionComunidadSerializer(config, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        config = ConfiguracionComunidad.objects.first()
        # ✅ CAMBIO: Agregamos context={'request': request} aquí también
        if config:
            serializer = ConfiguracionComunidadSerializer(config, data=request.data, partial=True, context={'request': request})
        else:
            serializer = ConfiguracionComunidadSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class EncuestaViewSet(viewsets.ModelViewSet):
    queryset = Encuesta.objects.filter(activa=True).order_by('-fecha_inicio')
    serializer_class = EncuestaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def votar(self, request, pk=None):
        encuesta = self.get_object()
        opcion_id = request.data.get('opcion')
        
        if VotoUsuario.objects.filter(usuario=request.user, encuesta=encuesta).exists():
            return Response({'error': 'Ya votaste'}, status=400)

        try:
            opcion = OpcionEncuesta.objects.get(id=opcion_id, encuesta=encuesta)
            opcion.votos += 1
            opcion.save()
            VotoUsuario.objects.create(usuario=request.user, encuesta=encuesta)
            return Response({'mensaje': 'Voto registrado'})
        except OpcionEncuesta.DoesNotExist:
            return Response({'error': 'Opción inválida'}, status=404)

class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all().order_by('-fecha_creacion')
    serializer_class = PublicacionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

class QuejaViewSet(viewsets.ModelViewSet):
    serializer_class = QuejaSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Queja.objects.all().order_by('-fecha_creacion')
        return Queja.objects.filter(usuario=user).order_by('-fecha_creacion')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class AvisoViewSet(viewsets.ModelViewSet):
    queryset = Aviso.objects.filter(vigente=True).order_by('-fecha_creacion')
    serializer_class = AvisoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def ultimo(self, request):
        aviso = self.queryset.first()
        if aviso:
            return Response(self.get_serializer(aviso).data)
        return Response({})

class ServicioExternoViewSet(viewsets.ModelViewSet):
    queryset = ServicioExterno.objects.filter(aprobado=True).order_by('-fecha_registro')
    serializer_class = ServicioExternoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)