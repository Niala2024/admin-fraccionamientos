from rest_framework import serializers
from django.apps import apps
from .models import Visita, Trabajador, AccesoTrabajador, Bitacora, ReporteDiario, MensajeChat

class TrabajadorSerializer(serializers.ModelSerializer):
    casa_info = serializers.ReadOnlyField(source='casa.numero_exterior')
    class Meta:
        model = Trabajador
        fields = '__all__'

class AccesoTrabajadorSerializer(serializers.ModelSerializer):
    trabajador_nombre = serializers.ReadOnlyField(source='trabajador.nombre_completo')
    casa_datos = serializers.ReadOnlyField(source='trabajador.casa.numero_exterior')
    class Meta:
        model = AccesoTrabajador
        fields = '__all__'

class VisitaSerializer(serializers.ModelSerializer):
    casa_nombre = serializers.ReadOnlyField(source='casa.numero_exterior')
    class Meta:
        model = Visita
        fields = '__all__'
        read_only_fields = ('creado_por', 'fecha_llegada_real', 'fecha_salida_real', 'created_at')

class BitacoraSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.ReadOnlyField(source='autor.username')
    class Meta:
        model = Bitacora
        fields = '__all__'
        read_only_fields = ('autor', 'fecha')

class ReporteDiarioSerializer(serializers.ModelSerializer):
    guardia_nombre = serializers.ReadOnlyField(source='guardia.first_name')
    guardia_username = serializers.ReadOnlyField(source='guardia.username')
    
    class Meta:
        model = ReporteDiario
        fields = '__all__'
        read_only_fields = ('guardia', 'fecha')

class MensajeChatSerializer(serializers.ModelSerializer):
    remitente_nombre = serializers.SerializerMethodField()
    remitente_user = serializers.ReadOnlyField(source='remitente.username')
    casa_remitente = serializers.SerializerMethodField()
    es_mio = serializers.SerializerMethodField()

    class Meta:
        model = MensajeChat
        fields = '__all__'
        read_only_fields = ('remitente', 'fecha', 'es_guardia', 'archivado')

    def get_es_mio(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.remitente == request.user
        return False

    def get_remitente_nombre(self, obj):
        return f"{obj.remitente.first_name} {obj.remitente.last_name}".strip() or obj.remitente.username

    def get_casa_remitente(self, obj):
        try:
            Casa = apps.get_model('inmuebles', 'Casa')
            if obj.remitente.is_staff or obj.remitente.is_superuser:
                return "C5 / Seguridad"
            rol = getattr(obj.remitente, 'rol', '').lower()
            if 'guardia' in rol or 'admin' in rol:
                return "C5 / Seguridad"
            casa = Casa.objects.filter(propietario=obj.remitente).first()
            if casa:
                return f"Casa {casa.numero_exterior}"
            return "Vecino"
        except Exception:
            return "Usuario"