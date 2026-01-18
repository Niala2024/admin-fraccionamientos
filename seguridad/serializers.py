from rest_framework import serializers
from .models import Visita, Trabajador, AccesoTrabajador, Bitacora, ReporteDiario, MensajeChat
from inmuebles.models import Casa # Importación directa para evitar errores

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

# ✅ SERIALIZADOR DEL CHAT (CORREGIDO)
class MensajeChatSerializer(serializers.ModelSerializer):
    # Nombre para mostrar (Ej: "Juan Perez")
    remitente_nombre = serializers.SerializerMethodField()
    # Usuario técnico para que el Frontend sepa si es mensaje propio (Ej: "jperez")
    remitente_user = serializers.ReadOnlyField(source='remitente.username')
    # Info de origen (Ej: "Casa 12" o "Seguridad")
    casa_remitente = serializers.SerializerMethodField()

    class Meta:
        model = MensajeChat
        fields = '__all__'
        read_only_fields = ('remitente', 'fecha')

    def get_remitente_nombre(self, obj):
        return f"{obj.remitente.first_name} {obj.remitente.last_name}".strip() or obj.remitente.username

    def get_casa_remitente(self, obj):
        try:
            # 1. Si es Staff/Guardia, no buscamos casa, retornamos directo.
            if obj.remitente.is_staff or obj.remitente.is_superuser:
                return "C5 / Seguridad"
            
            rol = getattr(obj.remitente, 'rol', '').lower()
            if 'guardia' in rol or 'admin' in rol:
                return "C5 / Seguridad"

            # 2. Si es residente, buscamos su casa de forma segura
            casa = Casa.objects.filter(propietario=obj.remitente).first()
            if casa:
                return f"Casa {casa.numero_exterior}"
            
            return "Vecino"
        except Exception:
            # Si algo falla, no rompemos el servidor (Error 500), solo devolvemos genérico
            return "Usuario"