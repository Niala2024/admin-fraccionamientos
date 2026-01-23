from rest_framework import serializers
from django.contrib.auth.models import User
from inmuebles.models import Casa 

class UsuarioSerializer(serializers.ModelSerializer):
    # 👇 ESTO ES LO QUE ARREGLA EL ERROR 400: allow_null=True
    casa_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Campo extra para mostrar el nombre completo en el frontend
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'rol', 
            'password', 'casa_id', 'telefono', 'nombre_completo', 'is_staff', 'is_superuser'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def to_representation(self, instance):
        """ Envía al Frontend la info de la casa actual (o vacío si es guardia) """
        ret = super().to_representation(instance)
        try:
            casa = Casa.objects.filter(residentes=instance).first()
            if casa:
                ret['casa_id'] = casa.id
                ret['casa_info'] = f"{casa.calle} #{casa.numero_exterior}"
            else:
                ret['casa_id'] = "" # Importante para que el frontend no falle
        except Exception:
            ret['casa_id'] = ""
        return ret

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        casa_id = validated_data.pop('casa_id', None)
        
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        # Si mandaron casa, la asignamos
        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                casa.residentes.add(user)
            except Casa.DoesNotExist:
                pass
        
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Verificar si 'casa_id' viene en la petición (puede ser un número o None)
        if 'casa_id' in validated_data:
            casa_id = validated_data.pop('casa_id') # Sacamos el valor
            
            # 1. LIMPIEZA: Quitamos al usuario de cualquier casa anterior
            casas_anteriores = Casa.objects.filter(residentes=instance)
            for c in casas_anteriores:
                c.residentes.remove(instance)
            
            # 2. ASIGNACIÓN: Si casa_id tiene valor (es Residente), lo agregamos.
            # Si es None (Guardia), no hacemos nada y se queda sin casa (¡Correcto!)
            if casa_id is not None:
                try:
                    nueva_casa = Casa.objects.get(id=casa_id)
                    nueva_casa.residentes.add(instance)
                except Casa.DoesNotExist:
                    pass 

        # Actualizar resto de campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance