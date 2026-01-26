import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, IconButton, Tab, Tabs, Button,
  TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Radio, RadioGroup, FormControlLabel, FormLabel, Checkbox, ListItemText, OutlinedInput
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

// ✅ URL Centralizada
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000/api'
    : 'https://admin-fraccionamientos-production.up.railway.app/api'; 

function Reportes() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Datos
  const [pagos, setPagos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [casas, setCasas] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Aquí guardaremos la lista para el select
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEgresos, setTotalEgresos] = useState(0);

  // Formulario Reporte
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // ✅ NUEVO: Estados para la selección múltiple
  const [modoEnvio, setModoEnvio] = useState('todos'); // 'todos' o 'seleccion'
  const [seleccionados, setSeleccionados] = useState([]); // Array de IDs [1, 5, 8...]

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const config = { headers: { 'Authorization': `Token ${token}` }};
      
      try {
        const [resPagos, resEgresos, resCasas, resUsuarios] = await Promise.all([
            axios.get(`${API_BASE}/pagos/?estado=APROBADO`, config),
            axios.get(`${API_BASE}/egresos/`, config),
            axios.get(`${API_BASE}/casas/`, config),
            axios.get(`${API_BASE}/usuarios/`, config)
        ]);
        
        const datosPagos = resPagos.data.results || resPagos.data;
        const datosEgresos = resEgresos.data.results || resEgresos.data;
        const datosCasas = resCasas.data.results || resCasas.data;
        const datosUsuarios = resUsuarios.data.results || resUsuarios.data;

        setPagos(Array.isArray(datosPagos) ? datosPagos : []);
        setEgresos(Array.isArray(datosEgresos) ? datosEgresos : []);
        setCasas(Array.isArray(datosCasas) ? datosCasas : []);
        setUsuarios(Array.isArray(datosUsuarios) ? datosUsuarios : []);

        const safePagos = Array.isArray(datosPagos) ? datosPagos : [];
        const safeEgresos = Array.isArray(datosEgresos) ? datosEgresos : [];

        setTotalIngresos(safePagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0));
        setTotalEgresos(safeEgresos.reduce((acc, e) => acc + parseFloat(e.monto || 0), 0));

      } catch (error) { console.error("Error cargando reportes:", error); }
  };

  const handleDescargarPDF = async () => {
      if(!fechaInicio || !fechaFin) return alert("Selecciona las fechas");
      const token = localStorage.getItem('token');
      
      try {
          const response = await axios.get(`${API_BASE}/generar-reporte/?inicio=${fechaInicio}&fin=${fechaFin}`, {
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
      
      // ✅ VALIDACIÓN: Si es manual, debe haber al menos uno seleccionado
      if(modoEnvio === 'seleccion' && seleccionados.length === 0) {
          return alert("Por favor selecciona al menos un vecino de la lista.");
      }

      if(!confirm(`¿Enviar reporte a ${modoEnvio === 'todos' ? 'TODOS' : seleccionados.length + ' vecinos'}?`)) return;
      
      setLoading(true);
      const token = localStorage.getItem('token');

      // ✅ LÓGICA: Enviamos 'todos' O la lista de IDs
      const payloadDestinatarios = modoEnvio === 'todos' ? 'todos' : seleccionados;

      try {
          const res = await axios.post(`${API_BASE}/generar-reporte/`, {
              inicio: fechaInicio,
              fin: fechaFin,
              destinatarios: payloadDestinatarios
          }, { headers: { 'Authorization': `Token ${token}` } });
          alert(res.data.status);
      } catch(e) { 
          console.error(e);
          alert("Error al enviar correos. Verifica la consola."); 
      }
      setLoading(false);
  };

  // Maneja el cambio en el select múltiple
  const handleChangeSeleccion = (event) => {
    const { value } = event.target;
    // En material UI multiple select, value es siempre un array
    setSeleccionados(typeof value === 'string' ? value.split(',') : value);
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
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom color="primary" align="center">Generar y Enviar Estado Financiero</Typography>
                <Typography paragraph color="text.secondary" align="center">
                    Selecciona el periodo para generar el reporte. Puedes enviarlo masivamente o seleccionar destinatarios.
                </Typography>
                
                <Grid container spacing={3} justifyContent="center" sx={{mt:2}}>
                    {/* Fechas */}
                    <Grid item xs={12} md={5}>
                        <TextField fullWidth label="Fecha Inicio" type="date" InputLabelProps={{shrink: true}} value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField fullWidth label="Fecha Fin" type="date" InputLabelProps={{shrink: true}} value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
                    </Grid>

                    {/* ✅ SECCIÓN DE DESTINATARIOS MEJORADA */}
                    <Grid item xs={12} md={10}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">¿A quién enviar el reporte?</FormLabel>
                                <RadioGroup row value={modoEnvio} onChange={(e) => setModoEnvio(e.target.value)}>
                                    <FormControlLabel value="todos" control={<Radio />} label="Todos los Vecinos (Activos)" />
                                    <FormControlLabel value="seleccion" control={<Radio />} label="Seleccionar Vecinos / Bloques" />
                                </RadioGroup>
                            </FormControl>

                            {/* SELECTOR MÚLTIPLE (Solo visible si eliges 'seleccion') */}
                            {modoEnvio === 'seleccion' && (
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Selecciona los Vecinos</InputLabel>
                                    <Select
                                        multiple
                                        value={seleccionados}
                                        onChange={handleChangeSeleccion}
                                        input={<OutlinedInput label="Selecciona los Vecinos" />}
                                        renderValue={(selected) => `${selected.length} vecinos seleccionados`}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }} // Scroll si son muchos
                                    >
                                        {usuarios
                                            .filter(u => u.email) // Solo mostrar gente con email
                                            .map((u) => (
                                            <MenuItem key={u.id} value={u.id}>
                                                <Checkbox checked={seleccionados.indexOf(u.id) > -1} />
                                                <ListItemText 
                                                    primary={`${u.first_name} ${u.last_name} (${u.username})`} 
                                                    secondary={u.email} 
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <Typography variant="caption" color="text.secondary" sx={{mt:1}}>
                                        * Solo se muestran usuarios con email registrado.
                                    </Typography>
                                </FormControl>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
                    <Button variant="outlined" size="large" startIcon={<PictureAsPdfIcon />} onClick={handleDescargarPDF}>
                        Descargar PDF (Vista Previa)
                    </Button>
                    <Button variant="contained" size="large" color="success" startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <EmailIcon />} onClick={handleEnviarEmail} disabled={loading}>
                        {loading ? "Enviando..." : `Enviar Correo (${modoEnvio === 'todos' ? 'Todos' : seleccionados.length})`}
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
// Este es el bueno