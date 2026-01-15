from django.db import models
from inmuebles.models import Casa

class Pago(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
    ]
    casa = models.ForeignKey(Casa, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    concepto = models.CharField(max_length=200)
    fecha_pago = models.DateField()
    comprobante = models.ImageField(upload_to='comprobantes/', blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE') # Nuevo
    
    def __str__(self):
        return f"{self.casa} - ${self.monto} ({self.estado})"

class TipoEgreso(models.Model):
    FRECUENCIA_CHOICES = [
        ('SEMANAL', 'Semanal'), ('QUINCENAL', 'Quincenal'),
        ('MENSUAL', 'Mensual'), ('ANUAL', 'Anual'), ('UNICO', 'Pago Único / Extra'),
    ]
    nombre = models.CharField(max_length=100)
    frecuencia = models.CharField(max_length=20, choices=FRECUENCIA_CHOICES, default='MENSUAL')
    es_fijo = models.BooleanField(default=True)
    def __str__(self): return self.nombre

class Egreso(models.Model):
    tipo = models.ForeignKey(TipoEgreso, on_delete=models.PROTECT)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField(auto_now_add=True)
    descripcion = models.TextField(blank=True, null=True)
    comprobante = models.ImageField(upload_to='egresos/', blank=True, null=True)