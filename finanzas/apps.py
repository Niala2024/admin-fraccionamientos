from django.apps import AppConfig

class FinanzasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finanzas'

    # --- AGREGA ESTA FUNCIÓN ---
    def ready(self):
        import finanzas.signals