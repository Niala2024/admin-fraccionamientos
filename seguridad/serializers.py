from rest_framework import serializers
from .models import Visita, Trabajador, AccesoTrabajador, Bitacora, ReporteDiario

class TrabajadorSerializer(serializers.ModelSerializer):
    casa_info = serializers.ReadOnlyField(source='casa.numero_exterior')
    class Meta:
        model = Trabajador
        fields = '__all__'

class AccesoTrabajadorSerializer(serializers.ModelSerializer):
    trabajador_nombre = serializers.ReadOnlyField(source='trabajador.nombre_completo')
    casa_datos = serializers.ReadOnlyField(source='trabajador.casa.numero_exterior')
    class Meta:
        model = AccesoTrabajador
        fields = '__all__'

class VisitaSerializer(serializers.ModelSerializer):
    casa_nombre = serializers.ReadOnlyField(source='casa.numero_exterior')
    class Meta:
        model = Visita
        fields = '__all__'

class BitacoraSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
    class Meta:
        model = Bitacora
        fields = '__all__'

# ✅ NUEVO SERIALIZER
class ReporteDiarioSerializer(serializers.ModelSerializer):
    guardia_nombre = serializers.ReadOnlyField(source='guardia.first_name')
    guardia_username = serializers.ReadOnlyField(source='guardia.username')
    
    class Meta:
        model = ReporteDiario
        fields = '__all__'
        read_only_fields = ('guardia', 'fecha')