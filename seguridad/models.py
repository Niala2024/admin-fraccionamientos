from django.db import models
from django.contrib.auth import get_user_model
from inmuebles.models import Casa, Fraccionamiento

User = get_user_model()

class Visita(models.Model):
    TIPOS = [
        ('VISITA', 'Visita Casual'),
        ('PROVEEDOR', 'Proveedor / Servicio'),
        ('PAQUETERIA', 'Paquetería'),
        ('UBER', 'Uber / Taxi'),
    ]
    casa = models.ForeignKey(Casa, on_delete=models.CASCADE, related_name='visitas')
    fecha_llegada = models.DateTimeField(auto_now_add=True)
    fecha_salida_real = models.DateTimeField(null=True, blank=True)
    
    nombre_visitante = models.CharField(max_length=150)
    placas = models.CharField(max_length=20, blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='VISITA')
    empresa = models.CharField(max_length=100, blank=True, null=True) # Para proveedores
    
    # QR y acceso
    codigo_qr = models.CharField(max_length=100, unique=True, blank=True, null=True)
    valido_hasta = models.DateTimeField(blank=True, null=True)
    estatus = models.CharField(max_length=20, default='ACTIVO') # ACTIVO, COMPLETADO, CANCELADO

    def __str__(self):
        return f"{self.nombre_visitante} -> {self.casa}"

# --- MODELO TRABAJADOR (CORREGIDO AQUÍ) ---
class Trabajador(models.Model):
    nombre_completo = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='trabajadores/', blank=True, null=True)
    
    # Opcional: Si el trabajador es exclusivo de una casa (ej. empleada doméstica)
    casa_asignada = models.ForeignKey(Casa, on_delete=models.SET_NULL, null=True, blank=True, related_name='empleados')
    # Si es del fraccionamiento (ej. jardinero general), casa_asignada se deja vacía
    
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre_completo

class AccesoTrabajador(models.Model):
    trabajador = models.ForeignKey(Trabajador, on_delete=models.CASCADE)
    fecha_entrada = models.DateTimeField(auto_now_add=True)
    fecha_salida = models.DateTimeField(null=True, blank=True)
    guardia = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

class Bitacora(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=200)
    fecha = models.DateTimeField(auto_now_add=True)
    fraccionamiento = models.ForeignKey(Fraccionamiento, on_delete=models.CASCADE, null=True, blank=True)