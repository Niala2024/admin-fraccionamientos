import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, AppBar, Toolbar, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, Avatar, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Divider, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';

// Iconos
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import ForumIcon from '@mui/icons-material/Forum'; 
import BadgeIcon from '@mui/icons-material/Badge'; 
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import HelpIcon from '@mui/icons-material/Help';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; 
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'; 
import WaterDropIcon from '@mui/icons-material/WaterDrop'; 
import BoltIcon from '@mui/icons-material/Bolt'; 
import BuildIcon from '@mui/icons-material/Build'; 
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code"; 
import { Html5QrcodeScanner } from "html5-qrcode"; 
import api from '../api/axiosConfig'; 
import Footer from '../components/Footer';
import { useSnackbar } from 'notistack';

function Dashboard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // ROLES
  const rol = localStorage.getItem('rol') || '';
  const isGuard = rol.toLowerCase().includes('guardia') || rol.toLowerCase().includes('admin');

  // Reloj
  const [currentTime, setCurrentTime] = useState(new Date());

  // Datos Generales
  const [casa, setCasa] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [listaCasas, setListaCasas] = useState([]); 
  
  // Modales
  const [openPago, setOpenPago] = useState(false);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openEmpleados, setOpenEmpleados] = useState(false); 
  const [openScanner, setOpenScanner] = useState(false); 
  const [openProveedor, setOpenProveedor] = useState(false); 
  
  // Scanner
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  // Forms Residente
  const [formPago, setFormPago] = useState({ monto: '', fecha: '' });
  const [comprobante, setComprobante] = useState(null);
  const [listaEmpleados, setListaEmpleados] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', telefono: '', horario: '' }); 
  const [fotoEmp, setFotoEmp] = useState(null);
  const [imprimirGafete, setImprimirGafete] = useState(null);

  // --- DATOS DE VIGILANCIA ---
  const [visitasActivas, setVisitasActivas] = useState([]);
  const [trabajadoresActivos, setTrabajadoresActivos] = useState([]);
  const [bitacoraDia, setBitacoraDia] = useState([]);
  const [actividadCombinada, setActividadCombinada] = useState([]); 
  const [reportesDiarios, setReportesDiarios] = useState([]);
  
  // Forms Vigilancia
  const [formBitacora, setFormBitacora] = useState({ asunto: '', descripcion: '', tipo: 'RUTINA', placas: '', involucrados: '' });
  const [fotoBitacora, setFotoBitacora] = useState(null);
  const [videoBitacora, setVideoBitacora] = useState(null);
  const [formProv, setFormProv] = useState({ empresa: '', chofer: '', placas: '', casa_id: '' });
  const [nuevoReporte, setNuevoReporte] = useState('');

  // Reloj en tiempo real
  useEffect(() => {
    if (isGuard) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isGuard]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const userLocalStr = localStorage.getItem('user_data'); 
    if (!token) { navigate('/'); return; }

    try {
      const usuarioLocal = JSON.parse(userLocalStr || '{}');
      setUserData(usuarioLocal);
      
      const resCasas = await api.get('/api/casas/', { headers: { Authorization: `Token ${token}` } });
      const lista = resCasas.data.results || resCasas.data;
      setListaCasas(lista);

      if (isGuard) {
          cargarDatosVigilancia();
      } else {
          // Lógica Residente
          const miCasa = lista.find(c => c.propietario === usuarioLocal.username); 
          if (miCasa) {
              setCasa(miCasa);
              const resPagos = await api.get(`/api/pagos/?casa=${miCasa.id}`, { headers: { Authorization: `Token ${token}` } });
              if(Array.isArray(resPagos.data.results || resPagos.data)) setPagos(resPagos.data.results || resPagos.data);
          }
          try {
              const resAviso = await api.get('/api/avisos/ultimo/', { headers: { Authorization: `Token ${token}` } });
              if (resAviso.data && resAviso.data.titulo) setAviso(resAviso.data);
          } catch(e) {}
      }
    } catch (e) { if(e.response?.status === 401) navigate('/'); }
  };

  const cargarDatosVigilancia = async () => {
      const token = localStorage.getItem('token');
      try {
          const resV = await api.get('/api/visitas/activas/', { headers: { Authorization: `Token ${token}` } });
          const visitas = resV.data;
          setVisitasActivas(visitas);

          const resT = await api.get('/api/accesos-trabajadores/activos/', { headers: { Authorization: `Token ${token}` } });
          const trabajadores = resT.data;
          setTrabajadoresActivos(trabajadores);

          const resB = await api.get('/api/bitacora/?dia=hoy', { headers: { Authorization: `Token ${token}` } });
          setBitacoraDia(resB.data.results || resB.data);

          const resR = await api.get('/api/reportes-diarios/', { headers: { Authorization: `Token ${token}` } });
          setReportesDiarios(resR.data.results || resR.data);

          // Unificar Tabla
          const combinados = [
              ...visitas.map(v => ({
                  id: `v-${v.id}`, tipo: 'Visita', nombre: v.nombre_visitante, 
                  destino: `Casa ${v.casa_nombre || v.casa}`, entrada: v.fecha_llegada_real, color: '#2979ff'
              })),
              ...trabajadores.map(t => ({
                  id: `t-${t.id}`, tipo: 'Trabajador', nombre: t.trabajador_nombre, 
                  destino: `Casa ${t.casa_datos}`, entrada: t.fecha_entrada, color: '#00e676'
              }))
          ].sort((a,b) => new Date(b.entrada) - new Date(a.entrada));
          
          setActividadCombinada(combinados);

      } catch (e) { console.error("Error cargando vigilancia", e); }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- NUEVO REPORTE DIARIO ---
  const handleGuardarReporteDiario = async () => {
      if(!nuevoReporte.trim()) return;
      try {
          await api.post('/api/reportes-diarios/', { mensaje: nuevoReporte }, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          setNuevoReporte('');
          cargarDatosVigilancia();
          enqueueSnackbar("Novedad registrada", {variant:'success'});
      } catch(e) { enqueueSnackbar("Error al guardar", {variant:'error'}); }
  };

  // --- BITÁCORA ---
  const handleGuardarBitacora = async () => {
      if(!formBitacora.descripcion) return enqueueSnackbar("Describe el incidente", {variant:'warning'});
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('titulo', formBitacora.asunto || 'Novedad'); 
      formData.append('descripcion', formBitacora.descripcion);
      formData.append('tipo', formBitacora.tipo);
      formData.append('placas', formBitacora.placas);
      formData.append('involucrados', formBitacora.involucrados);
      
      if(fotoBitacora) formData.append('foto', fotoBitacora);
      if(videoBitacora) formData.append('video', videoBitacora); 

      try {
          await api.post('/api/bitacora/', formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
          enqueueSnackbar("Incidencia registrada", {variant:'success'});
          setFormBitacora({asunto:'', descripcion:'', tipo: 'RUTINA', placas: '', involucrados: ''}); 
          setFotoBitacora(null); setVideoBitacora(null);
          cargarDatosVigilancia();
      } catch(e) { enqueueSnackbar("Error al guardar bitácora", {variant:'error'}); }
  };

  // --- PROVEEDOR ---
  const handleAbrirProveedor = (tipo) => {
      setFormProv({...formProv, empresa: tipo, chofer: '', placas: '', casa_id: ''});
      setOpenProveedor(true);
  };

  const handleRegistrarProveedor = async () => {
      if(!formProv.casa_id) return enqueueSnackbar("Selecciona destino", {variant:'warning'});
      const payload = {
          nombre_visitante: formProv.chofer || 'Chofer Genérico',
          tipo: 'PROVEEDOR',
          empresa: formProv.empresa,
          placas_vehiculo: formProv.placas,
          casa: formProv.casa_id,
          fecha_llegada_real: new Date().toISOString() 
      };

      try {
          await api.post('/api/visitas/', payload, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          enqueueSnackbar(`Entrada registrada: ${formProv.empresa}`, {variant:'success'});
          setOpenProveedor(false);
          cargarDatosVigilancia();
      } catch(e) { enqueueSnackbar("Error al registrar proveedor", {variant:'error'}); }
  };

  // --- ESCÁNER BLINDADO (NO TOCAR) ---
  useEffect(() => {
      let scanner = null;

      if (openScanner) {
          // 1. RETRASO TÁCTICO: Esperamos 300ms a que el modal termine de animarse y aparecer
          const timer = setTimeout(() => {
              const element = document.getElementById("reader-dashboard");
              
              // 2. VERIFICACIÓN: Solo iniciamos si el DIV existe en el DOM
              if (element && !scannerRef.current) {
                  try {
                      scanner = new Html5QrcodeScanner(
                          "reader-dashboard", 
                          { fps: 5, qrbox: {width: 250, height: 250} }, 
                          false
                      );
                      
                      scanner.render(onScanSuccess, (error) => {
                          // Error silencioso intencional para no saturar consola
                      });
                      
                      scannerRef.current = scanner;
                  } catch (e) {
                      console.error("Error iniciando cámara:", e);
                      enqueueSnackbar("No se pudo iniciar la cámara. Verifique permisos.", {variant:'error'});
                  }
              } else {
                  console.warn("Elemento de cámara no encontrado, reintentando...");
              }
          }, 300);

          return () => clearTimeout(timer);
      } else {
          // 3. LIMPIEZA ROBUSTA: Si cerramos el modal, matamos la cámara
          if (scannerRef.current) {
              try {
                scannerRef.current.clear().catch(e => console.warn("Limpiando scanner:", e));
              } catch(e) { console.error("Error al limpiar:", e); }
              scannerRef.current = null;
          }
      }
  }, [openScanner]);

  const onScanSuccess = async (decodedText) => {
      if(scanResult) return; // Evitar lecturas dobles muy rápidas
      try {
          // Pausar visualmente si es posible
          if(scannerRef.current) { try { scannerRef.current.pause(); } catch(e){} }
          
          const res = await api.post('/api/accesos-trabajadores/escanear_qr/', { codigo: decodedText }, 
              { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }
          );
          setScanResult(res.data);
          const esEntrada = res.data.tipo && res.data.tipo.includes('ENTRADA');
          enqueueSnackbar(res.data.mensaje, { variant: esEntrada ? 'success' : 'info' });
          cargarDatosVigilancia(); 
          
          // Reiniciar scanner después de 3 seg
          setTimeout(() => {
              setScanResult(null);
              if(scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} }
          }, 3000);

      } catch (error) {
          enqueueSnackbar(error.response?.data?.error || "Error leyendo QR", { variant: 'error' });
          // Si falla, reanudamos más rápido (1 seg)
          setTimeout(() => { 
            if(scannerRef.current) { try { scannerRef.current.resume(); } catch(e){} } 
          }, 1000);
      }
  };

  // --- ACTIONS RESIDENTE ---
  const handleSubirPago = async () => {
      if(!formPago.monto || !comprobante) return alert("Ingresa monto y comprobante");
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('monto', formPago.monto);
      formData.append('comprobante', comprobante);
      if(casa) formData.append('casa', casa.id); 
      try {
          await api.post('/api/pagos/', formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
          alert("Pago enviado a revisión"); setOpenPago(false); setFormPago({monto:'', fecha:''}); setComprobante(null); cargarDatos(); 
      } catch(e) { alert("Error al subir pago"); }
  };

  const cargarEmpleados = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await api.get('/api/trabajadores/', { headers: { Authorization: `Token ${token}` } });
          setListaEmpleados(res.data.results || res.data);
      } catch(e) { console.error(e); }
  };

  const handleCrearEmpleado = async () => {
      if(!formEmp.nombre) return alert("Nombre requerido");
      if(!casa) return alert("No tienes casa asignada");
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nombre_completo', formEmp.nombre);
      formData.append('telefono', formEmp.telefono);
      formData.append('direccion', formEmp.horario); 
      formData.append('casa', casa.id); 
      if(fotoEmp) formData.append('foto', fotoEmp);
      try {
          await api.post('/api/trabajadores/', formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
          alert("Empleado registrado"); setFormEmp({nombre:'', telefono:'', horario:''}); setFotoEmp(null); cargarEmpleados();
      } catch(e) { alert("Error al registrar"); }
  };

  const handleBorrarEmpleado = async (id) => {
      if(!confirm("¿Dar de baja?")) return;
      const token = localStorage.getItem('token');
      try { await api.delete(`/api/trabajadores/${id}/`, { headers: { Authorization: `Token ${token}` } }); cargarEmpleados(); alert("Eliminado"); } catch(e) { alert("Error"); }
  };

  const handlePrint = () => {
      const printContent = document.getElementById('gafete-print');
      const win = window.open('', '', 'height=600,width=500');
      win.document.write('<html><head><title>Gafete</title><style>body{text-align:center; font-family:sans-serif;} img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid #333;} .box{border:2px solid black; padding:20px; width:300px; margin:auto; border-radius:10px;}</style></head><body>');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const darkTheme = { bg: '#0f172a', card: '#1e293b', text: '#f8fafc', textSec: '#94a3b8', border: '#334155' };

  if (isGuard) {
      return (
        <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: darkTheme.bg, color: darkTheme.text, overflow: 'hidden' }}>
            
            {/* HEADER */}
            <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}` }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{color: '#38bdf8', lineHeight: 1}}>C5 VECINAL</Typography>
                    <Typography variant="caption" sx={{color: darkTheme.textSec}}>Centro de Mando</Typography>
                </Box>
                <Box sx={{ display:'flex', gap: 3 }}>
                    <Box sx={{textAlign:'center'}}><Typography variant="h5" fontWeight="bold" lineHeight={1}>{actividadCombinada.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>DENTRO</Typography></Box>
                    <Box sx={{textAlign:'center'}}><Typography variant="h5" fontWeight="bold" lineHeight={1} color="#facc15">{bitacoraDia.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>INCIDENCIAS</Typography></Box>
                </Box>
                <Box textAlign="right"><Typography variant="h5" fontWeight="bold" sx={{fontFamily: 'monospace', color: '#fff', lineHeight: 1}}>{currentTime.toLocaleTimeString()}</Typography><Typography variant="caption" sx={{color: darkTheme.textSec}}>{currentTime.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</Typography></Box>
                <IconButton onClick={handleLogout} sx={{color: '#ef5350'}}><LogoutIcon /></IconButton>
            </Box>

            <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                    
                    {/* COL 1: ACCESOS (QR + REPORTE DIARIO) */}
                    <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* 1.1 Botón QR Compacto */}
                        <Card 
                            onClick={() => setOpenScanner(true)}
                            sx={{ 
                                bgcolor: '#2563eb', color: 'white', cursor: 'pointer', borderRadius: 2, 
                                textAlign: 'center', py: 2, display:'flex', alignItems:'center', justifyContent:'center', gap: 2,
                                transition: '0.3s', '&:hover': { bgcolor: '#1d4ed8' }
                            }}
                        >
                            <QrCodeScannerIcon sx={{ fontSize: 40 }} />
                            <Box textAlign="left">
                                <Typography variant="h6" fontWeight="bold" lineHeight={1.1}>ESCANEAR QR</Typography>
                                <Typography variant="caption" sx={{opacity:0.8}}>Entrada / Salida</Typography>
                            </Box>
                        </Card>

                        {/* 1.2 Parte de Novedades (Diario) */}
                        <Paper sx={{ flexGrow: 1, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}`, display:'flex', alignItems:'center' }}>
                                <NoteAddIcon sx={{mr:1, color:'#38bdf8'}}/>
                                <Typography variant="subtitle2" fontWeight="bold" color="white">PARTE DE NOVEDADES</Typography>
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                                {reportesDiarios.map(r => (
                                    <Box key={r.id} sx={{ mb: 1.5, p: 1, bgcolor: '#334155', borderRadius: 2 }}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="caption" color="#60a5fa" fontWeight="bold">{r.guardia_nombre || 'Guardia'}</Typography>
                                            <Typography variant="caption" color="#cbd5e1">{new Date(r.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{color:'white', wordBreak:'break-word'}}>{r.mensaje}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderTop: `1px solid ${darkTheme.border}`, display:'flex', gap:1 }}>
                                <TextField 
                                    fullWidth size="small" variant="filled" placeholder="Escribir novedad..." 
                                    value={nuevoReporte} onChange={(e)=>setNuevoReporte(e.target.value)}
                                    sx={{ bgcolor: '#1e293b', borderRadius: 1, input: { color: 'white', py: 1, fontSize: '0.85rem' } }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleGuardarReporteDiario()}
                                />
                                <IconButton size="small" color="primary" onClick={handleGuardarReporteDiario}><SendIcon fontSize="small"/></IconButton>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* COL 2: OPERACIONES (MANUAL + MONITOR) */}
                    <Grid item xs={12} md={5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Botones Acceso Rápido */}
                        <Paper sx={{ p: 1.5, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}` }}>
                            <Typography variant="caption" color={darkTheme.textSec} fontWeight="bold">ACCESO MANUAL</Typography>
                            <Grid container spacing={1} sx={{mt:0.5}}>
                                {[
                                    {label: 'Paquetería', icon: <LocalShippingIcon/>, color: '#0ea5e9'},
                                    {label: 'Servicios', icon: <BoltIcon/>, color: '#22c55e'},
                                    {label: 'Agua/Gas', icon: <WaterDropIcon/>, color: '#3b82f6'},
                                    {label: 'Visita', icon: <AddCircleIcon/>, color: '#f97316'},
                                ].map((btn) => (
                                    <Grid item xs={3} key={btn.label}>
                                        <Button fullWidth variant="contained" onClick={() => handleAbrirProveedor(btn.label)} sx={{ bgcolor: '#334155', color: 'white', flexDirection: 'column', py: 1, fontSize: '0.7rem', '&:hover': { bgcolor: btn.color } }}>{btn.icon} {btn.label}</Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        {/* Monitor */}
                        <Paper sx={{ flexGrow: 1, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}` }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="#38bdf8">📡 MONITOR EN VIVO</Typography>
                            </Box>
                            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead><TableRow>
                                        <TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Quién</TableCell>
                                        <TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Destino</TableCell>
                                        <TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Hora</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {actividadCombinada.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell sx={{color: 'white', borderBottom:'1px solid #334155', py: 1}}>
                                                    <Typography variant="body2" fontWeight="bold">{row.nombre}</Typography>
                                                    <Typography variant="caption" sx={{color: '#64748b'}}>{row.tipo}</Typography>
                                                </TableCell>
                                                <TableCell sx={{color: '#cbd5e1', borderBottom:'1px solid #334155', py: 1}}>{row.destino}</TableCell>
                                                <TableCell sx={{color: '#cbd5e1', borderBottom:'1px solid #334155', py: 1, fontFamily:'monospace'}}>
                                                    {new Date(row.entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* COL 3: INCIDENCIAS (DERECHA) */}
                    <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                        <Paper sx={{ height: '100%', bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="#f87171" gutterBottom display="flex" alignItems="center"><WarningIcon sx={{mr:1, fontSize: 20}}/> REPORTAR INCIDENTE</Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                                <FormControl fullWidth size="small" variant="filled" sx={{bgcolor: '#0f172a', borderRadius: 1}}>
                                    <InputLabel sx={{color:'#64748b'}}>Tipo</InputLabel>
                                    <Select value={formBitacora.tipo} onChange={(e)=>setFormBitacora({...formBitacora, tipo:e.target.value})} sx={{color:'white'}}>
                                        <MenuItem value="RUTINA">Rondín</MenuItem>
                                        <MenuItem value="SOSPECHOSO">Sospechoso</MenuItem>
                                        <MenuItem value="ACCESO">Acceso Denegado</MenuItem>
                                        <MenuItem value="OTRO">Otro</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField fullWidth variant="filled" size="small" placeholder="Placas / Persona" value={formBitacora.placas} onChange={(e)=>setFormBitacora({...formBitacora, placas:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, input:{color:'white'}}} />
                                <TextField fullWidth multiline rows={3} variant="filled" size="small" placeholder="Descripción..." value={formBitacora.descripcion} onChange={(e)=>setFormBitacora({...formBitacora, descripcion:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, textarea:{color:'white'}}} />
                                <Button variant="contained" color="error" fullWidth onClick={handleGuardarBitacora} endIcon={<SendIcon/>}>GUARDAR</Button>
                            </Box>

                            <Divider sx={{bgcolor: '#334155', mb: 1}} />
                            <Typography variant="caption" color={darkTheme.textSec} gutterBottom>HISTORIAL (24H)</Typography>
                            
                            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                {bitacoraDia.map(b => (
                                    <Box key={b.id} sx={{ p: 1, mb: 1, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #334155' }}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="#fbbf24" fontWeight="bold">{b.tipo}</Typography>
                                            <Typography variant="caption" color="#64748b">{new Date(b.fecha).toLocaleTimeString()}</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{color:'#ccc', display:'block'}}>{b.descripcion}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                </Grid>
            </Container>

            {/* MODALES SCANNER Y PROVEEDOR */}
            <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm" PaperProps={{sx:{bgcolor: darkTheme.card, color:'white'}}}>
                <DialogTitle sx={{bgcolor: '#0f172a'}}>Escáner de Acceso</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: 3 }}>
                    <div id="reader-dashboard" style={{ width: '100%', minHeight: '300px', backgroundColor: 'white', borderRadius: 8 }}></div>
                    {scanResult && <Card sx={{ mt: 2, bgcolor: scanResult.tipo.includes('ENTRADA') ? '#14532d' : '#7f1d1d', color: 'white' }}><CardContent><Typography variant="h5" fontWeight="bold">{scanResult.mensaje}</Typography></CardContent></Card>}
                </DialogContent>
                <DialogActions sx={{bgcolor: '#0f172a'}}><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions>
            </Dialog>

            <Dialog open={openProveedor} onClose={()=>setOpenProveedor(false)} fullWidth maxWidth="sm" PaperProps={{sx:{bgcolor: darkTheme.card, color:'white'}}}>
                <DialogTitle sx={{bgcolor: '#0f172a'}}>Entrada: {formProv.empresa}</DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <TextField fullWidth label="Nombre / Chofer" variant="filled" value={formProv.chofer} onChange={(e)=>setFormProv({...formProv, chofer:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, mb:2, input:{color:'white'}, label:{color:'#94a3b8'}}} />
                    <TextField fullWidth label="Placas" variant="filled" value={formProv.placas} onChange={(e)=>setFormProv({...formProv, placas:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, mb:2, input:{color:'white'}, label:{color:'#94a3b8'}}} />
                    <FormControl fullWidth variant="filled" sx={{bgcolor:'#0f172a', borderRadius:1}}>
                        <InputLabel sx={{color:'#94a3b8'}}>Casa Destino</InputLabel>
                        <Select value={formProv.casa_id} onChange={(e)=>setFormProv({...formProv, casa_id:e.target.value})} sx={{color:'white'}}>
                            {listaCasas.map(c => <MenuItem key={c.id} value={c.id}>Lote {c.numero_exterior} - {c.calle_nombre}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{bgcolor: '#0f172a'}}><Button onClick={()=>setOpenProveedor(false)} color="inherit">Cancelar</Button><Button onClick={handleRegistrarProveedor} variant="contained" color="success">Registrar</Button></DialogActions>
            </Dialog>

        </Box>
      );
  }

  // --- VISTA RESIDENTE ---
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>Panel Residente</Typography>
          <Button color="inherit" startIcon={<AddCircleIcon />} onClick={()=>navigate('/visitas')}>Visitas</Button>
          <Button color="inherit" startIcon={<ForumIcon />} onClick={()=>navigate('/comunidad')}>Comunidad</Button> 
          <Button color="inherit" startIcon={<BadgeIcon />} onClick={()=>{setOpenEmpleados(true); cargarEmpleados();}}>Empleados</Button> 
          <Button color="inherit" startIcon={<StorefrontIcon />} onClick={()=>navigate('/directorio')}>Directorio</Button>
          <Box sx={{ flexGrow: 1 }} /> 
          <IconButton onClick={() => navigate('/mi-perfil')} sx={{ ml: 1, p: 0, border: '2px solid white' }}><Avatar src={userData?.avatar} /></IconButton>
          <IconButton color="inherit" onClick={handleLogout} sx={{ml:1}}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, flexGrow: 1 }}><Typography variant="h4" color="primary" gutterBottom fontWeight="bold">Estado de Cuenta</Typography><Grid container spacing={3}><Grid item xs={12} md={4}><Card elevation={3} sx={{borderLeft: '6px solid #2e7d32'}}><CardContent><Typography variant="h6" display="flex" alignItems="center" gutterBottom><HomeIcon sx={{mr:1, color:'#555'}}/> Lote {casa ? casa.numero_exterior : '...'}</Typography><Typography variant="body1" color="text.secondary">Saldo Pendiente:</Typography><Typography variant="h4" color={casa?.saldo_pendiente > 0 ? 'error' : 'success'} fontWeight="bold" sx={{my:1}}>${casa ? casa.saldo_pendiente : '0.00'}</Typography><Box sx={{display:'flex', gap:1, mt:2}}><Button variant="outlined" startIcon={<HistoryIcon/>} onClick={()=>setOpenHistorial(true)}>Historial</Button><Button variant="contained" startIcon={<AttachMoneyIcon/>} onClick={()=>setOpenPago(true)}>Pagar</Button></Box></CardContent></Card></Grid><Grid item xs={12} md={8}><Paper sx={{p:3, bgcolor:'#e3f2fd', borderLeft: '6px solid #1976d2'}}>{aviso ? (<><Typography variant="h6" color="primary" gutterBottom fontWeight="bold">📢 {aviso.titulo}</Typography><Typography variant="body1" sx={{whiteSpace:'pre-line'}}>{aviso.mensaje}</Typography><Typography variant="caption" display="block" sx={{mt:2, color:'gray'}}>Publicado el: {new Date(aviso.fecha_creacion).toLocaleDateString()}</Typography></>) : (<><Typography variant="h6" color="primary">👋 ¡Hola Vecino!</Typography><Typography>No hay avisos nuevos.</Typography></>)}</Paper></Grid></Grid></Container>
      <Dialog open={openPago} onClose={()=>setOpenPago(false)}><DialogTitle>Registrar Pago</DialogTitle><DialogContent><TextField fullWidth label="Monto" type="number" onChange={(e)=>setFormPago({...formPago, monto:e.target.value})} sx={{mb:2, mt:1}} /><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Subir Comprobante<input type="file" hidden accept="image/*" onChange={(e)=>setComprobante(e.target.files[0])} /></Button></DialogContent><DialogActions><Button onClick={()=>setOpenPago(false)}>Cancelar</Button><Button onClick={handleSubirPago} variant="contained" color="success">Enviar</Button></DialogActions></Dialog>
      <Dialog open={openHistorial} onClose={()=>setOpenHistorial(false)} fullWidth maxWidth="md"><DialogTitle>Historial</DialogTitle><DialogContent><TableContainer component={Paper}><Table size="small"><TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Fecha</TableCell><TableCell>Monto</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{pagos.map((p)=>(<TableRow key={p.id}><TableCell>{new Date(p.fecha_pago).toLocaleDateString()}</TableCell><TableCell>${p.monto}</TableCell><TableCell><Chip label={p.estado} size="small"/></TableCell></TableRow>))}</TableBody></Table></TableContainer></DialogContent><DialogActions><Button onClick={()=>setOpenHistorial(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openEmpleados} onClose={()=>setOpenEmpleados(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#1976d2', color: 'white'}}>Mis Empleados</DialogTitle><DialogContent><Grid container spacing={3} sx={{mt:1}}><Grid item xs={12} md={4}><Paper variant="outlined" sx={{p:2}}><Typography variant="subtitle1">Nuevo</Typography><TextField fullWidth size="small" label="Nombre" value={formEmp.nombre} onChange={(e)=>setFormEmp({...formEmp, nombre:e.target.value})} sx={{mb:2}} /><TextField fullWidth size="small" label="Teléfono" value={formEmp.telefono} onChange={(e)=>setFormEmp({...formEmp, telefono:e.target.value})} sx={{mb:2}} /><TextField fullWidth size="small" label="Puesto / Horario" value={formEmp.horario} onChange={(e)=>setFormEmp({...formEmp, horario:e.target.value})} sx={{mb:2}} /><Button variant="outlined" component="label" fullWidth startIcon={<PhotoCamera/>} sx={{mb:2}}>Foto<input type="file" hidden accept="image/*" onChange={(e)=>setFotoEmp(e.target.files[0])} /></Button><Button variant="contained" fullWidth onClick={handleCrearEmpleado}>Guardar</Button></Paper></Grid><Grid item xs={12} md={8}><Typography variant="subtitle1">Lista</Typography><TableContainer component={Paper} sx={{maxHeight: 400}}><Table size="small" stickyHeader><TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Foto</TableCell><TableCell>Nombre</TableCell><TableCell>Puesto</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{listaEmpleados.map((emp) => (<TableRow key={emp.id}><TableCell><Avatar src={emp.foto}/></TableCell><TableCell>{emp.nombre_completo}</TableCell><TableCell>{emp.direccion}</TableCell><TableCell><Box display="flex"><IconButton color="success" onClick={()=>window.open(`https://wa.me/52${emp.telefono.replace(/\D/g,'')}`, '_blank')}><WhatsAppIcon/></IconButton><IconButton color="primary" onClick={()=>setImprimirGafete(emp)}><BadgeIcon/></IconButton><IconButton color="error" onClick={()=>handleBorrarEmpleado(emp.id)}><DeleteIcon/></IconButton></Box></TableCell></TableRow>))}</TableBody></Table></TableContainer></Grid></Grid></DialogContent><DialogActions><Button onClick={()=>setOpenEmpleados(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={!!imprimirGafete} onClose={()=>setImprimirGafete(null)}><DialogContent><div id="gafete-print" style={{textAlign:'center', border:'2px solid black', borderRadius:'10px', padding:'20px', width:'300px', margin:'auto'}}><h2 style={{color:'#1976d2', margin:0}}>ACCESO</h2><p>PERSONAL AUTORIZADO</p>{imprimirGafete && (<><img src={imprimirGafete.foto} style={{width:'120px', height:'120px', borderRadius:'50%', objectFit:'cover'}} /><h3>{imprimirGafete.nombre_completo}</h3><p>{imprimirGafete.direccion}</p><div style={{background:'white', padding:'10px', display:'inline-block'}}><QRCode value={`WORKER-${imprimirGafete.id}`} size={140} /></div><p><b>Casa {casa ? casa.numero_exterior : '---'}</b></p></>)}</div></DialogContent><DialogActions><Button onClick={handlePrint} startIcon={<PrintIcon/>} variant="contained">Imprimir</Button><Button onClick={()=>setImprimirGafete(null)}>Cerrar</Button></DialogActions></Dialog>

      <Footer />
    </Box>
  );
}

export default Dashboard;