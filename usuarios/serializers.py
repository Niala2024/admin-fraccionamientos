from rest_framework import serializers
from .models import Usuario
from inmuebles.models import Casa 

class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    
    # Campo especial solo para escritura (al crear/editar usuario)
    casa_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Usuario
        # ✅ CORRECCIÓN: Quitamos 'casa' de aquí. Esto soluciona la tabla vacía.
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'telefono', 'rol', 'nombre_completo', 
            'is_staff', 'is_superuser', 'casa_id'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_nombre_completo(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.username

    def create(self, validated_data):
        # 1. Sacamos el ID de la casa si viene
        casa_id = validated_data.pop('casa_id', None)
        
        # 2. Creamos el usuario
        user = Usuario(**validated_data)
        user.set_password(validated_data['password'])
        user.save()

        # 3. Si eligieron casa, vinculamos la casa a este nuevo usuario
        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                casa.propietario = user
                casa.save()
            except Casa.DoesNotExist:
                pass
        
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        casa_id = validated_data.pop('casa_id', None)
        
        # Actualizar campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()

        # --- AQUÍ ESTABA EL ERROR, ESTA ES LA CORRECCIÓN ---
        if casa_id is not None:
            # 1. Quitar al usuario de casas anteriores (usando 'residentes', NO 'propietario')
            casas_anteriores = Casa.objects.filter(residentes=instance)
            for casa_ant in casas_anteriores:
                casa_ant.residentes.remove(instance)
            
            # 2. Asignar a la nueva casa (si se eligió una)
            if casa_id:  # Si casa_id no está vacío
                try:
                    nueva_casa = Casa.objects.get(id=casa_id)
                    nueva_casa.residentes.add(instance)
                except Casa.DoesNotExist:
                    pass # O manejar el error si prefieres
        # ---------------------------------------------------

        return instance