from django.db import models
from django.conf import settings

class Servicio(models.Model):
    CATEGORIAS = [
        ('PLOMERIA', 'Plomería'),
        ('ELECTRICIDAD', 'Electricidad'),
        ('ALBANIL', 'Albañilería'),
        ('JARDINERIA', 'Jardinería'),
        ('CERRAJERIA', 'Cerrajería'),
        ('GAS', 'Gas'),
        ('INTERNET', 'Internet/TV'),
        ('LIMPIEZA', 'Limpieza'),
        ('VETERINARIA', 'Mascotas'),
        ('OTRO', 'Otros'),
    ]

    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='OTRO')
    telefono = models.CharField(max_length=20)
    descripcion = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='servicios/', blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    # Sistema de Calificación simple
    total_puntos = models.IntegerField(default=0)
    total_votos = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"

    @property
    def promedio(self):
        if self.total_votos == 0:
            return 0
        return round(self.total_puntos / self.total_votos, 1)

class VotoServicio(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='votos')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estrellas = models.IntegerField()  # 1 a 5

    class Meta:
        unique_together = ('servicio', 'usuario') # Un usuario solo vota una vez por serviciofrom django.db import models

# Create your models here.
