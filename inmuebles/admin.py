from django.contrib import admin
from .models import Fraccionamiento, Calle, Casa

@admin.register(Fraccionamiento)
class FraccionamientoAdmin(admin.ModelAdmin):
    # Quitamos 'created_at' que no existe en el modelo
    list_display = ('id', 'nombre', 'direccion')
    search_fields = ('nombre',)

@admin.register(Calle)
class CalleAdmin(admin.ModelAdmin):
    # Quitamos 'fraccionamiento' porque la calle es genérica, 
    # la relación con el fraccionamiento ahora está en la Casa.
    list_display = ('id', 'nombre') 
    search_fields = ('nombre',)

@admin.register(Casa)
class CasaAdmin(admin.ModelAdmin):
    # Aquí sí podemos mostrar el fraccionamiento
    list_display = ('numero_exterior', 'calle', 'fraccionamiento', 'saldo_pendiente')
    list_filter = ('fraccionamiento', 'calle') # Filtros laterales útiles
    search_fields = ('numero_exterior', 'calle__nombre')
    # Autocomplete para que sea fácil seleccionar calle y fraccionamiento si hay muchos
    autocomplete_fields = ['calle', 'fraccionamiento']