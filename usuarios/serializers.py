from rest_framework import serializers
from django.contrib.auth import get_user_model
from inmuebles.models import Casa

User = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    # Campo extra para asignar casa directamente al crear/editar
    casa_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        # ✅ CORRECCIÓN: Agregamos 'first_name' y 'last_name' para que se guarden
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'rol', 'telefono', 'casa', 'casa_id', 'avatar']
        
        # 'required': False es vital para poder editar el usuario sin obligar a cambiar su password
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None) 
        
        user = User(**validated_data)
        if password:
            user.set_password(password) # Encriptar contraseña
        user.save()

        # Asignar casa si se envió
        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                user.casa = casa
                user.save()
                casa.propietario = user
                casa.save()
            except Casa.DoesNotExist:
                pass

        return user

    def update(self, instance, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None)

        # 1. Actualizar campos normales (Ahora INCLUYE first_name gracias a la corrección arriba)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 2. Si se envió contraseña nueva, la encriptamos
        if password:
            instance.set_password(password)

        instance.save()

        # 3. Lógica para actualizar la casa
        if casa_id is not None: # Verifica explícitamente si enviaron un ID (aunque sea 0 o null)
            try:
                if casa_id:
                    casa = Casa.objects.get(id=casa_id)
                    instance.casa = casa
                    # Opcional: Si quieres que sea el nuevo propietario
                    # casa.propietario = instance 
                    # casa.save()
                else:
                    # Si mandaron null o vacío, desvinculamos
                    instance.casa = None
                instance.save()
            except Casa.DoesNotExist:
                pass
        
        return instance