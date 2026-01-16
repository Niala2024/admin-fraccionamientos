from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Servicio, VotoServicio
from .serializers import ServicioSerializer

class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.all().order_by('-total_votos')
    serializer_class = ServicioSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Asigna automáticamente el usuario que crea el servicio
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def calificar(self, request, pk=None):
        servicio = self.get_object()
        estrellas = request.data.get('estrellas')

        if not estrellas or not (1 <= int(estrellas) <= 5):
            return Response({'error': 'Estrellas deben ser entre 1 y 5'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar si ya votó para actualizar o crear
        voto, created = VotoServicio.objects.get_or_create(
            servicio=servicio,
            usuario=request.request.user,
            defaults={'estrellas': estrellas}
        )

        if not created:
            # Si ya existía, restamos el voto anterior antes de sumar el nuevo
            servicio.total_puntos -= voto.estrellas
            voto.estrellas = int(estrellas)
            voto.save()
        else:
            servicio.total_votos += 1

        servicio.total_puntos += int(estrellas)
        servicio.save()

        return Response({'status': 'Calificación guardada', 'promedio': servicio.promedio})