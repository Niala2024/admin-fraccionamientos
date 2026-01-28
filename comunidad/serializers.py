from rest_framework import serializers
from .models import Publicacion, Encuesta, OpcionEncuesta, Queja

class PublicacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    autor_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Publicacion
        fields = '__all__'
        read_only_fields = ['autor', 'fecha_creacion']

    def get_autor_avatar(self, obj):
        return obj.autor.avatar.url if obj.autor.avatar else None

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