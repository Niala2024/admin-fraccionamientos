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
        # Lógica para actualizar (por si editas el usuario desde el Admin)
        casa_id = validated_data.pop('casa_id', None)
        
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
            
        # Actualizar resto de campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar casa si se seleccionó una nueva
        if casa_id is not None:
            # Primero liberamos la casa anterior si tenía una
            Casa.objects.filter(propietario=instance).update(propietario=None)
            # Asignamos la nueva
            try:
                nueva_casa = Casa.objects.get(id=casa_id)
                nueva_casa.propietario = instance
                nueva_casa.save()
            except Casa.DoesNotExist:
                pass
                
        return instance