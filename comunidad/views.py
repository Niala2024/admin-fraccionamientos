from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

# IMPORTAR LOS NUEVOS MODELOS Y SERIALIZERS
from .models import Encuesta, OpcionEncuesta, VotoUsuario, Publicacion, Comentario, Queja, Aviso, ServicioExterno, CalificacionServicio
from .serializers import EncuestaSerializer, PublicacionSerializer, ComentarioSerializer, QuejaSerializer, AvisoSerializer, ServicioExternoSerializer, CalificacionServicioSerializer

User = get_user_model()

class EncuestaViewSet(viewsets.ModelViewSet):
    queryset = Encuesta.objects.filter(activa=True).order_by('-fecha_creacion')
    serializer_class = EncuestaSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        titulo = request.data.get('titulo')
        descripcion = request.data.get('descripcion')
        opciones_raw = request.data.get('opciones')

        if not titulo or not opciones_raw or len(opciones_raw) < 2:
            return Response({'error': 'Se requiere título y al menos 2 opciones'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            encuesta = Encuesta.objects.create(titulo=titulo, descripcion=descripcion) # Ajuste: creador puede no estar en modelo base, simplificado
            for op_texto in opciones_raw:
                if str(op_texto).strip():
                    OpcionEncuesta.objects.create(encuesta=encuesta, texto=str(op_texto).strip())

            # Lógica de correo (simplificada para evitar errores si no hay SMTP configurado)
            # ... (Tu código de correo aquí) ...
            
            serializer = self.get_serializer(encuesta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def votar(self, request, pk=None):
        encuesta = self.get_object()
        usuario = request.user
        opcion_id = request.data.get('opcion_id')

        if VotoUsuario.objects.filter(usuario=usuario, encuesta=encuesta).exists():
            return Response({"error": "Ya votaste en esta encuesta"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            opcion = OpcionEncuesta.objects.get(id=opcion_id, encuesta=encuesta)
            opcion.votos += 1
            opcion.save()
            VotoUsuario.objects.create(usuario=usuario, encuesta=encuesta)
            return Response({"mensaje": "Voto registrado", "votos_actuales": opcion.votos}, status=status.HTTP_200_OK)
        except OpcionEncuesta.DoesNotExist:
            return Response({"error": "Opción no válida"}, status=status.HTTP_404_NOT_FOUND)

class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all().order_by('-fecha')
    serializer_class = PublicacionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    @action(detail=True, methods=['post'])
    def comentar(self, request, pk=None):
        publicacion = self.get_object()
        texto = request.data.get('texto')
        if not texto: return Response({"error": "Vacío"}, status=400)
        Comentario.objects.create(publicacion=publicacion, autor=request.user, texto=texto)
        return Response({"mensaje": "Comentario agregado"}, status=201)

class QuejaViewSet(viewsets.ModelViewSet):
    serializer_class = QuejaSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.rol in ['admin', 'Administrador']: return Queja.objects.all().order_by('-fecha')
        return Queja.objects.filter(autor=user).order_by('-fecha')
    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

class AvisoViewSet(viewsets.ModelViewSet):
    queryset = Aviso.objects.all().order_by('-fecha_creacion')
    serializer_class = AvisoSerializer
    @action(detail=False, methods=['get'])
    def ultimo(self, request):
        aviso = Aviso.objects.filter(activo=True).order_by('-fecha_creacion').first()
        return Response(AvisoSerializer(aviso).data) if aviso else Response({})

# --- NUEVO VIEWSET: DIRECTORIO DE SERVICIOS ---
class ServicioExternoViewSet(viewsets.ModelViewSet):
    queryset = ServicioExterno.objects.all().order_by('-fecha_registro')
    serializer_class = ServicioExternoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        servicio = self.get_object()
        estrellas = request.data.get('estrellas')
        comentario = request.data.get('comentario', '')

        if not estrellas:
            return Response({'error': 'Faltan estrellas'}, status=400)

        calif, created = CalificacionServicio.objects.update_or_create(
            servicio=servicio,
            usuario=request.user,
            defaults={'estrellas': estrellas, 'comentario': comentario}
        )
        return Response({'mensaje': 'Calificación guardada'})