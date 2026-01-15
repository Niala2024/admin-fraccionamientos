from rest_framework import serializers
from .models import Pago, TipoEgreso, Egreso

class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        # '__all__' expone todos los campos: casa, monto, fecha, comprobante...
        fields = '__all__'
        # Hacemos que 'usuario' sea de solo lectura para asignarlo automáticamente
        read_only_fields = ('usuario',)

class TipoEgresoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEgreso
        fields = '__all__'
class EgresoSerializer(serializers.ModelSerializer):
    # Para mostrar el nombre del gasto en lugar de solo el ID
    nombre_gasto = serializers.ReadOnlyField(source='tipo.nombre')
    frecuencia = serializers.ReadOnlyField(source='tipo.frecuencia')

    class Meta:
        model = Egreso
        fields = ['id', 'tipo', 'nombre_gasto', 'frecuencia', 'monto', 'fecha_pago', 'descripcion', 'comprobante']