from rest_framework import serializers
from .models import Usuario
from inmuebles.models import Casa 

class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    
    # Definimos los campos permitiendo nulos
    casa_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'telefono', 'rol', 'nombre_completo', 
            'is_staff', 'is_superuser', 'casa_id', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    # 👇 ESTA ES LA MAGIA: Interceptamos los datos antes de validar
    def to_internal_value(self, data):
        # Hacemos una copia mutable de los datos por si acaso
        if hasattr(data, 'copy'):
            data = data.copy()

        # Si viene 'casa_id', revisamos si es texto vacío o 'null' y lo forzamos a None
        if 'casa_id' in data:
            valor = data.get('casa_id')
            if valor == "" or valor == "null" or valor == "undefined":
                data['casa_id'] = None
        
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        try:
            casa = Casa.objects.filter(residentes=instance).first()
            if casa:
                ret['casa_id'] = casa.id
                ret['casa_info'] = f"{casa.calle} #{casa.numero_exterior}"
            else:
                ret['casa_id'] = ""
        except Exception:
            ret['casa_id'] = ""
        return ret 

    def get_nombre_completo(self, obj):
        n = f"{obj.first_name} {obj.last_name}".strip()
        return n if n else obj.username

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        casa_id = validated_data.pop('casa_id', None)
        
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        if casa_id:
            try:
                casa = Casa.objects.get(id=casa_id)
                casa.residentes.add(user)
            except Casa.DoesNotExist:
                pass
        
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Lógica de Casa
        if 'casa_id' in validated_data:
            casa_id = validated_data.pop('casa_id')
            
            # Limpiar casas anteriores
            casas_anteriores = Casa.objects.filter(residentes=instance)
            for c in casas_anteriores:
                c.residentes.remove(instance)
            
            # Asignar nueva si existe
            if casa_id is not None:
                try:
                    nueva_casa = Casa.objects.get(id=casa_id)
                    nueva_casa.residentes.add(instance)
                except Casa.DoesNotExist:
                    pass 

        # Actualizar campos estándar
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance