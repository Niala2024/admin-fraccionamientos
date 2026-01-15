from rest_framework import viewsets, exceptions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Casa, Fraccionamiento, Calle
from .serializers import CasaSerializer, FraccionamientoSerializer, CalleSerializer

class FraccionamientoViewSet(viewsets.ModelViewSet):
    serializer_class = FraccionamientoSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        # CORRECCIÓN: Agregamos .order_by('nombre') al final de cada consulta
        user = self.request.user
        if user.is_superuser:
            return Fraccionamiento.objects.all().order_by('nombre')
        if user.fraccionamiento_administrado:
            return Fraccionamiento.objects.filter(id=user.fraccionamiento_administrado.id).order_by('nombre')
        if hasattr(user, 'casa') and user.casa:
            return Fraccionamiento.objects.filter(id=user.casa.fraccionamiento.id).order_by('nombre')
        return Fraccionamiento.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise exceptions.PermissionDenied("Solo el Super Administrador puede registrar nuevos fraccionamientos.")
        return super().create(request, *args, **kwargs)

class CalleViewSet(viewsets.ModelViewSet):
    # CORRECCIÓN: Agregamos .order_by('nombre')
    queryset = Calle.objects.all().order_by('nombre')
    serializer_class = CalleSerializer

class CasaViewSet(viewsets.ModelViewSet):
    # Este ya estaba bien, lo dejamos igual
    queryset = Casa.objects.all().order_by('calle__nombre', 'numero_exterior')
    serializer_class = CasaSerializer