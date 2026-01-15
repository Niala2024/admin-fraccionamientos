from io import BytesIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from django.utils import timezone

def generar_pdf_accesos(accesos_trabajadores, accesos_proveedores, fecha_inicio, fecha_fin):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    elements = []
    styles = getSampleStyleSheet()

    # Título
    elements.append(Paragraph(f"Reporte de Control de Accesos", styles['Title']))
    elements.append(Paragraph(f"Periodo: {fecha_inicio} al {fecha_fin}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- UNIFICAR DATOS ---
    lista_eventos = []

    for a in accesos_trabajadores:
        # CORRECCIÓN IMPORTANTE AQUÍ: 'casa_asignada'
        detalle = "General"
        if a.trabajador.casa_asignada:
            detalle = f"Casa {a.trabajador.casa_asignada.numero_exterior}"

        lista_eventos.append({
            'fecha': a.fecha_entrada,
            'tipo': 'TRABAJADOR',
            'nombre': a.trabajador.nombre_completo,
            'detalle': detalle,
            'salida': a.fecha_salida
        })

    for p in accesos_proveedores:
        lista_eventos.append({
            'fecha': p.fecha_llegada,
            'tipo': 'PROVEEDOR',
            'nombre': p.nombre_visitante,
            'detalle': p.empresa or 'Servicio General',
            'salida': p.fecha_salida_real
        })

    # Ordenar por fecha
    lista_eventos.sort(key=lambda x: x['fecha'])

    # --- TABLA ---
    headers = ['Fecha/Hora Entrada', 'Tipo', 'Nombre', 'Detalle / Empresa', 'Hora Salida']
    data = [headers]

    for e in lista_eventos:
        entrada_str = e['fecha'].strftime('%d/%m/%Y %H:%M')
        salida_str = e['salida'].strftime('%H:%M') if e['salida'] else "---"
        
        data.append([
            entrada_str,
            e['tipo'],
            e['nombre'],
            e['detalle'],
            salida_str
        ])

    if not lista_eventos:
        elements.append(Paragraph("No hay registros en este periodo.", styles['Normal']))
    else:
        table = Table(data, colWidths=[120, 80, 200, 150, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.darkblue),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ]))
        elements.append(table)

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"Generado el: {timezone.now().strftime('%d/%m/%Y %H:%M')}", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    return buffer