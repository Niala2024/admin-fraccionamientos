from django.apps import AppConfig

class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'usuarios'

    # Fíjate que ahora tiene 4 espacios de sangría, igual que 'name'
    def ready(self):
        import usuarios.signals