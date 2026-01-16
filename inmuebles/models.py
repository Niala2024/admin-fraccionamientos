from django.db import models

class Fraccionamiento(models.Model):
    nombre = models.CharField(max_length=100)
    # CORRECCIÓN MIGración: Agregamos default='' para que no falle la base de datos
    direccion = models.CharField(max_length=200, blank=True, default='') 
    
    # --- NUEVOS CAMPOS PARA PERSONALIZAR EL HEADER ---
    titulo_header = models.CharField(max_length=150, default="Bienvenidos a nuestra Comunidad")
    imagen_portada = models.ImageField(upload_to='fraccionamiento/', blank=True, null=True)

    # ✅ NUEVO CAMPO: La cuota mensual oficial
    cuota_mensual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.nombre

class Calle(models.Model):
    nombre = models.CharField(max_length=100)
    def __str__(self): return self.nombre

class Casa(models.Model):
    calle = models.ForeignKey(Calle, on_delete=models.CASCADE)
    numero_exterior = models.CharField(max_length=20)
    fraccionamiento = models.ForeignKey(Fraccionamiento, on_delete=models.CASCADE)
    saldo_pendiente = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.calle.nombre} #{self.numero_exterior}"