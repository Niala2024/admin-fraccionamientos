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
    
    # 1. Definimos ambos campos como "Calculados" (MethodField)
    propietario = serializers.SerializerMethodField()
    telefono_propietario = serializers.SerializerMethodField() 

    class Meta:
        model = Casa
        fields = '__all__'

    # 2. Función para obtener el NOMBRE
    def get_propietario(self, obj):
        residente = obj.residentes.first() 
        if residente:
            return residente.first_name or residente.username
        return None

    # 3. Función para obtener el TELÉFONO (¡Esta es la solución!)
    def get_telefono_propietario(self, obj):
        residente = obj.residentes.first()
        if residente:
            return residente.telefono # Devuelve el teléfono real del usuario
        return None