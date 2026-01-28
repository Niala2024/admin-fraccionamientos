import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Grid, Paper, Button, 
  Tabs, Tab, TextField, IconButton, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Chip,
  Card, CardContent, InputAdornment, useTheme, Badge, Tooltip, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import SecurityIcon from '@mui/icons-material/Security';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookIcon from '@mui/icons-material/Book';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BadgeIcon from '@mui/icons-material/Badge';
import ArchiveIcon from '@mui/icons-material/Archive';
import HistoryIcon from '@mui/icons-material/History';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';
import InventoryIcon from '@mui/icons-material/Inventory'; // Se agregó este icono faltante

import api from '../api/axiosConfig';

const themeColors = {
    bgMain: '#0f172a',      
    bgPaper: '#1e293b',     
    bgLight: '#334155',     
    accent: '#3b82f6',      
    accentHover: '#2563eb', 
    textPrimary: '#f1f5f9', 
    textSecondary: '#94a3b8', 
    success: '#059669',     
    warning: '#d97706',     
    error: '#dc2626',       
    chatGuardia: '#1e40af', 
    chatVecino: '#334155'   
};

const CustomTextField = (props) => (
  <TextField {...props} variant="outlined" fullWidth 
    sx={{ 
        '& .MuiOutlinedInput-root': { color: themeColors.textPrimary, bgcolor: themeColors.bgLight, borderRadius: 2 },
        '& .MuiInputLabel-root': { color: themeColors.textSecondary },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeColors.accent },
        '& .MuiSelect-icon': { color: themeColors.textSecondary }, 
         ...props.sx
    }} 
  />
);

function Caseta() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const chatBottomRef = useRef(null);
  
  // 🛑 CORRECCIÓN DE SESIÓN 🛑
  // Recuperamos los datos del localStorage con las claves correctas ('user_data')
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user_data') || '{}');

  useEffect(() => {
    // Si no hay token o no es guardia/admin, sacar
    if (!token) { navigate('/'); return; }
    const rol = (sessionUser.rol || '').toLowerCase();
    if (!rol.includes('guardia') && !rol.includes('admin') && !sessionUser.is_superuser) {
        navigate('/dashboard'); 
    }
  }, [navigate, token, sessionUser]);

  const [reloj, setReloj] = useState(new Date());
  const [tabActionIndex, setTabActionIndex] = useState(0); 
  const [genteAdentro, setGenteAdentro] = useState([]);
  
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [verArchivados, setVerArchivados] = useState(false);
  const [vecinos, setVecinos] = useState([]);
  const [vecinosFiltrados, setVecinosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [formManual, setFormManual] = useState({ nombre: '', destino: '', tipo: 'Visita', placas: '' });
  
  // Estados para Bitácora y Scanner
  const [incidente, setIncidente] = useState('');
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [archivoVideo, setArchivoVideo] = useState(null);
  const [listaBitacora, setListaBitacora] = useState([]);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [fechaHistorial, setFechaHistorial] = useState('');
  const [listaHistorial, setListaHistorial] = useState([]);
  const scannerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setReloj(new Date()), 1000);
    cargarDatos();
    cargarBitacora();
    const dataInterval = setInterval(() => {
        cargarDatos();
        cargarBitacora();
        if (chatActivo) cargarChat(chatActivo.id);
    }, 5000);
    return () => { clearInterval(timer); clearInterval(dataInterval); };
  }, [chatActivo, verArchivados]);

  // ✅ ACTIVAR ESCÁNER QR
  useEffect(() => {
    let html5QrcodeScanner;
    // Solo activamos el scanner si estamos en la pestaña 0 (QR)
    if (tabActionIndex === 0) {
        // Pequeño delay para que el DIV exista
        setTimeout(() => {
            const element = document.getElementById('reader-caseta');
            if (element && !scannerRef.current) {
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "reader-caseta", 
                    { fps: 5, qrbox: { width: 250, height: 250 } },
                    false
                );
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = html5QrcodeScanner;
            }
        }, 500);
    } else {
        // Si cambiamos de pestaña, apagamos el scanner para no gastar recursos
        if (scannerRef.current) {
            scannerRef.current.clear().catch(err => console.error("Error limpiando scanner", err));
            scannerRef.current = null;
        }
    }

    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(()=>{});
            scannerRef.current = null;
        }
    };
  }, [tabActionIndex]);

  const onScanSuccess = async (decodedText) => {
      // Pausar para evitar múltiples lecturas
      if (scannerRef.current) scannerRef.current.pause();

      try {
          // Enviamos el código al backend
          const res = await api.post('/api/accesos-trabajadores/escanear_qr/', { codigo: decodedText }, { headers: { Authorization: `Token ${token}` } });
          
          enqueueSnackbar(res.data.mensaje, { 
              variant: res.data.tipo.includes('ENTRADA') ? 'success' : 'info',
              autoHideDuration: 4000
          });
          
          cargarDatos(); // Actualizar lista de gente adentro
          
          // Reanudar scanner después de 3 segundos
          setTimeout(() => { 
             if (scannerRef.current) scannerRef.current.resume(); 
          }, 3000);

      } catch (e) {
          enqueueSnackbar("Error leyendo QR o Código Inválido", { variant: 'error' });
          setTimeout(() => { if (scannerRef.current) scannerRef.current.resume(); }, 2000);
      }
  };

  const onScanFailure = (error) => {
      // No hacer nada para no llenar la consola, es normal mientras busca QR
  };

  const cargarDatos = async () => {
    try {
      const [resVisitas, resTrabajadores, resUsuarios] = await Promise.all([
        api.get('/api/visitas/activas/'), 
        api.get('/api/accesos-trabajadores/activos/'), 
        api.get('/api/usuarios/')
      ]);

      const listaVisitas = resVisitas.data.results || resVisitas.data || [];
      const listaTrabajadores = resTrabajadores.data.results || resTrabajadores.data || [];
      const unificados = [
          ...listaVisitas.map(v => ({
              id: v.id, tipo_registro: 'visita', nombre: v.nombre_visitante, subtitulo: v.placas_vehiculo || 'Sin vehículo',
              destino: v.casa_nombre || 'Visita General', tipo_icono: v.tipo, fecha_entrada: v.fecha_llegada_real
          })),
          ...listaTrabajadores.map(t => ({
              id: t.id, tipo_registro: 'trabajador', nombre: t.trabajador_nombre, subtitulo: 'Trabajador / Empleado',
              destino: t.casa_datos ? `Casa ${t.casa_datos}` : 'Mantenimiento', tipo_icono: 'Trabajador', fecha_entrada: t.fecha_entrada
          }))
      ];
      unificados.sort((a, b) => new Date(b.fecha_entrada) - new Date(a.fecha_entrada));
      setGenteAdentro(unificados);

      const listaVecinos = (resUsuarios.data.results || resUsuarios.data).filter(u => !u.is_staff && !u.is_superuser);
      setVecinos(listaVecinos);
      if (!busqueda) setVecinosFiltrados(listaVecinos);
    } catch (error) {}
  };

  const cargarBitacora = async () => {
      try {
          const res = await api.get('/api/bitacora/?dia=hoy'); 
          setListaBitacora(res.data.results || res.data);
      } catch (e) {}
  };

  const buscarHistorial = async () => {
      if(!fechaHistorial) return;
      try {
          const res = await api.get(`/api/bitacora/?fecha=${fechaHistorial}`);
          setListaHistorial(res.data.results || res.data);
      } catch (e) { enqueueSnackbar('Error al buscar historial', {variant:'error'}); }
  };

  const handleSalida = async (item) => {
      if (!confirm(`¿Registrar salida de: ${item.nombre}?`)) return;
      try {
          if (item.tipo_registro === 'visita') await api.patch(`/api/visitas/${item.id}/`, { fecha_salida_real: new Date() });
          else await api.patch(`/api/accesos-trabajadores/${item.id}/`, { fecha_salida: new Date() });
          enqueueSnackbar('Salida registrada', { variant: 'info' }); cargarDatos();
      } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };

  const handleIncidente = async () => { 
      if(!incidente) return alert("Por favor escriba una descripción."); 
      
      const fd = new FormData();
      fd.append('titulo', 'Reporte desde Caseta'); 
      fd.append('descripcion', incidente);
      fd.append('tipo', 'OTRO'); 
      if (archivoFoto) fd.append('foto', archivoFoto); 
      if (archivoVideo) fd.append('video', archivoVideo); 

      try {
          await api.post('/api/bitacora/', fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setIncidente(''); 
          setArchivoFoto(null);
          setArchivoVideo(null);
          enqueueSnackbar('Novedad registrada con éxito', { variant: 'warning' }); 
          cargarBitacora();
      } catch (e) {
          enqueueSnackbar('Error al subir archivos', { variant: 'error' });
      }
  };

  const cargarChat = async (userId) => { try { const res = await api.get(`/api/chat/?usuario=${userId}&archivados=${verArchivados}`); setMensajes(res.data.results || res.data); } catch(e){} };
  const seleccionarVecino = (vecino) => { setChatActivo(vecino); cargarChat(vecino.id); setBusqueda(''); };
  const enviarMensaje = async () => { if (!nuevoMensaje.trim() || !chatActivo) return; try { await api.post('/api/chat/', { destinatario: chatActivo.id, mensaje: nuevoMensaje }); setNuevoMensaje(''); cargarChat(chatActivo.id); } catch(e) {} };
  const handleToggleArchivo = async (mensajeId, esArchivar) => { try { const endpoint = esArchivar ? 'archivar' : 'desarchivar'; await api.patch(`/api/chat/${mensajeId}/${endpoint}/`); setMensajes(prev => prev.filter(m => m.id !== mensajeId)); enqueueSnackbar(esArchivar ? 'Mensaje archivado' : 'Mensaje restaurado', { variant: 'success', autoHideDuration: 1000 }); } catch (error) {} };

  const handleRegistroManual = async () => {
    if(!formManual.nombre || !formManual.destino) return enqueueSnackbar('Faltan datos', {variant: 'warning'});
    try { 
        await api.post('/api/visitas/', { ...formManual, metodo: 'MANUAL', fecha_llegada_real: new Date() }); 
        enqueueSnackbar('Acceso registrado', { variant: 'success' }); 
        setFormManual({ nombre: '', destino: '', tipo: 'Visita', placas: '' }); 
        cargarDatos(); 
    } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };

  const getIcono = (tipo) => {
      if(tipo === 'Trabajador') return <EngineeringIcon sx={{color: '#facc15'}}/>;
      if(tipo === 'Proveedor' || tipo === 'CFE' || tipo === 'Gas') return <LocalShippingIcon color="secondary"/>;
      if(tipo === 'Taxi' || tipo === 'Uber') return <LocalTaxiIcon color="warning"/>;
      if(tipo === 'Paqueteria') return <InventoryIcon sx={{color:'#a5b4fc'}}/>;
      return <DirectionsCarIcon color="primary"/>;
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: themeColors.bgMain, overflow:'hidden' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: themeColors.bgPaper, borderBottom: `1px solid ${themeColors.bgLight}` }}>
        <Toolbar variant="dense">
          <SecurityIcon sx={{ mr: 2, color: themeColors.accent }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 1, color: themeColors.textPrimary }}>CENTRO DE CONTROL</Typography>
          <Chip icon={<AccessTimeFilledIcon sx={{ color: themeColors.accent + '!important' }}/>} label={reloj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})} sx={{ bgcolor: themeColors.bgLight, color: themeColors.textPrimary, fontWeight: 'bold', borderRadius: '8px', mr: 3, height: 32, border: `1px solid ${themeColors.accent}40` }} />
          <Button variant="contained" color="error" size="small" startIcon={<WarningAmberIcon />} onClick={() => alert("SOS ACTIVADO")} sx={{borderRadius: 2, fontWeight:'bold', mr:1}}>SOS</Button>
          <IconButton onClick={() => { localStorage.clear(); navigate('/'); }} sx={{ color: themeColors.textSecondary, '&:hover':{color: themeColors.error} }}><Tooltip title="Salir"><LogoutIcon /></Tooltip></IconButton>
        </Toolbar>
      </AppBar>

      <Grid container spacing={2} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <Grid item xs={12} md={3} lg={2.5} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Gente Adentro</Typography>
                    <Badge badgeContent={genteAdentro.length} color="primary"><BadgeIcon sx={{color:themeColors.textSecondary}}/></Badge>
                </Box>
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                    {genteAdentro.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 4, color: themeColors.textSecondary, opacity: 0.7 }}><DirectionsCarIcon sx={{ fontSize: 40, mb: 1 }} /><Typography variant="body2">Vacío</Typography></Box>
                    ) : genteAdentro.map(item => (
                        <Card key={`${item.tipo_registro}-${item.id}`} elevation={0} sx={{ mb: 1, bgcolor: themeColors.bgLight, borderRadius: 2 }}>
                            <CardContent sx={{ p: '12px !important' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    {getIcono(item.tipo_icono)}
                                    <Box ml={1.5} flexGrow={1} overflow="hidden">
                                        <Typography variant="body2" fontWeight="bold" color={themeColors.textPrimary} noWrap>{item.nombre}</Typography>
                                        <Typography variant="caption" color={themeColors.textSecondary} display="block" noWrap>{item.subtitulo}</Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Chip label={item.destino} size="small" sx={{ bgcolor: themeColors.bgPaper, color: themeColors.textSecondary, fontSize: '0.7rem' }} />
                                    <Button size="small" variant="contained" color="error" onClick={()=>handleSalida(item)} sx={{fontSize:'0.7rem', py:0.2}}>Salida</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </List>
            </Paper>
        </Grid>

        <Grid item xs={12} md={5} lg={6} sx={{ height: '100%' }}>
           <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display:'flex', flexDirection:'column', overflow:'hidden' }}>
             <Tabs value={tabActionIndex} onChange={(e,v)=>setTabActionIndex(v)} centered sx={{ borderBottom: `1px solid ${themeColors.bgLight}`, '& .MuiTab-root': { color: themeColors.textSecondary }, '& .Mui-selected': { color: themeColors.accent + '!important' } }}>
                <Tab icon={<QrCodeScannerIcon sx={{mb:0}}/>} label="QR" iconPosition="start" />
                <Tab icon={<DirectionsCarIcon sx={{mb:0}}/>} label="Ingreso" iconPosition="start" />
                <Tab icon={<BookIcon sx={{mb:0}}/>} label="Bitácora" iconPosition="start" />
             </Tabs>
             
             <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', display:'flex', flexDirection:'column' }}>
                {tabActionIndex === 0 && (
                    // ✅ PESTAÑA ESCÁNER
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div id="reader-caseta" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: 8, overflow:'hidden' }}></div>
                        <Typography variant="caption" color="gray" sx={{mt:2}}>Enfoque el código QR a la cámara</Typography>
                    </Box>
                )}

                {tabActionIndex === 1 && (
                    <Box maxWidth="sm" mx="auto" width="100%">
                        <Grid container spacing={2}>
                            <Grid item xs={12}><CustomTextField label="Nombre Completo" value={formManual.nombre} onChange={e=>setFormManual({...formManual, nombre:e.target.value})} /></Grid>
                            <Grid item xs={12}><CustomTextField select label="Tipo" value={formManual.tipo} onChange={e=>setFormManual({...formManual, tipo:e.target.value})}>
                                <MenuItem value="Visita">Visita Social</MenuItem><MenuItem value="Proveedor">Proveedor</MenuItem><MenuItem value="Taxi">Uber/Didi</MenuItem><MenuItem value="Paqueteria">Paquetería</MenuItem>
                            </CustomTextField></Grid>
                            <Grid item xs={12}><CustomTextField label="Placas" value={formManual.placas} onChange={e=>setFormManual({...formManual, placas:e.target.value})} /></Grid>
                            <Grid item xs={12}><CustomTextField label="Destino" value={formManual.destino} onChange={e=>setFormManual({...formManual, destino:e.target.value})} /></Grid>
                            <Grid item xs={12}><Button fullWidth variant="contained" sx={{bgcolor:themeColors.accent, py:1.8}} onClick={handleRegistroManual}>AUTORIZAR</Button></Grid>
                        </Grid>
                    </Box>
                )}

                {tabActionIndex === 2 && (
                    <Box maxWidth="md" mx="auto" width="100%" display="flex" flexDirection="column" height="100%">
                        <Box flexShrink={0}>
                            <CustomTextField multiline rows={3} placeholder="Describa el suceso..." value={incidente} onChange={e=>setIncidente(e.target.value)}/>
                            
                            <Box display="flex" gap={2} mt={2}>
                                <Button variant="outlined" component="label" startIcon={<PhotoCamera/>} sx={{color: themeColors.textPrimary, borderColor: themeColors.bgLight}}>
                                    {archivoFoto ? "Foto Lista" : "Subir Foto"}
                                    <input type="file" hidden accept="image/*" onChange={(e)=>setArchivoFoto(e.target.files[0])}/>
                                </Button>
                                <Button variant="outlined" component="label" startIcon={<VideocamIcon/>} sx={{color: themeColors.textPrimary, borderColor: themeColors.bgLight}}>
                                    {archivoVideo ? "Video Listo" : "Subir Video"}
                                    <input type="file" hidden accept="video/*" onChange={(e)=>setArchivoVideo(e.target.files[0])}/>
                                </Button>
                            </Box>

                            <Button fullWidth variant="contained" color="warning" sx={{mt:2, mb:3, py:1.5}} onClick={handleIncidente} startIcon={<BookIcon/>}>REGISTRAR NOVEDAD</Button>
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2" color={themeColors.textSecondary}>Eventos de Hoy</Typography>
                                <Button size="small" startIcon={<HistoryIcon/>} sx={{color: themeColors.accent}} onClick={()=>setOpenHistorial(true)}>Historial</Button>
                            </Box>
                        </Box>
                        
                        <Paper sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: themeColors.bgMain, p: 1 }}>
                            {listaBitacora.map((log) => (
                                <Box key={log.id} sx={{ p: 1.5, mb: 1, bgcolor: themeColors.bgPaper, borderRadius: 1, borderLeft: `4px solid ${themeColors.warning}` }}>
                                    <Typography variant="body2" color={themeColors.textPrimary}>{log.descripcion}</Typography>
                                    <Typography variant="caption" color={themeColors.textSecondary}>{new Date(log.fecha).toLocaleTimeString()}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Box>
                )}
             </Box>
           </Paper>
        </Grid>

        <Grid item xs={12} md={4} lg={3.5} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, display:'flex', alignItems:'center', justifyContent: 'space-between' }}>
                    {chatActivo ? (
                        <Box display="flex" alignItems="center">
                            <IconButton size="small" onClick={() => setChatActivo(null)} sx={{ color: themeColors.textSecondary, mr: 1 }}><ArrowBackIosNewIcon fontSize="small"/></IconButton>
                            <Typography variant="subtitle2" color={themeColors.textPrimary} fontWeight="bold">{chatActivo.first_name}</Typography>
                        </Box>
                    ) : <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Chat</Typography>}
                    {chatActivo && <Tooltip title="Ver Archivados"><IconButton onClick={() => setVerArchivados(!verArchivados)} sx={{color: verArchivados ? themeColors.warning : themeColors.textSecondary}}><ArchiveIcon /></IconButton></Tooltip>}
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!chatActivo ? (
                        <List sx={{ overflowY: 'auto', flexGrow: 1 }}>{vecinosFiltrados.map(v => (<ListItem button key={v.id} onClick={() => seleccionarVecino(v)} sx={{ borderBottom: `1px solid ${themeColors.bgLight}40` }}><ListItemText primary={<Typography color={themeColors.textPrimary}>{v.first_name} {v.last_name}</Typography>} secondary={<Typography color={themeColors.textSecondary} variant="caption">Casa {v.casa_id}</Typography>} /></ListItem>))}</List>
                    ) : (
                        <>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {mensajes.map((msg, i) => (
                                    <Box key={i} sx={{ alignSelf: msg.es_mio ? 'flex-end' : 'flex-start', maxWidth: '85%', position: 'relative' }}>
                                        <Paper elevation={1} sx={{ p: 1.5, bgcolor: msg.es_mio ? themeColors.chatGuardia : themeColors.chatVecino, color: '#f1f5f9', borderRadius: '12px' }}>
                                            <Typography variant="body2">{msg.mensaje}</Typography>
                                            <IconButton size="small" onClick={() => handleToggleArchivo(msg.id, !verArchivados)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: themeColors.bgPaper, color: themeColors.success }}><CheckCircleIcon fontSize="small" /></IconButton>
                                        </Paper>
                                    </Box>
                                ))}
                                <div ref={chatBottomRef} />
                            </Box>
                            {!verArchivados && (<Box sx={{ p: 1.5, display: 'flex' }}><CustomTextField fullWidth size="small" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} /><IconButton sx={{ bgcolor: themeColors.accent, color: 'white', ml: 1 }} onClick={enviarMensaje}><SendIcon /></IconButton></Box>)}
                        </>
                    )}
                </Box>
            </Paper>
        </Grid>
      </Grid>

      <Dialog open={openHistorial} onClose={()=>setOpenHistorial(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor: themeColors.bgPaper, color: 'white'}}>Historial</DialogTitle>
          <DialogContent sx={{bgcolor: themeColors.bgMain, color: 'white'}}>
              <CustomTextField type="date" label="Fecha" InputLabelProps={{shrink: true}} value={fechaHistorial} onChange={(e)=>setFechaHistorial(e.target.value)} sx={{mt:2}} />
              <Button variant="contained" fullWidth sx={{mt:2}} onClick={buscarHistorial}>BUSCAR</Button>
              <Box mt={2}>{listaHistorial.map((h, i) => (<Box key={i} p={1} mb={1} sx={{borderBottom: '1px solid gray'}}><Typography variant="body2">{h.descripcion}</Typography></Box>))}</Box>
          </DialogContent>
          <DialogActions sx={{bgcolor: themeColors.bgPaper}}><Button onClick={()=>setOpenHistorial(false)} sx={{color:'white'}}>Cerrar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default Caseta;