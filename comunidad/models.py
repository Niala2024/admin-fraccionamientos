from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Avg # <--- IMPORTANTE: Agregado

User = get_user_model()

# --- 1. MÓDULO DE ENCUESTAS ---
class Encuesta(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.titulo

class OpcionEncuesta(models.Model):
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE, related_name='opciones')
    texto = models.CharField(max_length=100)
    votos = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.texto} ({self.votos})"

class VotoUsuario(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    encuesta = models.ForeignKey(Encuesta, on_delete=models.CASCADE)
    class Meta:
        unique_together = ('usuario', 'encuesta') 

# --- 2. MÓDULO DE FORO (COMUNIDAD) ---
class Publicacion(models.Model):
    TIPOS = [
        ('SOCIAL', 'Social / Aviso'),
        ('VENTA', 'Venta de Garage / Artículo'),
        ('SERVICIO', 'Ofrezco Servicio'),
        ('ALERTA', 'Alerta Vecinal'),
    ]
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=150)
    contenido = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS, default='SOCIAL')
    
    imagen = models.ImageField(upload_to='foro_img/', blank=True, null=True)
    video = models.FileField(upload_to='foro_vid/', blank=True, null=True)
    
    fecha = models.DateTimeField(auto_now_add=True)

class Comentario(models.Model):
    publicacion = models.ForeignKey(Publicacion, related_name='comentarios', on_delete=models.CASCADE)
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    texto = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

# --- 3. MÓDULO DE QUEJAS Y SUGERENCIAS ---
class Queja(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('EN_PROCESO', 'En Proceso'),
        ('RESUELTO', 'Resuelto'),
    ]
    autor = models.ForeignKey(User, on_delete=models.CASCADE)
    asunto = models.CharField(max_length=150)
    descripcion = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    respuesta_admin = models.TextField(blank=True, null=True)
    
    imagen = models.ImageField(upload_to='quejas_img/', blank=True, null=True)
    video = models.FileField(upload_to='quejas_vid/', blank=True, null=True)
    
    fecha = models.DateTimeField(auto_now_add=True)

class Aviso(models.Model):
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.titulo

# --- 4. NUEVO MÓDULO: DIRECTORIO DE SERVICIOS ---
class ServicioExterno(models.Model):
    CATEGORIAS = [
        ('PLOMERIA', 'Plomería'),
        ('ELECTRICIDAD', 'Electricidad'),
        ('JARDINERIA', 'Jardinería'),
        ('ALBANIL', 'Albañilería'),
        ('CERRAJERIA', 'Cerrajería'),
        ('GAS', 'Gas Estacionario/Cilindro'),
        ('AGUA', 'Pipas de Agua'),
        ('INTERNET', 'Técnico Internet/Cable'),
        ('LIMPIEZA', 'Limpieza / Doméstica'),
        ('VETERINARIA', 'Veterinaria / Mascotas'),
        ('OTRO', 'Otros Servicios'),
    ]

    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    telefono = models.CharField(max_length=20)
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="servicios_sugeridos")
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    foto = models.ImageField(upload_to='servicios/', blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"

class CalificacionServicio(models.Model):
    servicio = models.ForeignKey(ServicioExterno, on_delete=models.CASCADE, related_name='calificaciones')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    estrellas = models.IntegerField(default=5) # 1 a 5
    comentario = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('servicio', 'usuario')