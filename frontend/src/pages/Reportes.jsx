import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, IconButton, Tab, Tabs, Button,
  TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';

function Reportes() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Datos generales (Inicializados como Arrays vacíos para seguridad)
  const [pagos, setPagos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [casas, setCasas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);

  // Formulario Reporte PDF/Email
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [destinatarios, setDestinatarios] = useState('todos');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Ajustamos URL según entorno
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://127.0.0.1:8000/api' 
        : 'https://web-production-619e0.up.railway.app/api';

      const config = { headers: { 'Authorization': `Token ${token}` }};
      
      try {
        const [resPagos, resEgresos, resCasas, resUsuarios] = await Promise.all([
            axios.get(`${baseUrl}/pagos/?estado=APROBADO`, config),
            axios.get(`${baseUrl}/egresos/`, config),
            axios.get(`${baseUrl}/casas/`, config),
            axios.get(`${baseUrl}/usuarios/`, config)
        ]);
        
        // ✅ CORRECCIÓN ANTI-PANTALLA BLANCA:
        // Verificamos si Django envió paginación (.results) o lista directa.
        const datosPagos = resPagos.data.results || resPagos.data;
        const datosEgresos = resEgresos.data.results || resEgresos.data;
        const datosCasas = resCasas.data.results || resCasas.data;
        const datosUsuarios = resUsuarios.data.results || resUsuarios.data;

        setPagos(Array.isArray(datosPagos) ? datosPagos : []);
        setEgresos(Array.isArray(datosEgresos) ? datosEgresos : []);
        setCasas(Array.isArray(datosCasas) ? datosCasas : []);
        setUsuarios(Array.isArray(datosUsuarios) ? datosUsuarios : []);

        // Calcular totales usando los datos ya limpios
        const safePagos = Array.isArray(datosPagos) ? datosPagos : [];
        const safeEgresos = Array.isArray(datosEgresos) ? datosEgresos : [];

        setTotalIngresos(safePagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0));
        setTotalEgresos(safeEgresos.reduce((acc, e) => acc + parseFloat(e.monto || 0), 0));

      } catch (error) { console.error("Error cargando reportes:", error); }
  };

  // --- LÓGICA DE REPORTES PDF/EMAIL ---
  const handleDescargarPDF = async () => {
      if(!fechaInicio || !fechaFin) return alert("Selecciona las fechas");
      const token = localStorage.getItem('token');
      const baseUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/api' : 'https://web-production-619e0.up.railway.app/api';
      
      try {
          const response = await axios.get(`${baseUrl}/generar-reporte/?inicio=${fechaInicio}&fin=${fechaFin}`, {
              headers: { 'Authorization': `Token ${token}` },
              responseType: 'blob' 
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Estado_Financiero_${fechaInicio}.pdf`);
          document.body.appendChild(link);
          link.click();
      } catch(e) { alert("Error al generar PDF"); }
  };

  const handleEnviarEmail = async () => {
      if(!fechaInicio || !fechaFin) return alert("Selecciona las fechas");
      if(!confirm("¿Enviar este reporte por correo a los vecinos seleccionados?")) return;
      
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/api' : 'https://web-production-619e0.up.railway.app/api';

      try {
          const res = await axios.post(`${baseUrl}/generar-reporte/`, {
              inicio: fechaInicio,
              fin: fechaFin,
              destinatarios: destinatarios
          }, { headers: { 'Authorization': `Token ${token}` } });
          alert(res.data.status);
      } catch(e) { alert("Error al enviar correos"); }
      setLoading(false);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ bgcolor: '#00695c' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin-panel')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Centro de Reportes</Typography>
        </Toolbar>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered textColor="inherit" indicatorColor="secondary">
            <Tab label="Generador de Estados de Cuenta" />
            <Tab label="Resumen Histórico" />
            <Tab label="Padrón" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        
        {/* PESTAÑA 0: GENERADOR */}
        {tabIndex === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom color="primary">Generar y Enviar Estado Financiero</Typography>
                <Typography paragraph color="text.secondary">
                    Selecciona el periodo (mensual, anual, etc.) para generar el PDF con el balance de Ingresos vs Egresos.
                </Typography>
                
                <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{mt:2}}>
                    <Grid item>
                        <TextField label="Fecha Inicio" type="date" InputLabelProps={{shrink: true}} value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
                    </Grid>
                    <Grid item>
                        <TextField label="Fecha Fin" type="date" InputLabelProps={{shrink: true}} value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
                    </Grid>
                    <Grid item sx={{minWidth: 200}}>
                        <FormControl fullWidth>
                            <InputLabel>Enviar a:</InputLabel>
                            <Select value={destinatarios} label="Enviar a:" onChange={(e)=>setDestinatarios(e.target.value)}>
                                <MenuItem value="todos">Todos los Vecinos Activos</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
                    <Button variant="outlined" size="large" startIcon={<PictureAsPdfIcon />} onClick={handleDescargarPDF}>
                        Descargar PDF (Vista Previa)
                    </Button>
                    <Button variant="contained" size="large" color="success" startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <EmailIcon />} onClick={handleEnviarEmail} disabled={loading}>
                        {loading ? "Enviando..." : "Enviar Correo Masivo"}
                    </Button>
                </Box>
            </Paper>
        )}

        {/* PESTAÑA 1: HISTÓRICO GLOBAL */}
        {tabIndex === 1 && (
            <Box>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, borderLeft: '6px solid #2e7d32', bgcolor: '#e8f5e9' }}>
                            <Typography variant="subtitle2">TOTAL INGRESOS (Histórico)</Typography>
                            <Box display="flex" alignItems="center" mt={1}><AttachMoneyIcon color="success"/><Typography variant="h4">${totalIngresos.toLocaleString()}</Typography></Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, borderLeft: '6px solid #d32f2f', bgcolor: '#ffebee' }}>
                            <Typography variant="subtitle2">TOTAL EGRESOS (Histórico)</Typography>
                            <Box display="flex" alignItems="center" mt={1}><MoneyOffIcon color="error"/><Typography variant="h4">${totalEgresos.toLocaleString()}</Typography></Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, borderLeft: '6px solid #1976d2', bgcolor: '#e3f2fd' }}>
                            <Typography variant="subtitle2">BALANCE CAJA</Typography>
                            <Box display="flex" alignItems="center" mt={1}><AccountBalanceIcon color="primary"/><Typography variant="h4">${(totalIngresos - totalEgresos).toLocaleString()}</Typography></Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        )}

        {/* PESTAÑA 2: PADRÓN */}
        {tabIndex === 2 && (
            <Box>
                <Typography variant="h6" gutterBottom>Listado de Propiedades</Typography>
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table size="small">
                        <TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Calle</TableCell><TableCell>Número</TableCell><TableCell>Propietario</TableCell><TableCell align="right">Deuda</TableCell></TableRow></TableHead>
                        {/* ✅ AHORA 'casas' SIEMPRE ES UN ARRAY, NO TRUENA EL MAP */}
                        <TableBody>{casas.map((c) => (<TableRow key={c.id}><TableCell>{c.calle_nombre}</TableCell><TableCell>{c.numero_exterior}</TableCell><TableCell>{c.propietario || "VACANTE"}</TableCell><TableCell align="right" sx={{color: c.saldo_pendiente > 0 ? 'red' : 'black'}}>${c.saldo_pendiente}</TableCell></TableRow>))}</TableBody>
                    </Table>
                </TableContainer>
            </Box>
        )}

      </Container>
      <Footer />
    </Box>
  );
}

export default Reportes;