from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class CustomUserAdmin(UserAdmin):
    # Columnas que se ven en la lista
    list_display = ('username', 'email', 'first_name', 'rol', 'get_casa', 'is_active')
    
    # Filtros laterales (CORREGIDO EL ERROR AQUÍ)
    # Antes buscaba en calle, ahora busca directo en casa -> fraccionamiento
    list_filter = ('rol', 'is_active', 'casa__fraccionamiento') 
    
    # Campos de búsqueda
    search_fields = ('username', 'email', 'first_name', 'last_name')

    # Agregamos los campos personalizados al formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Información Extra', {'fields': ('rol', 'telefono', 'casa', 'avatar')}),
    )

    # Función auxiliar para mostrar la casa bonita
    def get_casa(self, obj):
        if obj.casa:
            return f"{obj.casa.calle.nombre} #{obj.casa.numero_exterior}"
        return "Sin Casa"
    get_casa.short_description = 'Domicilio'