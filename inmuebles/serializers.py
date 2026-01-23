from rest_framework import serializers
from .models import Fraccionamiento, Casa, Calle

class FraccionamientoSerializer(serializers.ModelSerializer):
    # 👇 ESTA LÍNEA ES OBLIGATORIA PARA QUE GUARDE LA FOTO
    imagen_portada = serializers.ImageField(required=False, allow_null=True)
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Fraccionamiento
        fields = '__all__'

class CalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calle
        fields = '__all__'

class CasaSerializer(serializers.ModelSerializer):
    calle_nombre = serializers.ReadOnlyField(source='calle.nombre')
    
    # Campos calculados
    propietario_nombre = serializers.StringRelatedField(source='propietario', read_only=True)
    propietario_id = serializers.PrimaryKeyRelatedField(source='propietario', read_only=True)
    telefono_propietario = serializers.SerializerMethodField() 
    email_propietario = serializers.SerializerMethodField() 

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

    def get_email_propietario(self, obj):
        residente = obj.residentes.first()
        if residente:
            return residente.email
        return None