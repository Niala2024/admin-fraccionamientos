from rest_framework import serializers
from .models import Casa, Fraccionamiento, Calle
from django.contrib.auth import get_user_model

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
    calle_nombre = serializers.ReadOnlyField(source='calle.nombre')
    
    propietario_nombre = serializers.SerializerMethodField()
    telefono_propietario = serializers.SerializerMethodField()
    email_propietario = serializers.SerializerMethodField()
    propietario = serializers.SerializerMethodField()

    class Meta:
        model = Casa
        fields = '__all__'
        extra_kwargs = {'fraccionamiento': {'required': False}}

    # 👇 ESTA ES LA FUNCIÓN CORREGIDA Y BLINDADA
    def get_propietario_obj(self, obj):
        # Intento 1: Nombre común personalizado "residentes"
        if hasattr(obj, 'residentes'):
            return obj.residentes.filter(rol__icontains='Residente').first()
        
        # Intento 2: Nombre personalizado "usuarios"
        elif hasattr(obj, 'usuarios'):
            return obj.usuarios.filter(rol__icontains='Residente').first()
            
        # Intento 3: Nombre por defecto "usuario_set" (aunque ya falló, lo dejamos por seguridad)
        elif hasattr(obj, 'usuario_set'):
            return obj.usuario_set.filter(rol__icontains='Residente').first()
            
        return None

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