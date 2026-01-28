from rest_framework import viewsets, permissions
from .models import Casa, Reservacion, Amenidad
from .serializers import CasaSerializer, ReservacionSerializer, AmenidadSerializer

# ✅ ESTA ES LA CLASE QUE BUSCABA EL SERVIDOR
class InmuebleViewSet(viewsets.ModelViewSet):
    queryset = Casa.objects.all()
    serializer_class = CasaSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReservacionAmenidadViewSet(viewsets.ModelViewSet):
    queryset = Reservacion.objects.all()
    serializer_class = ReservacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class AmenidadViewSet(viewsets.ModelViewSet):
    queryset = Amenidad.objects.all()
    serializer_class = AmenidadSerializer
    permission_classes = [permissions.IsAuthenticated]