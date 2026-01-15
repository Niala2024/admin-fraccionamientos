from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Pago

# NOTA: Hemos eliminado el 'post_save' que descontaba el saldo automáticamente.
# Ahora el saldo se descuenta EXCLUSIVAMENTE cuando el Admin da clic en "Aprobar"
# desde el panel, usando la lógica en views.py.

@receiver(post_delete, sender=Pago)
def devolver_saldo_al_borrar(sender, instance, **kwargs):
    """
    Si por error se borra un pago que ya había sido APROBADO y contabilizado,
    debemos regresarle esa deuda a la casa para que los números cuadren.
    """
    if instance.estado == 'APROBADO':
        casa = instance.casa
        # Como se borró el pago, la deuda vuelve a subir
        casa.saldo_pendiente += instance.monto
        casa.save()
        print(f"⚠️ Pago borrado: Se devolvió la deuda de ${instance.monto} a la casa {casa}")