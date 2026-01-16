from rest_framework import serializers
from .models import Servicio, VotoServicio

class ServicioSerializer(serializers.ModelSerializer):
    promedio = serializers.ReadOnlyField()
    mis_estrellas = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = ['id', 'nombre', 'categoria', 'telefono', 'descripcion', 'foto', 'promedio', 'total_votos', 'mis_estrellas']

    def get_mis_estrellas(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            try:
                voto = VotoServicio.objects.get(servicio=obj, usuario=user)
                return voto.estrellas
            except VotoServicio.DoesNotExist:
                return 0
        return 0