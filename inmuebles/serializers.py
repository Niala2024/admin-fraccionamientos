from rest_framework import serializers
from .models import Fraccionamiento, Casa, Calle

class FraccionamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fraccionamiento
        fields = '__all__'

class CalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calle
        fields = ['id', 'nombre']

class CasaSerializer(serializers.ModelSerializer):
    calle_nombre = serializers.ReadOnlyField(source='calle.nombre')
    
    # Campos calculados (Nombre, Teléfono y AHORA Email)
    propietario = serializers.SerializerMethodField()
    telefono_propietario = serializers.SerializerMethodField() 
    email_propietario = serializers.SerializerMethodField() # ✅ NUEVO

    class Meta:
        model = Casa
        fields = '__all__'

    def get_propietario(self, obj):
        residente = obj.residentes.first() 
        if residente:
            return residente.first_name or residente.username
        return None

    def get_telefono_propietario(self, obj):
        residente = obj.residentes.first()
        if residente:
            return residente.telefono 
        return None

    # ✅ FUNCIÓN NUEVA: Obtener el email del residente principal
    def get_email_propietario(self, obj):
        residente = obj.residentes.first()
        if residente:
            return residente.email
        return None