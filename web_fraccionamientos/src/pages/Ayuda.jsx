import React from 'react';
import { 
  Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails, 
  Paper, Button, Divider, List, ListItem, ListItemIcon, ListItemText, Grid, Card, CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import HelpIcon from '@mui/icons-material/Help';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PollIcon from '@mui/icons-material/Poll';
import Footer from '../components/Footer';

function Ayuda() {
  const contactarDisenador = () => {
    window.open('mailto:alaincip@gmail.com?subject=Soporte%20App%20Fraccionamiento');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      
      {/* HEADER */}
      <Box sx={{ bgcolor: '#1976d2', color: 'white', py: 4, textAlign: 'center', mb: 4 }}>
        <Container>
          <HelpIcon sx={{ fontSize: 50, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">Centro de Ayuda</Typography>
          <Typography variant="subtitle1">Guía rápida para aprovechar al máximo tu plataforma</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ flexGrow: 1, mb: 5 }}>
        
        {/* SECCIÓN RESIDENTES */}
        <Typography variant="h5" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} /> Para Residentes
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">💰 Estado de Cuenta y Pagos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Desde tu panel principal puedes ver tu saldo pendiente. 
              Para pagar, haz clic en el botón <b>"Pagar"</b> y sube una foto de tu comprobante de transferencia.
              El administrador validará tu pago y tu saldo se actualizará automáticamente.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nota: Puedes ver tus pagos anteriores en el botón "Historial".
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">👷 Gestión de Empleados Domésticos (QR)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Registra a tu personal (jardineros, limpieza, etc.) en la sección <b>"Empleados"</b>.
            </Typography>
            <List dense>
              <ListItem><ListItemIcon><QrCodeIcon color="primary"/></ListItemIcon><ListItemText primary="Genera un Gafete con Código QR para agilizar su acceso en caseta." /></ListItem>
              <ListItem><ListItemIcon><WhatsAppIcon color="success"/></ListItemIcon><ListItemText primary="Contáctalos rápidamente vía WhatsApp desde la lista." /></ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">🗳️ Comunidad y Encuestas 3D</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Participa en la toma de decisiones del fraccionamiento. En la sección <b>Comunidad</b> puedes:
            </Typography>
            <ul>
              <li>Votar en encuestas interactivas con resultados en tiempo real (Gráficos 3D).</li>
              <li>Publicar en el Foro Vecinal (Ventas, Avisos, Recomendaciones).</li>
              <li>Enviar Quejas o Sugerencias con evidencia (fotos/videos) directamente a la administración.</li>
            </ul>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 4 }} />

        {/* SECCIÓN ADMINISTRADORES */}
        <Typography variant="h5" color="secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Para Administradores
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">👥 Directorio de Usuarios</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Accede al botón <b>"Usuarios"</b> (Color Verde) en tu panel. Desde ahí podrás:
            </Typography>
            <ul>
              <li>Ver la lista completa de Residentes y Guardias.</li>
              <li><b>Editar</b> sus datos (nombre, teléfono, casa asignada).</li>
              <li><b>Dar de baja</b> usuarios que ya no vivan en el fraccionamiento.</li>
            </ul>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">📢 Comunicación y Cobranza (WhatsApp)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Hemos integrado WhatsApp para facilitar tu gestión:
            </Typography>
            <List dense>
              <ListItem><ListItemIcon><WhatsAppIcon color="success"/></ListItemIcon><ListItemText primary="Envía recordatorios de pago personalizados a los morosos con un solo clic desde la tabla de casas." /></ListItem>
              <ListItem><ListItemIcon><WhatsAppIcon color="success"/></ListItemIcon><ListItemText primary="Envía avisos generales a cualquier vecino desde el directorio." /></ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight="bold">📉 Finanzas y Reportes</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              En el módulo financiero puedes:
            </Typography>
            <ul>
              <li>Validar o Rechazar los comprobantes de pago subidos por los vecinos.</li>
              <li>Registrar Egresos (Mantenimiento, Luz, Seguridad).</li>
              <li>Aplicar <b>Cargos Masivos</b> (ej. Cuota Extraordinaria) a todas las casas.</li>
            </ul>
          </AccordionDetails>
        </Accordion>

        {/* TARJETA DE CONTACTO DISEÑADOR */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" align="center" gutterBottom color="text.secondary">
            ¿Necesitas soporte técnico o personalización adicional?
          </Typography>
          
          <Card elevation={3} sx={{ maxWidth: 500, mx: 'auto', mt: 2, borderLeft: '6px solid #1976d2' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold">Contactar al Desarrollador</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Diseño y Desarrollo por Alain Ciceña
              </Typography>
              
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<EmailIcon />} 
                onClick={contactarDisenador}
                sx={{ bgcolor: '#333', '&:hover': { bgcolor: '#000' } }}
              >
                alaincip@gmail.com
              </Button>
            </CardContent>
          </Card>
        </Box>

      </Container>
      
      <Footer />
    </Box>
  );
}

export default Ayuda;