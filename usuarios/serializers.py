from rest_framework import serializers
from django.contrib.auth import get_user_model
from inmuebles.models import Casa

# ✅ IMPORTAMOS LIBRERÍAS DE CORREO Y THREADING
from django.core.mail import send_mail
from django.conf import settings
import threading

User = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    # Campo extra para asignar casa directamente al crear/editar
    casa_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        # ✅ Mantenemos la lista completa de campos para no perder permisos ni nombres
        fields = [
            'id', 'username', 'email', 'password', 'rol', 'telefono', 
            'casa', 'casa_id', 'avatar', 
            'first_name', 'last_name',
            'is_superuser', 'is_staff' 
        ]
        
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None) 
        
        # 1. Crear el usuario
        user = User(**validated_data)
        if password:
            user.set_password(password) # Encriptar contraseña
        user.save()

        # 2. Asignar casa si se envió
        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                user.casa = casa
                user.save()
                casa.propietario = user
                casa.save()
            except Casa.DoesNotExist:
                pass

        # 3. ✅ ENVIAR CORREO DE BIENVENIDA (CON HILO / THREADING)
        # Solo enviamos si tiene email y contraseña definida
        if user.email and password:
            def enviar_correo_background():
                try:
                    asunto = f'Bienvenido a Misión Country - {user.username}'
                    mensaje = f"""
                    Hola {user.first_name or 'Vecino'},

                    Bienvenido a la plataforma digital de Misión Country.
                    
                    Tus credenciales de acceso son:
                    -------------------------------
                    Usuario: {user.username}
                    Contraseña: {password}
                    -------------------------------

                    Por favor ingresa y cambia tu contraseña por seguridad.
                    """
                    
                    send_mail(
                        asunto,
                        mensaje,
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=False,
                    )
                    print(f"✅ Correo enviado a {user.email}")
                except Exception as e:
                    print(f"❌ Error enviando correo: {e}")

            # Ejecutamos el envío en un hilo separado para que el Admin Panel no se trabe
            threading.Thread(target=enviar_correo_background).start()

        return user

    def update(self, instance, validated_data):
        casa_id = validated_data.pop('casa_id', None)
        password = validated_data.pop('password', None)

        # 1. Actualizar campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 2. Si se envió contraseña nueva, la encriptamos
        if password:
            instance.set_password(password)

        instance.save()

        # 3. Lógica para actualizar la casa
        if casa_id is not None:
            try:
                if casa_id:
                    casa = Casa.objects.get(id=casa_id)
                    instance.casa = casa
                    # Opcional: casa.propietario = instance 
                    # casa.save()
                else:
                    instance.casa = None
                instance.save()
            except Casa.DoesNotExist:
                pass
        
        return instance