from django.db import models
from django.contrib.auth import get_user_model
from inmuebles.models import Casa

User = get_user_model()

class Trabajador(models.Model):
    nombre_completo = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True) 
    foto = models.ImageField(upload_to='trabajadores/', blank=True, null=True)
    casa = models.ForeignKey(Casa, on_delete=models.CASCADE, related_name='trabajadores')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.nombre_completo} ({self.casa})"

class AccesoTrabajador(models.Model):
    trabajador = models.ForeignKey(Trabajador, on_delete=models.CASCADE)
    fecha_entrada = models.DateTimeField(auto_now_add=True)
    fecha_salida = models.DateTimeField(null=True, blank=True)

class Visita(models.Model):
    TIPOS = [
        ('VISITA', 'Visita Familiar/Amigo'), 
        ('PROVEEDOR', 'Proveedor/Servicio'),
        ('TAXI', 'Taxi/Uber/Didi'),
        ('PAQUETERIA', 'Paquetería'),
        ('EMERGENCIA', 'Emergencia'),
        ('OTRO', 'Otro')
    ]
    casa = models.ForeignKey(Casa, on_delete=models.CASCADE, related_name='visitas_programadas')
    nombre_visitante = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='VISITA')
    empresa = models.CharField(max_length=100, blank=True, null=True) 
    placas_vehiculo = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True) 
    fecha_validez = models.DateField(null=True, blank=True)
    
    fecha_llegada_real = models.DateTimeField(null=True, blank=True)
    fecha_salida_real = models.DateTimeField(null=True, blank=True)
    creado_por = models.ForeignKey(User, on_delete=models.CASCADE)

class Bitacora(models.Model):
    TIPOS_INCIDENTE = [('RUTINA', 'Rondín'), ('SOSPECHOSO', 'Sospechoso'), ('RUIDO', 'Ruido'), ('ACCESO', 'Acceso Denegado'), ('DAÑO', 'Daño'), ('SERVICIO', 'Falla'), ('OTRO', 'Otro')]
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS_INCIDENTE, default='RUTINA')
    placas = models.CharField(max_length=20, blank=True, null=True) 
    involucrados = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='bitacora_img/', blank=True, null=True)
    video = models.FileField(upload_to='bitacora_vid/', blank=True, null=True)
    autor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

class ReporteDiario(models.Model):
    guardia = models.ForeignKey(User, on_delete=models.CASCADE)
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

class MensajeChat(models.Model):
    remitente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mensajes_enviados')
    destinatario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='mensajes_recibidos')
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)
    es_guardia = models.BooleanField(default=False) 
    
    # ✅ NUEVO CAMPO: Para ocultar mensajes atendidos
    archivado = models.BooleanField(default=False) 

    class Meta:
        ordering = ['fecha']