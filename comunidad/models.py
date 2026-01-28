from django.db import models
from django.conf import settings

class Publicacion(models.Model):
    TIPOS = [
        ('SOCIAL', 'Social'),
        ('VENTA', 'Venta'),
        ('SERVICIO', 'Servicio'),
        ('AVISO', 'Aviso Oficial'),
    ]
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenido = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS, default='SOCIAL')
    imagen = models.ImageField(upload_to='foro/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.autor.username} - {self.tipo}"

class Encuesta(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField()
    activa = models.BooleanField(default=True)

class OpcionEncuesta(models.Model):
    encuesta = models.ForeignKey(Encuesta, related_name='opciones', on_delete=models.CASCADE)
    texto = models.CharField(max_length=200)
    votos = models.IntegerField(default=0)

class VotoUsuario(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)

class Queja(models.Model):
    ESTADOS = [('PENDIENTE','Pendiente'), ('EN_REVISION','En Revisión'), ('RESUELTO','Resuelto')]
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='quejas/', blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_creacion = models.DateTimeField(auto_now_add=True)