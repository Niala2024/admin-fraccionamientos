import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, AppBar, Toolbar, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, Avatar, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Divider, MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Stack
} from '@mui/material';

// --- ICONOS ---
import LogoutIcon from '@mui/icons-material/Logout';
import ForumIcon from '@mui/icons-material/Forum'; 
import ChatIcon from '@mui/icons-material/Chat';
import PhoneIcon from '@mui/icons-material/Phone';
import SendIcon from '@mui/icons-material/Send';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import WarningIcon from '@mui/icons-material/Warning';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BoltIcon from '@mui/icons-material/Bolt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BadgeIcon from '@mui/icons-material/Badge'; 
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WifiIcon from '@mui/icons-material/Wifi';
import ReplyIcon from '@mui/icons-material/Reply'; // ✅ Icono para responder
import CancelIcon from '@mui/icons-material/Cancel'; // ✅ Icono para cancelar respuesta

import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code"; 
import { Html5QrcodeScanner } from "html5-qrcode"; 
import api from '../api/axiosConfig'; 
import Footer from '../components/Footer';
import { useSnackbar } from 'notistack';

function Dashboard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // DATOS SESIÓN
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('session_user') || '{}');
  const sessionCasa = JSON.parse(localStorage.getItem('session_casa') || 'null');

  const isGuard = sessionUser.rol && (sessionUser.rol.toLowerCase().includes('guardia') || sessionUser.rol.toLowerCase().includes('admin'));

  // Estados
  const [pagos, setPagos] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [visitasActivasCasa, setVisitasActivasCasa] = useState([]);
  const [empleadosCasa, setEmpleadosCasa] = useState([]);
  const [tabResidente, setTabResidente] = useState(0);
  const [formVisitaRapida, setFormVisitaRapida] = useState({ nombre: '', fecha: '', tipo: 'VISITA' });

  // CHAT
  const [chatMessages, setChatMessages] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [tabContacto, setTabContacto] = useState(0);
  const [chatDestinatario, setChatDestinatario] = useState(null); // ✅ PARA RESPONDER A ALGUIEN ESPECÍFICO

  // Modales
  const [openPago, setOpenPago] = useState(false);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openEmpleados, setOpenEmpleados] = useState(false); 
  const [openScanner, setOpenScanner] = useState(false); 
  const [openProveedor, setOpenProveedor] = useState(false); 
  const [openCaseta, setOpenCaseta] = useState(false); 
  const [openWifi, setOpenWifi] = useState(false); 
  
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  // Forms
  const [formPago, setFormPago] = useState({ monto: '', fecha: '' });
  const [comprobante, setComprobante] = useState(null);
  const [listaEmpleados, setListaEmpleados] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', telefono: '', horario: '' }); 
  const [fotoEmp, setFotoEmp] = useState(null);
  const [imprimirGafete, setImprimirGafete] = useState(null);
  const [wifiData, setWifiData] = useState({ ssid: '', password: '' });

  // Vigilancia
  const [visitasActivas, setVisitasActivas] = useState([]);
  const [trabajadoresActivos, setTrabajadoresActivos] = useState([]);
  const [bitacoraDia, setBitacoraDia] = useState([]);
  const [actividadCombinada, setActividadCombinada] = useState([]); 
  const [reportesDiarios, setReportesDiarios] = useState([]);
  const [formBitacora, setFormBitacora] = useState({ asunto: '', descripcion: '', tipo: 'RUTINA', placas: '', involucrados: '' });
  const [fotoBitacora, setFotoBitacora] = useState(null);
  const [videoBitacora, setVideoBitacora] = useState(null);
  const [formProv, setFormProv] = useState({ empresa: '', chofer: '', placas: '', casa_id: '' });
  const [nuevoReporte, setNuevoReporte] = useState('');
  const [listaCasas, setListaCasas] = useState([]);

  // Reloj
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { if(isGuard) { const t=setInterval(()=>setCurrentTime(new Date()),1000); return ()=>clearInterval(t);} }, [isGuard]);

  // POLLING CHAT
  useEffect(() => {
      if (openCaseta || isGuard) {
          cargarMensajes();
          const t = setInterval(cargarMensajes, 5000);
          return () => clearInterval(t);
      }
  }, [openCaseta, isGuard]);

  const cargarMensajes = async () => {
      try { const res = await api.get('/api/chat/', { headers: { Authorization: `Token ${token}` } }); setChatMessages(res.data.results || res.data); } catch(e){}
  };

  const enviarMensaje = async () => {
      if(!nuevoMensaje.trim()) return;
      const payload = { mensaje: nuevoMensaje };
      
      // ✅ Si soy guardia y seleccioné a alguien, le envío el mensaje a él
      if (isGuard && chatDestinatario) {
          payload.destinatario = chatDestinatario.id;
      }

      try { 
          await api.post('/api/chat/', payload, { headers: { Authorization: `Token ${token}` } }); 
          setNuevoMensaje('');
          // No limpiamos el destinatario para seguir la conversación, el usuario debe cancelar manualmente
          cargarMensajes(); 
      } catch(e) { enqueueSnackbar("Error enviando mensaje", {variant:'error'}); }
  };

  const handleResponder = (msg) => {
      // ✅ Función para seleccionar a quién responder
      setChatDestinatario({ id: msg.remitente, nombre: msg.remitente_nombre });
  };

  const cargarDatos = async () => {
    if (!token) { navigate('/'); return; }
    try {
      if (isGuard) {
          cargarDatosVigilancia();
          const resC = await api.get('/api/casas/', { headers: { Authorization: `Token ${token}` } });
          setListaCasas(resC.data.results || resC.data);
      } else if (sessionCasa) {
          const [resPagos, resVisitas, resEmp] = await Promise.all([
              api.get(`/api/pagos/?casa=${sessionCasa.id}`, { headers: { Authorization: `Token ${token}` } }),
              api.get(`/api/visitas/?casa=${sessionCasa.id}`, { headers: { Authorization: `Token ${token}` } }),
              api.get(`/api/trabajadores/?casa=${sessionCasa.id}`, { headers: { Authorization: `Token ${token}` } })
          ]);
          setPagos(Array.isArray(resPagos.data.results || resPagos.data) ? (resPagos.data.results || resPagos.data) : []);
          const todasVisitas = resVisitas.data.results || resVisitas.data;
          setVisitasActivasCasa(todasVisitas.filter(v => v.fecha_llegada_real && !v.fecha_salida_real));
          setEmpleadosCasa(resEmp.data.results || resEmp.data);
      }
      try { const r = await api.get('/api/avisos/ultimo/', { headers: { Authorization: `Token ${token}` } }); if(r.data.titulo) setAviso(r.data); } catch(e){}
    } catch (e) { console.error(e); }
  };

  const cargarDatosVigilancia = async () => {
      try {
          const [resV, resT, resB, resR] = await Promise.all([
              api.get('/api/visitas/activas/', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/accesos-trabajadores/activos/', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/bitacora/?dia=hoy', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/reportes-diarios/', { headers: { Authorization: `Token ${token}` } })
          ]);
          setVisitasActivas(resV.data);
          setTrabajadoresActivos(resT.data);
          setBitacoraDia(resB.data.results || resB.data);
          setReportesDiarios(resR.data.results || resR.data);
          
          const combinados = [
              ...resV.data.map(v => ({ id: `v-${v.id}`, tipo: 'Visita', nombre: v.nombre_visitante, destino: `Casa ${v.casa_nombre || v.casa}`, entrada: v.fecha_llegada_real, color: '#2979ff' })),
              ...resT.data.map(t => ({ id: `t-${t.id}`, tipo: 'Trabajador', nombre: t.trabajador_nombre, destino: `Casa ${t.casa_datos}`, entrada: t.fecha_entrada, color: '#00e676' }))
          ].sort((a,b) => new Date(b.entrada) - new Date(a.entrada));
          setActividadCombinada(combinados);
      } catch (e) {}
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const handleCrearVisitaRapida = async () => {
      if(!sessionCasa) return enqueueSnackbar("Error: No tienes casa asignada.", {variant:'error'});
      if(!formVisitaRapida.nombre) return enqueueSnackbar("Falta nombre.", {variant:'warning'});
      const today = new Date();
      const fechaHoy = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      try {
          const res = await api.post('/api/visitas/', {
              casa: sessionCasa.id,
              nombre_visitante: formVisitaRapida.nombre,
              fecha_validez: formVisitaRapida.fecha || fechaHoy,
              tipo: formVisitaRapida.tipo,
              notas: "Dashboard Rápido"
          }, { headers: { Authorization: `Token ${token}` } });
          const linkQR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VISIT-${res.data.id}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(`Hola ${res.data.nombre_visitante}, tu acceso: ${linkQR}`)}`, '_blank');
          enqueueSnackbar("Visita creada", {variant:'success'});
          setFormVisitaRapida({ nombre: '', fecha: '', tipo: 'VISITA' });
      } catch(e) { enqueueSnackbar("Error creando visita", {variant:'error'}); }
  };

  const handleSubirPago = async () => {
      if(!sessionCasa) return;
      const fd = new FormData();
      fd.append('monto', formPago.monto);
      fd.append('comprobante', comprobante);
      fd.append('casa', sessionCasa.id); 
      try { await api.post('/api/pagos/', fd, { headers: { Authorization: `Token ${token}` } }); setOpenPago(false); enqueueSnackbar("Enviado", {variant:'success'}); } catch(e){}
  };

  const handleCrearEmpleado = async () => {
      if(!sessionCasa) return;
      const fd = new FormData();
      fd.append('nombre_completo', formEmp.nombre);
      fd.append('telefono', formEmp.telefono);
      fd.append('direccion', formEmp.horario); 
      fd.append('casa', sessionCasa.id); 
      if(fotoEmp) fd.append('foto', fotoEmp);
      try { await api.post('/api/trabajadores/', fd, { headers: { Authorization: `Token ${token}` } }); setOpenEmpleados(false); cargarDatos(); } catch(e){}
  };

  const handleBorrarEmpleado = async (id) => { if(confirm("¿Baja?")) try{await api.delete(`/api/trabajadores/${id}/`, {headers:{Authorization:`Token ${token}`}}); cargarDatos();}catch(e){} };
  const handlePrint = () => { const c=document.getElementById('gafete-print'); const w=window.open('','','height=600,width=500'); w.document.write(`<html><body>${c.innerHTML}</body></html>`); w.document.close(); w.print(); };

  // Scanner
  const onScanSuccess = async (decodedText) => {
      if(scanResult) return;
      try {
          if(scannerRef.current) scannerRef.current.pause();
          const res = await api.post('/api/accesos-trabajadores/escanear_qr/', { codigo: decodedText }, { headers: { Authorization: `Token ${token}` } });
          setScanResult(res.data);
          enqueueSnackbar(res.data.mensaje, { variant: res.data.tipo.includes('ENTRADA') ? 'success' : 'info' });
          cargarDatosVigilancia(); 
          setTimeout(() => { setScanResult(null); if(scannerRef.current) scannerRef.current.resume(); }, 3000);
      } catch (e) { enqueueSnackbar("Error QR", {variant:'error'}); setTimeout(() => { if(scannerRef.current) scannerRef.current.resume(); }, 2000); }
  };
  
  useEffect(() => {
      let scanner = null;
      if (openScanner && isGuard) {
          const t = setTimeout(() => {
              const el = document.getElementById("reader-dashboard");
              if (el && !scannerRef.current) {
                  try { scanner = new Html5QrcodeScanner("reader-dashboard", { fps: 5, qrbox: {width:250,height:250} }, false); scanner.render(onScanSuccess, ()=>{}); scannerRef.current = scanner; } catch(e){}
              }
          }, 300);
          return () => clearTimeout(t);
      } else { if(scannerRef.current) { scannerRef.current.clear().catch(()=>{}); scannerRef.current=null; } }
  }, [openScanner, isGuard]);

  // ✅ LOGICA NOVEDADES ARREGLADA
  const handleGuardarReporteDiario = async () => { 
      if(!nuevoReporte.trim()) return; 
      try{
          await api.post('/api/reportes-diarios/', {mensaje:nuevoReporte}, {headers:{Authorization:`Token ${token}`}}); 
          setNuevoReporte(''); 
          enqueueSnackbar("Novedad registrada",{variant:'success'}); 
          cargarDatosVigilancia(); // ✅ Refrescar lista inmediatamente
      } catch(e){
          console.error(e);
          enqueueSnackbar("Error al guardar novedad",{variant:'error'});
      } 
  };

  const handleGuardarBitacora = async () => { if(!formBitacora.descripcion) return; const fd=new FormData(); fd.append('titulo',formBitacora.asunto||'Novedad'); fd.append('descripcion',formBitacora.descripcion); fd.append('tipo',formBitacora.tipo); if(formBitacora.placas) fd.append('placas',formBitacora.placas); if(formBitacora.involucrados) fd.append('involucrados',formBitacora.involucrados); if(fotoBitacora) fd.append('foto',fotoBitacora); if(videoBitacora) fd.append('video',videoBitacora); try{await api.post('/api/bitacora/',fd,{headers:{Authorization:`Token ${token}`}}); setFormBitacora({asunto:'',descripcion:'',tipo:'RUTINA',placas:'',involucrados:''}); setFotoBitacora(null); enqueueSnackbar("Registrado",{variant:'success'}); cargarDatosVigilancia();}catch(e){enqueueSnackbar("Error",{variant:'error'});} };
  const handleRegistrarProveedor = async () => { if(!formProv.casa_id) return enqueueSnackbar("Falta destino",{variant:'warning'}); try{await api.post('/api/visitas/',{nombre_visitante:formProv.chofer||'Chofer',tipo:'PROVEEDOR',empresa:formProv.empresa,placas_vehiculo:formProv.placas,casa:formProv.casa_id,fecha_llegada_real:new Date().toISOString()},{headers:{Authorization:`Token ${token}`}}); enqueueSnackbar("Registrado",{variant:'success'}); setOpenProveedor(false); cargarDatosVigilancia();}catch(e){enqueueSnackbar("Error",{variant:'error'});} };
  const handleAbrirProveedor = (tipo) => { setFormProv({...formProv, empresa: tipo, chofer: '', placas: '', casa_id: ''}); setOpenProveedor(true); };

  const darkTheme = { bg: '#0f172a', card: '#1e293b', text: '#f8fafc', textSec: '#94a3b8', border: '#334155' };

  if (isGuard) {
      return (
        <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: darkTheme.bg, color: darkTheme.text, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}` }}>
                <Box><Typography variant="h6" fontWeight="bold" sx={{color: '#38bdf8', lineHeight: 1}}>C5 VECINAL</Typography><Typography variant="caption" sx={{color: darkTheme.textSec}}>Centro de Mando</Typography></Box>
                <Box sx={{ display:'flex', gap: 3 }}><Box sx={{textAlign:'center'}}><Typography variant="h5" fontWeight="bold" lineHeight={1}>{actividadCombinada.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>DENTRO</Typography></Box><Box sx={{textAlign:'center'}}><Typography variant="h5" fontWeight="bold" lineHeight={1} color="#facc15">{bitacoraDia.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>INCIDENCIAS</Typography></Box></Box>
                <Box textAlign="right"><Typography variant="h5" fontWeight="bold" sx={{fontFamily: 'monospace', color: '#fff', lineHeight: 1}}>{currentTime.toLocaleTimeString()}</Typography><Typography variant="caption" sx={{color: darkTheme.textSec}}>{currentTime.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</Typography></Box>
                <IconButton onClick={handleLogout} sx={{color: '#ef5350'}}><LogoutIcon /></IconButton>
            </Box>
            <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                    <Grid size={{ xs: 12, md: 3 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Card onClick={() => setOpenScanner(true)} sx={{ bgcolor: '#2563eb', color: 'white', cursor: 'pointer', borderRadius: 2, textAlign: 'center', py: 2, display:'flex', alignItems:'center', justifyContent:'center', gap: 2, transition: '0.3s', '&:hover': { bgcolor: '#1d4ed8' } }}><QrCodeScannerIcon sx={{ fontSize: 40 }} /><Box textAlign="left"><Typography variant="h6" fontWeight="bold" lineHeight={1.1}>ESCANEAR QR</Typography><Typography variant="caption" sx={{opacity:0.8}}>Entrada / Salida</Typography></Box></Card>
                        
                        {/* 💬 CHAT VIGILANCIA MEJORADO */}
                        <Paper sx={{ flexGrow: 1, bgcolor: '#1e293b', borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Box sx={{ p: 1, bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <Typography variant="subtitle2" color="#38bdf8" fontWeight="bold">💬 MENSAJES</Typography>
                                {chatDestinatario && (
                                    <Chip label={`@${chatDestinatario.nombre}`} size="small" color="primary" onDelete={()=>setChatDestinatario(null)} deleteIcon={<CancelIcon/>} />
                                )}
                            </Box>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, display:'flex', flexDirection:'column-reverse' }}>
                                {chatMessages.map((msg) => (
                                    <Box key={msg.id} sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: msg.es_para_guardia ? '#334155' : '#0ea5e9', alignSelf: msg.es_para_guardia ? 'flex-start' : 'flex-end', maxWidth:'90%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color={msg.es_para_guardia ? '#fbbf24' : 'white'} fontWeight="bold">{msg.casa_remitente} - {msg.remitente_nombre}</Typography>
                                            {/* ✅ BOTÓN RESPONDER */}
                                            {msg.es_para_guardia && (
                                                <IconButton size="small" onClick={()=>handleResponder(msg)} sx={{color:'#94a3b8', p:0, ml:1}}><ReplyIcon fontSize="inherit"/></IconButton>
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="white">{msg.mensaje}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Box sx={{ p: 1, bgcolor: '#0f172a', display:'flex', gap:1 }}>
                                <TextField fullWidth size="small" placeholder={chatDestinatario ? `Respondiendo a ${chatDestinatario.nombre}...` : "Mensaje general..."} value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} sx={{bgcolor:'#1e293b', borderRadius:1, input:{color:'white'}}} onKeyPress={(e)=>e.key==='Enter' && enviarMensaje()} />
                                <IconButton size="small" color="primary" onClick={enviarMensaje}><SendIcon/></IconButton>
                            </Box>
                        </Paper>

                        {/* 📋 PARTE DE NOVEDADES FIX */}
                        <Paper sx={{ flexGrow: 1, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}`, display:'flex', alignItems:'center' }}><NoteAddIcon sx={{mr:1, color:'#38bdf8'}}/><Typography variant="subtitle2" fontWeight="bold" color="white">PARTE DE NOVEDADES</Typography></Box>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>{reportesDiarios.map(r => (<Box key={r.id} sx={{ mb: 1.5, p: 1, bgcolor: '#334155', borderRadius: 2 }}><Box display="flex" justifyContent="space-between" mb={0.5}><Typography variant="caption" color="#60a5fa" fontWeight="bold">{r.guardia_nombre || 'Guardia'}</Typography><Typography variant="caption" color="#cbd5e1">{new Date(r.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography></Box><Typography variant="body2" sx={{color:'white', wordBreak:'break-word'}}>{r.mensaje}</Typography></Box>))}</Box>
                            <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderTop: `1px solid ${darkTheme.border}`, display:'flex', gap:1 }}><TextField fullWidth size="small" variant="filled" placeholder="Escribir novedad..." value={nuevoReporte} onChange={(e)=>setNuevoReporte(e.target.value)} sx={{ bgcolor: '#1e293b', borderRadius: 1, input: { color: 'white', py: 1, fontSize: '0.85rem' } }} onKeyPress={(e) => e.key === 'Enter' && handleGuardarReporteDiario()} /><IconButton size="small" color="primary" onClick={handleGuardarReporteDiario}><SendIcon fontSize="small"/></IconButton></Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ p: 1.5, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}` }}><Typography variant="caption" color={darkTheme.textSec} fontWeight="bold">ACCESO MANUAL</Typography><Grid container spacing={1} sx={{mt:0.5}}>{[{label: 'Paquetería', icon: <LocalShippingIcon/>, color: '#0ea5e9'}, {label: 'Servicios', icon: <BoltIcon/>, color: '#22c55e'}, {label: 'Agua/Gas', icon: <WaterDropIcon/>, color: '#3b82f6'}, {label: 'Visita', icon: <AddCircleIcon/>, color: '#f97316'}].map((btn) => (<Grid size={{ xs: 3 }} key={btn.label}><Button fullWidth variant="contained" onClick={() => handleAbrirProveedor(btn.label)} sx={{ bgcolor: '#334155', color: 'white', flexDirection: 'column', py: 1, fontSize: '0.7rem', '&:hover': { bgcolor: btn.color } }}>{btn.icon} {btn.label}</Button></Grid>))}</Grid></Paper>
                        <Paper sx={{ flexGrow: 1, bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}><Box sx={{ p: 1.5, bgcolor: '#0f172a', borderBottom: `1px solid ${darkTheme.border}` }}><Typography variant="subtitle1" fontWeight="bold" color="#38bdf8">📡 MONITOR EN VIVO</Typography></Box><TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Quién</TableCell><TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Destino</TableCell><TableCell sx={{bgcolor: '#1e293b', color: '#94a3b8', py: 1}}>Hora</TableCell></TableRow></TableHead><TableBody>{actividadCombinada.map((row) => (<TableRow key={row.id}><TableCell sx={{color: 'white', borderBottom:'1px solid #334155', py: 1}}><Typography variant="body2" fontWeight="bold">{row.nombre}</Typography><Typography variant="caption" sx={{color: '#64748b'}}>{row.tipo}</Typography></TableCell><TableCell sx={{color: '#cbd5e1', borderBottom:'1px solid #334155', py: 1}}>{row.destino}</TableCell><TableCell sx={{color: '#cbd5e1', borderBottom:'1px solid #334155', py: 1, fontFamily:'monospace'}}>{new Date(row.entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</TableCell></TableRow>))}</TableBody></Table></TableContainer></Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ height: '100%' }}>
                        <Paper sx={{ height: '100%', bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}><Typography variant="subtitle1" fontWeight="bold" color="#f87171" gutterBottom display="flex" alignItems="center"><WarningIcon sx={{mr:1, fontSize: 20}}/> REPORTAR INCIDENTE</Typography><Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}><FormControl fullWidth size="small" variant="filled" sx={{bgcolor: '#0f172a', borderRadius: 1}}><InputLabel sx={{color:'#64748b'}}>Tipo</InputLabel><Select value={formBitacora.tipo} onChange={(e)=>setFormBitacora({...formBitacora, tipo:e.target.value})} sx={{color:'white'}}><MenuItem value="RUTINA">Rondín</MenuItem><MenuItem value="SOSPECHOSO">Sospechoso</MenuItem><MenuItem value="ACCESO">Acceso Denegado</MenuItem><MenuItem value="OTRO">Otro</MenuItem></Select></FormControl><TextField fullWidth variant="filled" size="small" placeholder="Placas / Persona" value={formBitacora.placas} onChange={(e)=>setFormBitacora({...formBitacora, placas:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, input:{color:'white'}}} /><TextField fullWidth multiline rows={3} variant="filled" size="small" placeholder="Descripción..." value={formBitacora.descripcion} onChange={(e)=>setFormBitacora({...formBitacora, descripcion:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, textarea:{color:'white'}}} /><Button variant="contained" color="error" fullWidth onClick={handleGuardarBitacora} endIcon={<SendIcon/>}>GUARDAR</Button></Box><Divider sx={{bgcolor: '#334155', mb: 1}} /><Typography variant="caption" color={darkTheme.textSec} gutterBottom>HISTORIAL (24H)</Typography><Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{bitacoraDia.map(b => (<Box key={b.id} sx={{ p: 1, mb: 1, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #334155' }}><Box display="flex" justifyContent="space-between"><Typography variant="body2" color="#fbbf24" fontWeight="bold">{b.tipo}</Typography><Typography variant="caption" color="#64748b">{new Date(b.fecha).toLocaleTimeString()}</Typography></Box><Typography variant="caption" sx={{color:'#ccc', display:'block'}}>{b.descripcion}</Typography></Box>))}</Box></Paper>
                    </Grid>
                </Grid>
            </Container>
            <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm" PaperProps={{sx:{bgcolor: darkTheme.card, color:'white'}}}><DialogTitle sx={{bgcolor: '#0f172a'}}>Escáner de Acceso</DialogTitle><DialogContent sx={{ textAlign: 'center', p: 3 }}><div id="reader-dashboard" style={{ width: '100%', minHeight: '300px', backgroundColor: 'white', borderRadius: 8 }}></div>{scanResult && <Card sx={{ mt: 2, bgcolor: scanResult.tipo.includes('ENTRADA') ? '#14532d' : '#7f1d1d', color: 'white' }}><CardContent><Typography variant="h5" fontWeight="bold">{scanResult.mensaje}</Typography></CardContent></Card>}</DialogContent><DialogActions sx={{bgcolor: '#0f172a'}}><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions></Dialog>
            <Dialog open={openProveedor} onClose={()=>setOpenProveedor(false)} fullWidth maxWidth="sm" PaperProps={{sx:{bgcolor: darkTheme.card, color:'white'}}}><DialogTitle sx={{bgcolor: '#0f172a'}}>Entrada: {formProv.empresa}</DialogTitle><DialogContent sx={{pt: 2}}><TextField fullWidth label="Nombre / Chofer" variant="filled" value={formProv.chofer} onChange={(e)=>setFormProv({...formProv, chofer:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, mb:2, input:{color:'white'}, label:{color:'#94a3b8'}}} /><TextField fullWidth label="Placas" variant="filled" value={formProv.placas} onChange={(e)=>setFormProv({...formProv, placas:e.target.value})} sx={{bgcolor:'#0f172a', borderRadius:1, mb:2, input:{color:'white'}, label:{color:'#94a3b8'}}} /><FormControl fullWidth variant="filled" sx={{bgcolor:'#0f172a', borderRadius:1}}><InputLabel sx={{color:'#94a3b8'}}>Casa Destino</InputLabel><Select value={formProv.casa_id} onChange={(e)=>setFormProv({...formProv, casa_id:e.target.value})} sx={{color:'white'}}>{listaCasas.map(c => <MenuItem key={c.id} value={c.id}>Lote {c.numero_exterior} - {c.calle_nombre}</MenuItem>)}</Select></FormControl></DialogContent><DialogActions sx={{bgcolor: '#0f172a'}}><Button onClick={()=>setOpenProveedor(false)} color="inherit">Cancelar</Button><Button onClick={handleRegistrarProveedor} variant="contained" color="success">Registrar</Button></DialogActions></Dialog>
        </Box>
      );
  }

  // VISTA RESIDENTE (Sin cambios mayores)
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#1976d2' }}>
            Hola, {sessionUser?.nombre || 'Vecino'} {sessionCasa ? `(${sessionCasa.calle} #${sessionCasa.numero})` : ''} 👋
          </Typography>
          <Button color="inherit" startIcon={<ForumIcon />} onClick={()=>navigate('/comunidad')}>Comunidad</Button> 
          <Button color="inherit" startIcon={<StorefrontIcon />} onClick={()=>navigate('/directorio')}>Directorio</Button>
          <IconButton onClick={() => navigate('/mi-perfil')} sx={{ ml: 1 }}><Avatar src={sessionUser?.avatar} sx={{width:32, height:32}}/></IconButton>
          <IconButton onClick={handleLogout} color="error"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                  <Card elevation={0} sx={{borderRadius: 4, bgcolor: '#1976d2', color: 'white', mb: 3}}>
                      <CardContent>
                          <Typography variant="subtitle2" sx={{opacity: 0.8}}>Saldo Pendiente</Typography>
                          <Typography variant="h3" fontWeight="bold" sx={{my: 1}}>${sessionCasa ? sessionCasa.saldo_pendiente : '0.00'}</Typography>
                          <Typography variant="body2" sx={{opacity: 0.9}}>Lote {sessionCasa ? sessionCasa.numero : '...'}</Typography>
                          <Box mt={2} display="flex" gap={1}>
                              <Button variant="contained" sx={{bgcolor:'white', color:'#1976d2'}} onClick={()=>setOpenPago(true)} fullWidth>PAGAR</Button>
                              <Button variant="outlined" sx={{color:'white', borderColor:'white'}} onClick={()=>setOpenHistorial(true)}><HistoryIcon/></Button>
                          </Box>
                      </CardContent>
                  </Card>
                  <Stack spacing={1}>
                      <Paper sx={{p:2, borderRadius:3, display:'flex', alignItems:'center', cursor:'pointer'}} onClick={()=>setOpenCaseta(true)}>
                          <Avatar sx={{bgcolor:'#e3f2fd', color:'#1976d2', mr:2}}><PhoneIcon/></Avatar>
                          <Box><Typography fontWeight="bold">Contactar Seguridad</Typography><Typography variant="caption" color="text.secondary">Llamada o Chat</Typography></Box>
                      </Paper>
                      <Paper sx={{p:2, borderRadius:3, display:'flex', alignItems:'center', cursor:'pointer'}} onClick={()=>setOpenWifi(true)}>
                          <Avatar sx={{bgcolor:'#e8f5e9', color:'#2e7d32', mr:2}}><WifiIcon/></Avatar>
                          <Box><Typography fontWeight="bold">Compartir WiFi</Typography><Typography variant="caption" color="text.secondary">QR para Invitados</Typography></Box>
                      </Paper>
                  </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{p: 3, borderRadius: 4, border: '1px solid #e0e0e0', height: '100%'}}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{color:'#333'}}>⚡ Acceso Rápido</Typography>
                      <Tabs value={tabResidente} onChange={(e,v)=>setTabResidente(v)} sx={{mb:3}} variant="fullWidth">
                          <Tab icon={<QrCode2Icon/>} label="Crear Visita" />
                          <Tab icon={<BadgeIcon/>} label="Mis Empleados" />
                      </Tabs>
                      {tabResidente === 0 && (
                          <Box sx={{bgcolor:'#f8f9fa', p:3, borderRadius:3}}>
                              <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, sm: 8 }}><TextField fullWidth label="Nombre" size="small" value={formVisitaRapida.nombre} onChange={(e)=>setFormVisitaRapida({...formVisitaRapida, nombre:e.target.value})} sx={{bgcolor:'white'}} /></Grid>
                                  <Grid size={{ xs: 12, sm: 4 }}><FormControl fullWidth size="small"><InputLabel>Tipo</InputLabel><Select value={formVisitaRapida.tipo} label="Tipo" onChange={(e)=>setFormVisitaRapida({...formVisitaRapida, tipo:e.target.value})} sx={{bgcolor:'white'}}><MenuItem value="VISITA">Visita</MenuItem><MenuItem value="PROVEEDOR">Proveedor</MenuItem></Select></FormControl></Grid>
                                  <Grid size={{ xs: 12 }}><Button variant="contained" fullWidth size="large" startIcon={<WhatsAppIcon/>} onClick={handleCrearVisitaRapida} sx={{bgcolor:'#25D366'}}>WhatsApp QR</Button></Grid>
                              </Grid>
                          </Box>
                      )}
                      {tabResidente === 1 && (
                          <Box>
                              {empleadosCasa.map(emp => (<Card key={emp.id} variant="outlined" sx={{borderRadius:3, display:'flex', alignItems:'center', p:1, mb:1}}><Avatar src={emp.foto} sx={{mr:2}} /><Box flexGrow={1}><Typography variant="subtitle2">{emp.nombre_completo}</Typography></Box></Card>))}
                              <Button variant="outlined" fullWidth sx={{mt:2}} startIcon={<PersonAddIcon/>} onClick={()=>{setOpenEmpleados(true);}}>Registrar Nuevo</Button>
                          </Box>
                      )}
                  </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                  {aviso && <Paper elevation={0} sx={{p: 2, borderRadius: 4, bgcolor: '#fff3e0', color: '#e65100', mb: 3}}><Typography variant="subtitle2">📢 {aviso.titulo}</Typography></Paper>}
                  <Paper elevation={0} sx={{p: 2, borderRadius: 4, border: '1px solid #e0e0e0', height: '100%'}}>
                      <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>🏠 En tu Propiedad</Typography>
                      {visitasActivasCasa.length===0 ? <Typography variant="body2" color="text.secondary">Sin visitas activas</Typography> : <Stack spacing={1}>{visitasActivasCasa.map(v=><Box key={v.id}>{v.nombre_visitante}</Box>)}</Stack>}
                  </Paper>
              </Grid>
          </Grid>
      </Container>

      {/* --- MODALES --- */}
      <Dialog open={openPago} onClose={()=>setOpenPago(false)}><DialogTitle>Registrar Pago</DialogTitle><DialogContent><TextField fullWidth label="Monto" type="number" onChange={(e)=>setFormPago({...formPago, monto:e.target.value})} sx={{mb:2, mt:1}} /><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Subir Comprobante<input type="file" hidden accept="image/*" onChange={(e)=>setComprobante(e.target.files[0])} /></Button></DialogContent><DialogActions><Button onClick={()=>setOpenPago(false)}>Cancelar</Button><Button onClick={handleSubirPago} variant="contained" color="success">Enviar</Button></DialogActions></Dialog>
      <Dialog open={openCaseta} onClose={()=>setOpenCaseta(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor:'#1976d2', color:'white'}}>Contactar Vigilancia</DialogTitle>
          <DialogContent sx={{pt:0, height: 400, display:'flex', flexDirection:'column'}}>
              <Tabs value={tabContacto} onChange={(e,v)=>setTabContacto(v)} centered sx={{borderBottom:1, borderColor:'divider', mb:2}}><Tab icon={<PhoneIcon/>} label="Llamada" /><Tab icon={<ChatIcon/>} label="Chat" /></Tabs>
              {tabContacto===0 && <Box textAlign="center" py={4}><Button variant="contained" size="large" fullWidth href="tel:911" sx={{bgcolor:'#ef5350'}}>LLAMAR</Button></Box>}
              {tabContacto===1 && <Box sx={{flexGrow:1, display:'flex', flexDirection:'column'}}><Box sx={{flexGrow:1, overflowY:'auto', p:2, bgcolor:'#f5f5f5', mb:2}}>{chatMessages.map(msg=><Box key={msg.id} sx={{p:1, mb:1, bgcolor:'white', borderRadius:1}}>{msg.mensaje}</Box>)}</Box><Box sx={{display:'flex'}}><TextField fullWidth size="small" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} /><IconButton onClick={enviarMensaje}><SendIcon/></IconButton></Box></Box>}
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenCaseta(false)}>Cerrar</Button></DialogActions>
      </Dialog>
      
      <Dialog open={openWifi} onClose={()=>setOpenWifi(false)}><DialogTitle>WiFi</DialogTitle><DialogContent><TextField label="SSID" onChange={(e)=>setWifiData({...wifiData, ssid:e.target.value})}/><TextField label="Pass" onChange={(e)=>setWifiData({...wifiData, password:e.target.value})}/></DialogContent></Dialog>

      <Footer />
    </Box>
  );
}

export default Dashboard;