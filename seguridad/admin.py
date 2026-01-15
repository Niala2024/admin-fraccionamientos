from django.contrib import admin
from .models import Visita, Bitacora, Trabajador, AccesoTrabajador

@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    # Campos corregidos según tu modelo actual:
    # 'residente' -> 'casa'
    # 'estado' -> 'estatus' (o lo quitamos si no existe, aquí asumo estatus)
    list_display = ('nombre_visitante', 'casa', 'tipo', 'estatus', 'fecha_llegada')
    list_filter = ('estatus', 'tipo', 'fecha_llegada')
    search_fields = ('nombre_visitante', 'placas')
    readonly_fields = ('fecha_llegada', 'fecha_salida_real', 'codigo_qr')

@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    # Campos corregidos:
    # 'guardia' -> 'usuario'
    # 'mensaje' -> 'accion'
    list_display = ('usuario', 'accion', 'fecha', 'fraccionamiento')
    list_filter = ('fraccionamiento', 'fecha')
    search_fields = ('accion', 'usuario__username')

@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = ('nombre_completo', 'telefono', 'activo', 'casa_asignada')
    list_filter = ('activo', 'casa_asignada')
    search_fields = ('nombre_completo',)

@admin.register(AccesoTrabajador)
class AccesoTrabajadorAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'fecha_entrada', 'fecha_salida')
    list_filter = ('fecha_entrada',)