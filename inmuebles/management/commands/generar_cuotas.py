from django.core.management.base import BaseCommand
from inmuebles.models import Casa
from django.utils import timezone

class Command(BaseCommand):
    help = 'Genera el cargo mensual de mantenimiento a todas las casas'

    def handle(self, *args, **kwargs):
        casas = Casa.objects.all()
        contador = 0
        
        for casa in casas:
            # Obtenemos la cuota del fraccionamiento, si no tiene, usamos 600 por defecto
            cuota = casa.fraccionamiento.cuota_mensual if casa.fraccionamiento.cuota_mensual > 0 else 600
            
            # Sumamos la deuda
            casa.saldo_pendiente += cuota
            casa.save()
            contador += 1
            
        self.stdout.write(self.style.SUCCESS(f'✅ Se aplicó el cargo mensual a {contador} casas.'))