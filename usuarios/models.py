from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    telefono = models.CharField(max_length=15, blank=True, null=True)
    rol = models.CharField(max_length=30, blank=True, null=True) # 'Administrador', 'Residente', 'Guardia'
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Relación con Casa (Para Residentes)
    casa = models.ForeignKey('inmuebles.Casa', on_delete=models.SET_NULL, null=True, blank=True, related_name='residentes')
    
    # --- CAMPO CLAVE PARA ADMINISTRADORES LOCALES ---
    fraccionamiento_administrado = models.ForeignKey(
        'inmuebles.Fraccionamiento', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='administradores'
    )

    def __str__(self):
        return f"{self.username} ({self.rol})"