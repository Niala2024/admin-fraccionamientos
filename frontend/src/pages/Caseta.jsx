import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Grid, Paper, Button, 
  Tabs, Tab, TextField, IconButton, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Chip,
  Card, CardContent, InputAdornment, useTheme, Badge, Tooltip, MenuItem
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
import InventoryIcon from '@mui/icons-material/Inventory';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BadgeIcon from '@mui/icons-material/Badge';
import ArchiveIcon from '@mui/icons-material/Archive';

import api from '../api/axiosConfig';

// --- PALETA DE COLORES ---
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

// ✅ CORRECCIÓN IMPORTANTE: 
// El componente CustomTextField debe estar AFUERA de la función principal
// para evitar que pierda el foco o cierre el select al escribir.
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
  
  // --- ESTADOS ---
  const [reloj, setReloj] = useState(new Date());
  const [tabActionIndex, setTabActionIndex] = useState(0); 
  const [genteAdentro, setGenteAdentro] = useState([]);
  const [vecinos, setVecinos] = useState([]);
  const [vecinosFiltrados, setVecinosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Chat States
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [verArchivados, setVerArchivados] = useState(false);
  
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
  }, [chatActivo, verArchivados]);

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
    } catch (error) { console.error("Error datos", error); }
  };

  useEffect(() => {
      if(!busqueda) setVecinosFiltrados(vecinos);
      else {
          const lower = busqueda.toLowerCase();
          setVecinosFiltrados(vecinos.filter(v => (v.first_name+' '+v.last_name+v.username+v.casa_id).toLowerCase().includes(lower)));
      }
  }, [busqueda, vecinos]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  // --- LÓGICA CHAT ---
  const cargarChat = async (userId) => {
    try { 
        const res = await api.get(`/api/chat/?usuario=${userId}&archivados=${verArchivados}`); 
        setMensajes(res.data.results || res.data); 
    } catch(e){}
  };

  const seleccionarVecino = (vecino) => { setChatActivo(vecino); cargarChat(vecino.id); setBusqueda(''); };
  
  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try { await api.post('/api/chat/', { destinatario: chatActivo.id, mensaje: nuevoMensaje }); setNuevoMensaje(''); cargarChat(chatActivo.id); } 
    catch(e) { enqueueSnackbar('Error enviando', {variant:'error'}); }
  };

  const handleToggleArchivo = async (mensajeId, esArchivar) => {
      try {
          const endpoint = esArchivar ? 'archivar' : 'desarchivar';
          await api.patch(`/api/chat/${mensajeId}/${endpoint}/`);
          setMensajes(prev => prev.filter(m => m.id !== mensajeId));
          enqueueSnackbar(esArchivar ? 'Mensaje archivado' : 'Mensaje restaurado', { variant: 'success', autoHideDuration: 1000 });
      } catch (error) {
          enqueueSnackbar('Error al procesar mensaje', { variant: 'error' });
      }
  };

  // --- LÓGICA ACCESOS ---
  const handleSalida = async (item) => {
      if (!confirm(`¿Registrar salida de: ${item.nombre}?`)) return;
      try {
          if (item.tipo_registro === 'visita') await api.patch(`/api/visitas/${item.id}/`, { fecha_salida_real: new Date() });
          else await api.patch(`/api/accesos-trabajadores/${item.id}/`, { fecha_salida: new Date() });
          enqueueSnackbar('Salida registrada', { variant: 'info' }); cargarDatos();
      } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };

  const handleRegistroManual = async () => {
      if(!formManual.nombre || !formManual.destino) return enqueueSnackbar('Faltan datos', {variant: 'warning'});
      try { 
          await api.post('/api/visitas/', { ...formManual, metodo: 'MANUAL', fecha_llegada_real: new Date() }); 
          enqueueSnackbar('Acceso registrado', { variant: 'success' }); 
          setFormManual({ nombre: '', destino: '', tipo: 'Visita', placas: '' }); 
          cargarDatos(); 
      } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };
  
  const handleIncidente = async () => { if(!incidente) return; await api.post('/api/reportes-diarios/', { mensaje: incidente, tipo: 'INCIDENTE' }); setIncidente(''); enqueueSnackbar('Bitácora actualizada', { variant: 'warning' }); };

  // QR Scanner
  useEffect(() => {
      if (tabActionIndex === 0 && document.getElementById("reader")) {
          const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250, aspectRatio: 1.77 }, false);
          scanner.render((decoded) => { 
              setQrResult({ valido: true, mensaje: "Lectura: " + decoded }); 
              enqueueSnackbar('Código Escaneado', {variant:'success'}); 
          });
          return () => scanner.clear().catch(()=>{});
      }
  }, [tabActionIndex]);

  const getIcono = (tipo) => {
      if(tipo === 'Trabajador') return <EngineeringIcon sx={{color: '#facc15'}}/>;
      if(tipo === 'Proveedor' || tipo === 'CFE' || tipo === 'Gas') return <LocalShippingIcon color="secondary"/>;
      if(tipo === 'Taxi' || tipo === 'Uber') return <LocalTaxiIcon color="warning"/>;
      if(tipo === 'Paqueteria') return <InventoryIcon sx={{color:'#a5b4fc'}}/>;
      return <DirectionsCarIcon color="primary"/>;
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: themeColors.bgMain, overflow:'hidden' }}>
      
      {/* HEADER */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: themeColors.bgPaper, borderBottom: `1px solid ${themeColors.bgLight}` }}>
        <Toolbar variant="dense">
          <SecurityIcon sx={{ mr: 2, color: themeColors.accent }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 1, color: themeColors.textPrimary }}>
            CENTRO DE CONTROL
          </Typography>
          <Chip icon={<AccessTimeFilledIcon sx={{ color: themeColors.accent + '!important' }}/>} label={reloj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})} sx={{ bgcolor: themeColors.bgLight, color: themeColors.textPrimary, fontWeight: 'bold', borderRadius: '8px', mr: 3, height: 32, border: `1px solid ${themeColors.accent}40` }} />
          <Button variant="contained" color="error" size="small" startIcon={<WarningAmberIcon />} onClick={() => alert("ALERTA DE PÁNICO ACTIVADA")} sx={{borderRadius: 2, fontWeight:'bold', mr:1}}>SOS</Button>
          <IconButton onClick={() => { localStorage.clear(); navigate('/'); }} sx={{ color: themeColors.textSecondary, '&:hover':{color: themeColors.error} }}><Tooltip title="Cerrar Sesión"><LogoutIcon /></Tooltip></IconButton>
        </Toolbar>
      </AppBar>

      {/* Grid Principal */}
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        
        {/* COLUMNA 1: MONITOREO */}
        <Grid item xs={12} md={3} lg={2.5} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Gente Adentro</Typography>
                    <Badge badgeContent={genteAdentro.length} color="primary"><BadgeIcon sx={{color:themeColors.textSecondary}}/></Badge>
                </Box>
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                    {genteAdentro.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 4, color: themeColors.textSecondary, opacity: 0.7 }}>
                            <DirectionsCarIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">Fraccionamiento Vacío</Typography>
                        </Box>
                    ) : genteAdentro.map(item => (
                        <Card key={`${item.tipo_registro}-${item.id}`} elevation={0} sx={{ mb: 1, bgcolor: themeColors.bgLight, borderRadius: 2, border: `1px solid ${themeColors.bgPaper}` }}>
                            <CardContent sx={{ p: '12px !important' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                    {getIcono(item.tipo_icono)}
                                    <Box ml={1.5} flexGrow={1} overflow="hidden">
                                        <Typography variant="body2" fontWeight="bold" color={themeColors.textPrimary} noWrap>{item.nombre}</Typography>
                                        <Typography variant="caption" color={themeColors.textSecondary} display="block" noWrap>{item.subtitulo}</Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Chip label={item.destino} size="small" sx={{ bgcolor: themeColors.bgPaper, color: themeColors.textSecondary, fontSize: '0.7rem', height: 20, maxWidth: '60%' }} />
                                    <Button size="small" variant="contained" color="error" onClick={()=>handleSalida(item)} sx={{fontSize:'0.7rem', py:0.2, borderRadius:1.5, textTransform:'none'}}>Salida</Button>
                                </Box>
                                <Typography variant="caption" sx={{color: themeColors.textSecondary, fontSize:'0.6rem', mt:0.5, display:'block', textAlign:'right'}}>
                                    Entrada: {new Date(item.fecha_entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </List>
            </Paper>
        </Grid>

        {/* COLUMNA 2: ACCIÓN PRINCIPAL */}
        <Grid item xs={12} md={5} lg={6} sx={{ height: '100%' }}>
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
                        <Paper elevation={4} sx={{ width: '100%', maxWidth: 480, mx: 'auto', bgcolor: '#000', borderRadius: 3, overflow:'hidden', border: `2px solid ${themeColors.accent}` }}>
                            <div id="reader" style={{ width: '100%' }}></div>
                        </Paper>
                        {qrResult && <Chip label={qrResult.mensaje} color={qrResult.valido?'success':'error'} sx={{mt:3, fontSize:'1rem', py:2, borderRadius:2}} icon={qrResult.valido?<SecurityIcon/>:<WarningAmberIcon/>}/>}
                    </Box>
                )}

                {/* ✅ DISEÑO VERTICAL (Todos xs=12) */}
                {tabActionIndex === 1 && (
                    <Box maxWidth="sm" mx="auto" width="100%">
                        <Box mb={3} textAlign="center">
                            <Typography variant="h6" color={themeColors.accent} fontWeight="bold">Nuevo Ingreso Manual</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <CustomTextField label="Nombre del Conductor / Visitante" value={formManual.nombre} onChange={e=>setFormManual({...formManual, nombre:e.target.value})} InputProps={{startAdornment: <InputAdornment position="start"><PersonIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>}} />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField select label="Tipo de Visita" value={formManual.tipo} onChange={e=>setFormManual({...formManual, tipo:e.target.value})}>
                                    <MenuItem value="Visita">Visita Social</MenuItem>
                                    <MenuItem value="Proveedor">Proveedor / Servicio</MenuItem>
                                    <MenuItem value="Taxi">Taxi / Uber / Didi</MenuItem>
                                    <MenuItem value="Paqueteria">Paquetería / Amazon</MenuItem>
                                    <MenuItem value="CFE">CFE / Luz</MenuItem>
                                    <MenuItem value="Gas">Gas / Agua</MenuItem>
                                    <MenuItem value="Emergencia">Emergencia</MenuItem>
                                    <MenuItem value="Otro">Otro</MenuItem>
                                </CustomTextField>
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField label="Placas del Vehículo" value={formManual.placas} onChange={e=>setFormManual({...formManual, placas:e.target.value})} InputProps={{startAdornment: <InputAdornment position="start"><DirectionsCarIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>}}/>
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextField label="Destino (Casa / Calle)" value={formManual.destino} onChange={e=>setFormManual({...formManual, destino:e.target.value})}/>
                            </Grid>
                            <Grid item xs={12}>
                                <Button fullWidth variant="contained" size="large" sx={{bgcolor:themeColors.accent, color:'white', py:1.8, borderRadius: 2, fontSize:'1.1rem', '&:hover':{bgcolor:themeColors.accentHover}}} onClick={handleRegistroManual} startIcon={<SecurityIcon/>}>AUTORIZAR INGRESO</Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {tabActionIndex === 2 && (
                    <Box maxWidth="md" mx="auto" width="100%">
                        <CustomTextField multiline rows={8} placeholder="Describa detalladamente el suceso..." value={incidente} onChange={e=>setIncidente(e.target.value)}/>
                        <Button fullWidth variant="contained" color="warning" sx={{mt:3, py:1.5, borderRadius: 2}} onClick={handleIncidente} startIcon={<BookIcon/>}>REGISTRAR EN BITÁCORA</Button>
                    </Box>
                )}
             </Box>
           </Paper>
        </Grid>

        {/* COLUMNA 3: COMUNICACIÓN */}
        <Grid item xs={12} md={4} lg={3.5} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ height: '100%', bgcolor: themeColors.bgPaper, borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${themeColors.bgLight}`, bgcolor: chatActivo ? themeColors.chatGuardia + '20' : 'transparent', display:'flex', alignItems:'center', justifyContent: 'space-between' }}>
                    {chatActivo ? (
                        <Box display="flex" alignItems="center">
                            <IconButton size="small" onClick={() => setChatActivo(null)} sx={{ color: themeColors.textSecondary, mr: 1 }}><ArrowBackIosNewIcon fontSize="small"/></IconButton>
                            <Avatar sx={{ bgcolor: themeColors.accent, width: 32, height: 32, mr: 1.5, fontSize:'0.9rem', fontWeight:'bold' }}>{chatActivo.username.charAt(0).toUpperCase()}</Avatar>
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" color={themeColors.textPrimary} noWrap fontWeight="bold">{chatActivo.first_name}</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="subtitle1" fontWeight="bold" color={themeColors.textPrimary}>Comunicación</Typography>
                    )}

                    {chatActivo && (
                         <Tooltip title={verArchivados ? "Ver Mensajes Activos" : "Ver Archivados"}>
                            <IconButton onClick={() => setVerArchivados(!verArchivados)} sx={{color: verArchivados ? themeColors.warning : themeColors.textSecondary}}>
                                <ArchiveIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!chatActivo ? (
                        <>
                            <Box sx={{ p: 1.5, borderBottom: `1px solid ${themeColors.bgLight}` }}>
                                <CustomTextField size="small" placeholder="Buscar vecino..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{color:themeColors.textSecondary}}/></InputAdornment>, sx: { borderRadius: 4, bgcolor: themeColors.bgLight } }} sx={{'& .MuiOutlinedInput-root': { borderRadius: 4 }}}/>
                            </Box>
                            <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                {vecinosFiltrados.map(v => (
                                    <ListItem button key={v.id} onClick={() => seleccionarVecino(v)} sx={{ '&:hover': { bgcolor: themeColors.bgLight }, borderBottom: `1px solid ${themeColors.bgLight}40` }}>
                                        <ListItemAvatar><Avatar sx={{ bgcolor: themeColors.bgLight, color: themeColors.accent, fontWeight:'bold' }}>{v.username.charAt(0).toUpperCase()}</Avatar></ListItemAvatar>
                                        <ListItemText primary={<Typography color={themeColors.textPrimary} fontWeight={500}>{v.first_name} {v.last_name}</Typography>} secondary={<Typography color={themeColors.textSecondary} variant="caption">Casa {v.casa_id || '?'}</Typography>} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    ) : (
                        <>
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: themeColors.bgMain + '80' }}>
                                {mensajes.length === 0 && (
                                    <Typography align="center" sx={{color: themeColors.textSecondary, mt:4, fontStyle:'italic'}}>
                                        {verArchivados ? "No hay mensajes archivados" : "No hay mensajes recientes"}
                                    </Typography>
                                )}
                                {mensajes.map((msg, i) => (
                                    <Box key={i} sx={{ alignSelf: msg.es_mio ? 'flex-end' : 'flex-start', maxWidth: '85%', position: 'relative', '&:hover .archive-btn': {opacity: 1} }}>
                                        <Paper elevation={1} sx={{ p: 1.5, bgcolor: msg.es_mio ? themeColors.chatGuardia : themeColors.chatVecino, color: '#f1f5f9', borderRadius: '12px', borderBottomRightRadius: msg.es_mio?0:12, borderBottomLeftRadius:!msg.es_mio?0:12, pr: 4 }}>
                                            <Typography variant="body2" sx={{whiteSpace: 'pre-wrap', fontSize:'0.9rem'}}>{msg.mensaje}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, fontSize: '0.65rem', mt: 0.5 }}>{new Date(msg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography>
                                            
                                            <Tooltip title={verArchivados ? "Restaurar" : "Archivar"}>
                                                <IconButton 
                                                    className="archive-btn"
                                                    size="small" 
                                                    onClick={() => handleToggleArchivo(msg.id, !verArchivados)}
                                                    sx={{ position: 'absolute', top: -10, right: -10, opacity: 0, transition: '0.2s', bgcolor: themeColors.bgPaper, border: `1px solid ${themeColors.bgLight}`, color: verArchivados ? themeColors.warning : themeColors.success, '&:hover':{bgcolor:themeColors.bgLight} }}
                                                >
                                                    {verArchivados ? <RestoreFromTrashIcon fontSize="small"/> : <CheckCircleIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Paper>
                                    </Box>
                                ))}
                                <div ref={chatBottomRef} />
                            </Box>
                            
                            {!verArchivados && (
                                <Box sx={{ p: 1.5, bgcolor: themeColors.bgPaper, borderTop: `1px solid ${themeColors.bgLight}`, display: 'flex', alignItems:'center' }}>
                                    <CustomTextField fullWidth size="small" placeholder="Responder..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} sx={{ mr: 1, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: themeColors.bgLight } }} />
                                    <IconButton sx={{ bgcolor: themeColors.accent, color: 'white', '&:hover': { bgcolor: themeColors.accentHover }, width:40, height:40 }} onClick={enviarMensaje} disabled={!nuevoMensaje.trim()}><SendIcon fontSize="small" /></IconButton>
                                </Box>
                            )}
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