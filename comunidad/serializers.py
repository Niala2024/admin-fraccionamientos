from rest_framework import serializers
from .models import (
    Publicacion, Comentario, Encuesta, OpcionEncuesta, 
    Queja, Aviso, ServicioExterno, CalificacionServicio
)

class ComentarioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ['autor', 'fecha_creacion']

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
    total_votos = serializers.SerializerMethodField()

    class Meta:
        model = Encuesta
        fields = '__all__'

    def get_total_votos(self, obj):
        return sum(op.votos for op in obj.opciones.all())

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