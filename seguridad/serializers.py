from rest_framework import serializers
from .models import Visita, Trabajador, AccesoTrabajador, Bitacora

class VisitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visita
        fields = '__all__'

class TrabajadorSerializer(serializers.ModelSerializer):
    # Campo extra para mostrar en texto dónde trabaja (para la tabla)
    casa_info = serializers.SerializerMethodField()

    class Meta:
        model = Trabajador
        fields = '__all__'

    def get_casa_info(self, obj):
        if obj.casa_asignada:
            return f"Casa {obj.casa_asignada.numero_exterior}"
        return "Fraccionamiento (General)"

class AccesoTrabajadorSerializer(serializers.ModelSerializer):
    nombre = serializers.ReadOnlyField(source='trabajador.nombre_completo')
    # Obtenemos info de la casa a través del trabajador
    casa = serializers.ReadOnlyField(source='trabajador.casa_asignada.numero_exterior', default='General')
    
    class Meta:
        model = AccesoTrabajador
        fields = '__all__'

class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')
    class Meta:
        model = Bitacora
        fields = '__all__'