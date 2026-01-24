import os
import time
from apscheduler.schedulers.blocking import BlockingScheduler

# 1. Creamos el planificador (el cerebro)
sched = BlockingScheduler()

# 2. Definimos la tarea: "Ejecuta el comando de Django"
def cobrar_cuota():
    print("⏰ ¡Es día 1! Ejecutando cobro automático...")
    # Esto simula escribir el comando en la terminal
    os.system('python manage.py generar_cuotas')

# 3. Configuramos la regla "CRON" (El horario)
# day=1  -> El día 1 de cada mes
# hour=0 -> A las 00:00 horas (medianoche)
@sched.scheduled_job('cron', day=1, hour=0, minute=0)
def tarea_programada():
    cobrar_cuota()

# --- OPCIONAL: PRUEBA RÁPIDA ---
# Si quieres probarlo YA (que corra cada 10 segundos), descomenta estas 3 líneas:
# @sched.scheduled_job('interval', seconds=10)
# def tarea_prueba():
#     print("⏳ Prueba de intervalo: Ejecutando...")
#     os.system('python manage.py generar_cuotas')

# 4. Encendemos el reloj
print("🟢 Reloj iniciado. Esperando al día 1 de cada mes... (No cierres esta ventana)")
try:
    sched.start()
except (KeyboardInterrupt, SystemExit):
    print("🔴 Reloj detenido.")