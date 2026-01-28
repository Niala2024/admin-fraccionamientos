from rest_framework import serializers
from .models import (
    Publicacion, Comentario, Encuesta, OpcionEncuesta, VotoUsuario,
    Queja, Aviso, ServicioExterno, CalificacionServicio, ConfiguracionComunidad
)

class ComentarioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    autor_avatar = serializers.SerializerMethodField()
    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ['autor', 'fecha_creacion']
    
    def get_autor_avatar(self, obj):
        if hasattr(obj.autor, 'avatar') and obj.autor.avatar:
            return obj.autor.avatar.url
        return None

class PublicacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    autor_avatar = serializers.SerializerMethodField()
    comentarios = ComentarioSerializer(many=True, read_only=True)
    
    class Meta:
        model = Publicacion
        fields = '__all__'
        read_only_fields = ['autor', 'fecha_creacion']

    def get_autor_avatar(self, obj):
        if hasattr(obj.autor, 'avatar') and obj.autor.avatar:
            return obj.autor.avatar.url
        return None

class OpcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcionEncuesta
        fields = ['id', 'texto', 'votos']

class EncuestaSerializer(serializers.ModelSerializer):
    opciones = OpcionSerializer(many=True, read_only=True)
    # Campo de escritura para recibir las opciones como lista de textos ["Opción A", "Opción B"]
    opciones_data = serializers.ListField(
        child=serializers.CharField(max_length=200), 
        write_only=True,
        required=True
    )
    total_votos = serializers.SerializerMethodField()
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    autor_avatar = serializers.SerializerMethodField()
    ya_vote = serializers.SerializerMethodField()

    class Meta:
        model = Encuesta
        fields = '__all__'
        read_only_fields = ['autor', 'fecha_inicio', 'activa']

    def get_total_votos(self, obj):
        return sum(op.votos for op in obj.opciones.all())

    def get_autor_avatar(self, obj):
        if obj.autor and hasattr(obj.autor, 'avatar') and obj.autor.avatar:
            return obj.autor.avatar.url
        return None

    def get_ya_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VotoUsuario.objects.filter(usuario=request.user, encuesta=obj).exists()
        return False

    def create(self, validated_data):
        opciones_textos = validated_data.pop('opciones_data', [])
        encuesta = Encuesta.objects.create(**validated_data)
        for texto in opciones_textos:
            OpcionEncuesta.objects.create(encuesta=encuesta, texto=texto)
        return encuesta

class QuejaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queja
        fields = '__all__'
        read_only_fields = ['usuario', 'estado', 'fecha_creacion']

class AvisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aviso
        fields = '__all__'

class CalificacionServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalificacionServicio
        fields = '__all__'

class ServicioExternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicioExterno
        fields = '__all__'
        read_only_fields = ['creado_por', 'fecha_registro']

# ✅ NUEVO SERIALIZER
class ConfiguracionComunidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionComunidad
        fields = '__all__'