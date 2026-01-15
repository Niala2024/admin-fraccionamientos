from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.db.models import Sum
from .models import Pago, Egreso

def generar_pdf_financiero(fecha_inicio, fecha_fin):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # --- 1. TÍTULO ---
    title_style = styles['Title']
    elements.append(Paragraph(f"Estado Financiero del Fraccionamiento", title_style))
    elements.append(Paragraph(f"Periodo: {fecha_inicio} al {fecha_fin}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # --- 2. OBTENER DATOS ---
    ingresos = Pago.objects.filter(fecha_pago__range=[fecha_inicio, fecha_fin], estado='APROBADO')
    egresos = Egreso.objects.filter(fecha_pago__range=[fecha_inicio, fecha_fin])

    total_ingresos = ingresos.aggregate(Sum('monto'))['monto__sum'] or 0
    total_egresos = egresos.aggregate(Sum('monto'))['monto__sum'] or 0
    balance = total_ingresos - total_egresos

    # --- 3. TABLA RESUMEN ---
    data_resumen = [
        ['Concepto', 'Monto Total'],
        ['Total Ingresos (Cuotas)', f"${total_ingresos:,.2f}"],
        ['Total Egresos (Gastos)', f"${total_egresos:,.2f}"],
        ['BALANCE FINAL', f"${balance:,.2f}"]
    ]

    t_resumen = Table(data_resumen, colWidths=[300, 150])
    t_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.beige), # Fila de balance
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(t_resumen)
    elements.append(Spacer(1, 20))

    # --- 4. DETALLE DE GASTOS ---
    elements.append(Paragraph("Desglose de Gastos Realizados:", styles['Heading2']))
    
    if egresos.exists():
        data_gastos = [['Fecha', 'Concepto', 'Monto']]
        for e in egresos:
            data_gastos.append([
                e.fecha_pago.strftime('%d/%m/%Y'),
                e.descripcion or e.tipo.nombre,
                f"${e.monto:,.2f}"
            ])
        
        t_gastos = Table(data_gastos, colWidths=[100, 250, 100])
        t_gastos.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t_gastos)
    else:
        elements.append(Paragraph("No hubo gastos en este periodo.", styles['Normal']))

    # --- 5. FOOTER ---
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("Documento generado por Sistema de Administración.", styles['Italic']))
    elements.append(Paragraph("Diseñado por Alain Ciceña", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    return buffer