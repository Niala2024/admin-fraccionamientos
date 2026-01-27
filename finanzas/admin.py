from django.contrib import admin
# Importamos los modelos (asegúrate de que los nombres coincidan con tu models.py)
from .models import TipoEgreso, Egreso, Pago, Queja 

# Registramos cada modelo para que sea visible en el panel /admin/
admin.site.register(TipoEgreso)
admin.site.register(Egreso)
admin.site.register(Pago)
admin.site.register(Queja)