from rest_framework import serializers
from django.contrib.auth import get_user_model
from inmuebles.models import Casa

User = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    # Campo extra para asignar casa directamente al crear/editar
    casa_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'rol', 'telefono', 'casa', 'casa_id', 'avatar']
        # 'required': False es vital para poder editar el usuario sin obligar a cambiar su password
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None) # Usamos None para evitar error si falta
        
        user = User(**validated_data)
        if password:
            user.set_password(password) # Encriptar contraseña
        user.save()

        # Tu lógica original para asignar casa
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

    # --- NUEVO MÉTODO: UPDATE ---
    # Este era el que faltaba para que al editar NO se rompa el login
    def update(self, instance, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None)

        # 1. Actualizar campos normales (email, telefono, etc.)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 2. Si se envió una nueva contraseña, la encriptamos.
        # Si no se envió, se mantiene la anterior intacta.
        if password:
            instance.set_password(password)

        instance.save()

        # 3. Lógica para actualizar la casa al editar (Igual que en create)
        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                instance.casa = casa
                instance.save()
                casa.propietario = instance
                casa.save()
            except Casa.DoesNotExist:
                pass
        
        return instance