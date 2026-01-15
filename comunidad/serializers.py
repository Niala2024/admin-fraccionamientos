from rest_framework import serializers
from django.db.models import Avg
from .models import Encuesta, OpcionEncuesta, Publicacion, Comentario, Queja, Aviso, ServicioExterno, CalificacionServicio

class OpcionEncuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcionEncuesta
        fields = '__all__'

class EncuestaSerializer(serializers.ModelSerializer):
    opciones = OpcionEncuestaSerializer(many=True, read_only=True)
    class Meta:
        model = Encuesta
        fields = '__all__'

class ComentarioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
    class Meta:
        model = Comentario
        fields = '__all__'

class PublicacionSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
    autor_avatar = serializers.ImageField(source='autor.avatar', read_only=True)
    comentarios = ComentarioSerializer(many=True, read_only=True)
    class Meta:
        model = Publicacion
        fields = '__all__'

class QuejaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queja
        fields = '__all__'

class AvisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aviso
        fields = '__all__'

# --- SERIALIZERS NUEVOS PARA DIRECTORIO ---
class CalificacionServicioSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='usuario.username')
    class Meta:
        model = CalificacionServicio
        fields = ['id', 'estrellas', 'comentario', 'autor_nombre', 'fecha']

class ServicioExternoSerializer(serializers.ModelSerializer):
    promedio = serializers.SerializerMethodField()
    total_votos = serializers.SerializerMethodField()
    mis_estrellas = serializers.SerializerMethodField() 

    class Meta:
        model = ServicioExterno
        fields = '__all__'

    def get_promedio(self, obj):
        prom = obj.calificaciones.aggregate(Avg('estrellas'))['estrellas__avg']
        return round(prom, 1) if prom else 0

    def get_total_votos(self, obj):
        return obj.calificaciones.count()

    def get_mis_estrellas(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            voto = obj.calificaciones.filter(usuario=request.user).first()
            return voto.estrellas if voto else 0
        return 0