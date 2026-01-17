from django.contrib import admin
from .models import Trabajador, AccesoTrabajador, Visita, Bitacora

@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'telefono', 'casa', 'fecha_registro')
    search_fields = ('nombre_completo', 'casa__numero_exterior')
    list_filter = ('casa',)

@admin.register(AccesoTrabajador)
class AccesoTrabajadorAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'fecha_entrada', 'fecha_salida')
    list_filter = ('fecha_entrada',)
    date_hierarchy = 'fecha_entrada'

@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ('nombre_visitante', 'tipo', 'empresa', 'casa', 'fecha_llegada_real', 'fecha_salida_real')
    list_filter = ('tipo', 'fecha_llegada_real')
    search_fields = ('nombre_visitante', 'empresa', 'casa__numero_exterior', 'placas_vehiculo')
    date_hierarchy = 'fecha_llegada_real'

@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo', 'autor', 'fecha', 'placas')
    list_filter = ('tipo', 'fecha')
    search_fields = ('titulo', 'descripcion', 'placas', 'involucrados')
    date_hierarchy = 'fecha'
    readonly_fields = ('fecha',)