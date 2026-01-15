# usuarios/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import uuid

# Obtenemos el modelo de usuario activo en el proyecto
User = get_user_model()

@receiver(post_save, sender=User)
def enviar_invitacion_residente(sender, instance, created, **kwargs):
    """
    Se ejecuta automáticamente después de que cualquier usuario se guarda en la BD.
    """
    
    # --- CHIVATO 1: Confirmar que Django está escuchando ---
    print(f"\n[DEBUG] Señal disparada para usuario: {instance.username}")
    print(f"[DEBUG] ¿Es nuevo usuario?: {created}")
    print(f"[DEBUG] Rol detectado: {instance.rol}")

    # Solo actuamos si el usuario es NUEVO (created=True) y su rol es RESIDENTE
    if created and instance.rol == 'RESIDENTE':
        print("[DEBUG] -> Condición cumplida. Iniciando proceso de invitación...")
        
        # 1. Generamos una contraseña temporal simple (8 caracteres)
        token_temporal = uuid.uuid4().hex[:8]
        
        # 2. Asignamos esa contraseña al usuario (esto lo encripta)
        instance.set_password(token_temporal)
        instance.save() # Guardamos de nuevo (ojo: esto dispara la señal otra vez, pero como 'created' será False, no entrará en bucle)

        # 3. Preparamos el correo
        nombre_fraccionamiento = "tu Fraccionamiento"
        if instance.casa and instance.casa.calle and instance.casa.calle.fraccionamiento:
            nombre_fraccionamiento = instance.casa.calle.fraccionamiento.nombre

        asunto = f"Bienvenido a {nombre_fraccionamiento}"
        mensaje = f"""
        Hola {instance.username},
        
        La administración te ha dado de alta en la plataforma de {nombre_fraccionamiento}.
        
        Tus credenciales temporales son:
        --------------------------------
        Usuario: {instance.username}
        Contraseña: {token_temporal}
        --------------------------------
        
        Por favor ingresa y cambia tu contraseña inmediatamente.
        """
        
        try:
            # 4. Enviamos el correo (se imprimirá en consola si EMAIL_BACKEND es 'console')
            print(f"[DEBUG] -> Enviando correo a: {instance.email}")
            send_mail(
                asunto,
                mensaje,
                settings.EMAIL_HOST_USER,
                [instance.email],
                fail_silently=False,
            )
            print("[DEBUG] -> Correo enviado EXITOSAMENTE (Revisa arriba en la consola)")
        except Exception as e:
            print(f"[ERROR] -> Falló el envío del correo: {e}")
    else:
        print("[DEBUG] -> No se requiere acción (No es nuevo o no es residente).")