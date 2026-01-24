from rest_framework import serializers
from .models import Casa, Fraccionamiento, Calle
from django.contrib.auth import get_user_model

# Obtenemos el modelo de Usuario real
User = get_user_model()

class FraccionamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fraccionamiento
        fields = '__all__'

class CalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calle
        fields = '__all__'

class CasaSerializer(serializers.ModelSerializer):
    # 👇 ESTOS SON LOS CAMPOS MÁGICOS QUE FALTABAN
    calle_nombre = serializers.ReadOnlyField(source='calle.nombre')
    
    # Campos personalizados para traer datos del dueño
    propietario_nombre = serializers.SerializerMethodField()
    telefono_propietario = serializers.SerializerMethodField()
    email_propietario = serializers.SerializerMethodField()
    propietario = serializers.SerializerMethodField() # Para saber si existe (true/false)

    class Meta:
        model = Casa
        fields = '__all__'
        # Hacemos que el fraccionamiento no sea exigente al crear
        extra_kwargs = {'fraccionamiento': {'required': False}}

    # 👇 FUNCIONES QUE BUSCAN LA INFORMACIÓN
    def get_propietario_obj(self, obj):
        # Busca el primer usuario que tenga esta casa asignada y sea Residente
        # Nota: 'usuario_set' es el nombre por defecto de la relación inversa en Django
        return obj.usuario_set.filter(rol__icontains='Residente').first()

    def get_propietario_nombre(self, obj):
        p = self.get_propietario_obj(obj)
        return f"{p.first_name} {p.last_name}" if p else "Sin Asignar"

    def get_telefono_propietario(self, obj):
        p = self.get_propietario_obj(obj)
        return p.telefono if p and hasattr(p, 'telefono') else ""

    def get_email_propietario(self, obj):
        p = self.get_propietario_obj(obj)
        return p.email if p else ""
    
    def get_propietario(self, obj):
        return self.get_propietario_obj(obj) is not None