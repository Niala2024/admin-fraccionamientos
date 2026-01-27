import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Grid, Paper, Button, 
  Tabs, Tab, TextField, IconButton, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Divider, Chip,
  Card, CardContent, InputAdornment, useTheme, Badge
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos Profesionales
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

import api from '../api/axiosConfig';

// --- PALETA DE COLORES ERGONÓMICA (Slate Blue Theme) ---
const themeColors = {
    bgMain: '#0f172a',      // Fondo principal muy oscuro (Slate 900)
    bgPaper: '#1e293b',     // Paneles y tarjetas (Slate 800)
    bgLight: '#334155',     // Inputs y elementos secundarios (Slate 700)
    accent: '#3b82f6',      // Azul profesional para acciones (Blue 500)
    accentHover: '#2563eb', // Hover del azul
    textPrimary: '#f1f5f9', // Texto principal claro (Slate 100)
    textSecondary: '#94a3b8', // Texto secundario (Slate 400)
    success: '#059669',     // Verde suave
    warning: '#d97706',     // Naranja quemado
    error: '#dc2626',       // Rojo
    chatGuardia: '#1e40af', // Burbuja azul oscuro para el guardia
    chatVecino: '#334155'   // Burbuja gris para el vecino
};

function Caseta() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const chatBottomRef = useRef(null);
  const theme = useTheme();
  
  // --- ESTADOS ---
  const [reloj, setReloj] = useState(new Date());
  const [tabActionIndex, setTabActionIndex] = useState(0); // 0: QR, 1: Manual, 2: Bitácora

  const [visitasActivas, setVisitasActivas] = useState([]);
  const [vecinos, setVecinos] = useState([]);
  const [vecinosFiltrados, setVecinosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  
  const [formManual, setFormManual] = useState({ nombre: '', destino: '', tipo: 'Visita', placas: '' });
  const [incidente, setIncidente] = useState('');
  const [qrResult, setQrResult] = useState(null);

  // --- RELOJ Y CARGA INICIAL ---
  useEffect(() => {
    const timer = setInterval(() => setReloj(new Date()), 1000);
    cargarDatos();
    const dataInterval = setInterval(() => {
        cargarDatos();
        if (chatActivo) cargarChat(chatActivo.id);
    }, 5000);
    return () => { clearInterval(timer); clearInterval(dataInterval); };
  }, [chatActivo]);

  const cargarDatos = async () => {
    try {
      const [resVisitas, resUsuarios] = await Promise.all([
        api.get('/api/visitas/?estado=ACTIVA'),
        api.get('/api/usuarios/')
      ]);
      setVisitasActivas(resVisitas.data.results || resVisitas.data);
      const listaVecinos = (resUsuarios.data.results || resUsuarios.data).filter(u => !u.is_staff && !u.is_superuser);
      setVecinos(listaVecinos);
      if (!busqueda) setVecinosFiltrados(listaVecinos);
    } catch (error) { console.error("Error datos", error); }
  };

  // Filtrado de búsqueda
  useEffect(() => {
      if(!busqueda) setVecinosFiltrados(vecinos);
      else {
          const lower = busqueda.toLowerCase();
          setVecinosFiltrados(vecinos.filter(v => (v.first_name+' '+v.last_name+v.username+v.casa_id).toLowerCase().includes(lower)));
      }
  }, [busqueda, vecinos]);

  // Scroll Chat
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  // --- FUNCIONES LÓGICAS ---
  const cargarChat = async (userId) => {
    try { const res = await api.get(`/api/chat/?usuario=${userId}`); setMensajes(res.data.results || res.data); } catch(e){}
  };
  const seleccionarVecino = (vecino) => { setChatActivo(vecino); cargarChat(vecino.id); setBusqueda(''); };
  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try { await api.post('/api/chat/', { destinatario: chatActivo.id, mensaje: nuevoMensaje }); setNuevoMensaje(''); cargarChat(chatActivo.id); } 
    catch(e) { enqueueSnackbar('Error enviando', {variant:'error'}); }
  };

  const handleRegistroManual = async () => {
      if(!formManual.nombre || !formManual.destino) return enqueueSnackbar('Faltan datos', {variant: 'warning'});
      try { await api.post('/api/visitas/', { ...formManual, metodo: 'MANUAL' }); enqueueSnackbar('Acceso registrado', { variant: 'success' }); setFormManual({ nombre: '', destino: '', tipo: 'Visita', placas: '' }); cargarDatos(); } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };
  const handleSalida = async (id) => { if (confirm("¿Registrar salida?")) { try { await api.patch(`/api/visitas/${id}/`, { estado: 'FINALIZADA', fecha_salida: new Date() }); enqueueSnackbar('Salida registrada', { variant: 'info' }); cargarDatos(); } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }} };
  const handleIncidente = async () => { if(!incidente) return; await api.post('/api/reportes-diarios/', { mensaje: incidente, tipo: 'INCIDENTE' }); setIncidente(''); enqueueSnackbar('Bitácora actualizada', { variant: 'warning' }); };

  // QR Scanner
  useEffect(() => {
      if (tabActionIndex === 0 && document.getElementById("reader")) {
          const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250, aspectRatio: 1.77 }, false);
          scanner.render((decoded) => { setQrResult({ valido: true, mensaje: "✅ Pase Válido: " + decoded }); enqueueSnackbar('QR Procesado', {variant:'success'}); });
          return () => scanner.clear().catch(()=>{});
      }
  }, [tabActionIndex]);

  // Helpers de UI
  const getIconoVisita = (tipo) => {
      if(tipo === 'Proveedor') return <LocalShippingIcon color="secondary"/>;
      if(tipo === 'Taxi') return <LocalTaxiIcon color="warning"/>;
      return <DirectionsCarIcon color="primary"/>;
  };

  const CustomTextField = (props) => (
      <TextField {...props} variant="outlined" fullWidth 
        sx={{ 
            '& .MuiOutlinedInput-root': { color: themeColors.textPrimary, bgcolor: themeColors.bgLight, borderRadius: 2 },
            '& .MuiInputLabel-root': { color: themeColors.textSecondary },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeColors.accent },
             ...props.sx
        }} 
      />
  );

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: themeColors.bgMain, overflow:'hidden' }}>
      
      {/* --- HEADER PROFESIONAL --- */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: themeColors.bgPaper, borderBottom: `1px solid ${themeColors.bgLight}` }}>
        <Toolbar variant="dense">
          <SecurityIcon sx={{ mr: 2, color: themeColors.accent }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 1, color: themeColors.textPrimary }}>
            CENTRO DE CONTROL
          </Typography>
          
          {/* Reloj Dashboard */}
          <Chip 
             icon={<AccessTimeFilledIcon sx={{ color: themeColors.accent + '!important' }}/>} 
             label={reloj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})} 
             sx={{ bgcolor: themeColors.bgLight, color: themeColors.textPrimary, fontWeight: 'bold', borderRadius: '8px', mr: 3, height: 32, border: `1px solid ${themeColors.accent}40` }} 
          />
          
          <Button variant="contained" color="error" size="small" startIcon={<WarningAmberIcon />} onClick={() => alert("ALERTA DE PÁNICO ACTIVADA")} sx={{borderRadius: 2, fontWeight:'bold', mr:1}}>
            SOS
          </Button>
          <IconButton onClick={() => { localStorage.clear(); navigate('/'); }} sx={{ color: themeColors.textSecondary, '&:hover':{color: themeColors.error} }}>
            <Tooltip title="Cerrar Sesión"><LogoutIcon /></Tooltip>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- LAYOUT PRINCIPAL DE 3 COLUMNAS --- */}
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        
        {/* COLUMNA 1: MONITOREO (Izquierda - Estrecha) */}
        <Grid item xs={12} md={3} lg={2.5} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Vehículos Dentro</Typography>
                    <Badge badgeContent={visitasActivas.length} color="primary"><DirectionsCarIcon sx={{color:themeColors.textSecondary}}/></Badge>
                </Box>
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                    {visitasActivas.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 4, color: themeColors.textSecondary, opacity: 0.7 }}>
                            <DirectionsCarIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">Sin vehículos registrados</Typography>
                        </Box>
                    ) : visitasActivas.map(v => (
                        <Card key={v.id} elevation={0} sx={{ mb: 1, bgcolor: themeColors.bgLight, borderRadius: 2, border: `1px solid ${themeColors.bgPaper}` }}>
                            <CardContent sx={{ p: '12px !important' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    {getIconoVisita(v.tipo)}
                                    <Box ml={1.5} flexGrow={1}>
                                        <Typography variant="body2" fontWeight="bold" color={themeColors.textPrimary} noWrap>{v.nombre_visitante}</Typography>
                                        <Typography variant="caption" color={themeColors.textSecondary} display="block">{v.placas_vehiculo || 'Sin placas'}</Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Chip label={v.casa_destino || 'Destino'} size="small" sx={{ bgcolor: themeColors.bgPaper, color: themeColors.textSecondary, fontSize: '0.7rem', height: 20 }} />
                                    <Button size="small" variant="contained" color="error" onClick={()=>handleSalida(v.id)} sx={{fontSize:'0.7rem', py:0.2, borderRadius:1.5, textTransform:'none'}}>Salida</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </List>
            </Paper>
        </Grid>

        {/* COLUMNA 2: ÁREA DE ACCIÓN PRINCIPAL (Centro - Ancha) */}
        <Grid item xs={12} md={6} lg={6.5} sx={{ height: '100%' }}>
           <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display:'flex', flexDirection:'column', overflow:'hidden' }}>
             <Tabs value={tabActionIndex} onChange={(e,v)=>setTabActionIndex(v)} centered 
                 sx={{ borderBottom: `1px solid ${themeColors.bgLight}`, '& .MuiTab-root': { color: themeColors.textSecondary, textTransform:'none', fontWeight:500 }, '& .Mui-selected': { color: themeColors.accent + '!important' } }}
                 TabIndicatorProps={{ style: { backgroundColor: themeColors.accent } }}
             >
                <Tab icon={<QrCodeScannerIcon sx={{mb:0}}/>} label="Escáner QR" iconPosition="start" />
                <Tab icon={<DirectionsCarIcon sx={{mb:0}}/>} label="Registro Manual" iconPosition="start" />
                <Tab icon={<BookIcon sx={{mb:0}}/>} label="Bitácora" iconPosition="start" />
             </Tabs>
             
             <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', display:'flex', flexDirection:'column' }}>
                {tabActionIndex === 0 && (
                    <Box textAlign="center" flexGrow={1} display="flex" flexDirection="column" justifyContent="center">
                        <Typography variant="h5" color={themeColors.textPrimary} gutterBottom fontWeight="bold">Escanear Pase de Acceso</Typography>
                        <Typography variant="body2" color={themeColors.textSecondary} mb={3}>Presente el código QR frente a la cámara.</Typography>
                        <Paper elevation={4} sx={{ width: '100%', maxWidth: 480, mx: 'auto', bgcolor: '#000', borderRadius: 3, overflow:'hidden', border: `2px solid ${themeColors.accent}` }}>
                            <div id="reader" style={{ width: '100%' }}></div>
                        </Paper>
                        {qrResult && <Chip label={qrResult.mensaje} color={qrResult.valido?'success':'error'} sx={{mt:3, fontSize:'1rem', py:2, borderRadius:2}} icon={qrResult.valido?<SecurityIcon/>:<WarningAmberIcon/>}/>}
                    </Box>
                )}

                {tabActionIndex === 1 && (
                    <Box maxWidth="md" mx="auto" width="100%">
                        <Box mb={3} textAlign="center">
                            <Typography variant="h6" color={themeColors.accent} fontWeight="bold">Nuevo Ingreso Manual</Typography>
                            <Typography variant="body2" color={themeColors.textSecondary}>Registro para proveedores o visitas sin app.</Typography>
                        </Box>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={7}><CustomTextField label="Nombre del Conductor / Visitante" value={formManual.nombre} onChange={e=>setFormManual({...formManual, nombre:e.target.value})} InputProps={{startAdornment: <InputAdornment position="start"><PersonIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>}} /></Grid>
                            <Grid item xs={12} md={5}>
                                <CustomTextField select label="Tipo de Visita" value={formManual.tipo} onChange={e=>setFormManual({...formManual, tipo:e.target.value})} SelectProps={{native:true}}>
                                    <option value="Visita">Visita Social</option>
                                    <option value="Proveedor">Proveedor / Servicio</option>
                                    <option value="Taxi">Taxi / Plataforma</option>
                                    <option value="Emergencia">Emergencia</option>
                                </CustomTextField>
                            </Grid>
                            <Grid item xs={12} md={6}><CustomTextField label="Placas del Vehículo" value={formManual.placas} onChange={e=>setFormManual({...formManual, placas:e.target.value})} InputProps={{startAdornment: <InputAdornment position="start"><DirectionsCarIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>}}/></Grid>
                            <Grid item xs={12} md={6}><CustomTextField label="Destino (Casa / Calle)" value={formManual.destino} onChange={e=>setFormManual({...formManual, destino:e.target.value})}/></Grid>
                            <Grid item xs={12}>
                                <Button fullWidth variant="contained" size="large" sx={{bgcolor:themeColors.accent, color:'white', py:1.8, borderRadius: 2, fontSize:'1.1rem', '&:hover':{bgcolor:themeColors.accentHover}}} onClick={handleRegistroManual} startIcon={<SecurityIcon/>}>
                                    AUTORIZAR INGRESO
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {tabActionIndex === 2 && (
                    <Box maxWidth="md" mx="auto" width="100%">
                         <Box mb={3} textAlign="left">
                            <Typography variant="h6" color={themeColors.warning} fontWeight="bold" display="flex" alignItems="center">
                                <WarningAmberIcon sx={{mr:1}}/> Reporte de Incidencias
                            </Typography>
                            <Typography variant="body2" color={themeColors.textSecondary}>Registre cualquier novedad relevante durante su turno.</Typography>
                        </Box>
                        <CustomTextField multiline rows={8} placeholder="Describa detalladamente el suceso, hora, involucrados, etc..." value={incidente} onChange={e=>setIncidente(e.target.value)}/>
                        <Button fullWidth variant="contained" color="warning" sx={{mt:3, py:1.5, borderRadius: 2, fontSize:'1rem'}} onClick={handleIncidente} startIcon={<BookIcon/>}>
                            REGISTRAR EN BITÁCORA
                        </Button>
                    </Box>
                )}
             </Box>
           </Paper>
        </Grid>

        {/* COLUMNA 3: COMUNICACIÓN (Derecha - Media) */}
        <Grid item xs={12} md={3} lg={3} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* ENCABEZADO CHAT */}
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, bgcolor: chatActivo ? themeColors.chatGuardia + '20' : 'transparent', display:'flex', alignItems:'center' }}>
                    {chatActivo ? (
                        <>
                            <IconButton size="small" onClick={() => setChatActivo(null)} sx={{ color: themeColors.textSecondary, mr: 1 }}><ArrowBackIosNewIcon fontSize="small"/></IconButton>
                            <Avatar sx={{ bgcolor: themeColors.accent, width: 32, height: 32, mr: 1.5, fontSize:'0.9rem', fontWeight:'bold' }}>{chatActivo.username.charAt(0).toUpperCase()}</Avatar>
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" color={themeColors.textPrimary} noWrap fontWeight="bold">{chatActivo.first_name} {chatActivo.last_name}</Typography>
                                <Typography variant="caption" color={themeColors.textSecondary} noWrap>Casa {chatActivo.casa_id || 'S/N'}</Typography>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Comunicación Vecinos</Typography>
                    )}
                </Box>

                {/* CUERPO CHAT/DIRECTORIO */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!chatActivo ? (
                        // VISTA DIRECTORIO
                        <>
                            <Box sx={{ p: 1.5, borderBottom: `1px solid ${themeColors.bgLight}` }}>
                                <CustomTextField size="small" placeholder="Buscar vecino..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>, sx: { borderRadius: 4, bgcolor: themeColors.bgLight } }} sx={{'& .MuiOutlinedInput-root': { borderRadius: 4 }}}/>
                            </Box>
                            <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                {vecinosFiltrados.map(v => (
                                    <ListItem button key={v.id} onClick={() => seleccionarVecino(v)} sx={{ '&:hover': { bgcolor: themeColors.bgLight }, borderBottom: `1px solid ${themeColors.bgLight}40`, py: 1.5 }}>
                                        <ListItemAvatar><Avatar sx={{ bgcolor: themeColors.bgLight, color: themeColors.accent, fontWeight:'bold' }}>{v.username.charAt(0).toUpperCase()}</Avatar></ListItemAvatar>
                                        <ListItemText primary={<Typography color={themeColors.textPrimary} fontWeight={500}>{v.first_name} {v.last_name}</Typography>} secondary={<Typography color={themeColors.textSecondary} variant="caption">Casa {v.casa_id || '?'}</Typography>} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    ) : (
                        // VISTA CONVERSACIÓN
                        <>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: themeColors.bgMain + '80' }}>
                                {mensajes.map((msg, i) => (
                                    <Box key={i} sx={{ alignSelf: msg.es_mio ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                        <Paper elevation={1} sx={{ p: 1.5, bgcolor: msg.es_mio ? themeColors.chatGuardia : themeColors.chatVecino, color: '#f1f5f9', borderRadius: '12px', borderBottomRightRadius: msg.es_mio?0:12, borderBottomLeftRadius:!msg.es_mio?0:12 }}>
                                            <Typography variant="body2" sx={{whiteSpace: 'pre-wrap', fontSize:'0.9rem'}}>{msg.mensaje}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, fontSize: '0.65rem', mt: 0.5 }}>{new Date(msg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography>
                                        </Paper>
                                    </Box>
                                ))}
                                <div ref={chatBottomRef} />
                            </Box>
                            <Box sx={{ p: 1.5, bgcolor: themeColors.bgPaper, borderTop: `1px solid ${themeColors.bgLight}`, display: 'flex', alignItems:'center' }}>
                                <CustomTextField fullWidth size="small" placeholder="Escribe un mensaje..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} sx={{ mr: 1, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: themeColors.bgLight } }} />
                                <IconButton sx={{ bgcolor: themeColors.accent, color: 'white', '&:hover': { bgcolor: themeColors.accentHover }, width:40, height:40 }} onClick={enviarMensaje} disabled={!nuevoMensaje.trim()}>
                                    <SendIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </>
                    )}
                </Box>
            </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}

export default Caseta;