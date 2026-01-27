import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Grid, Paper, Button, 
  Tabs, Tab, TextField, IconButton, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Divider, Badge, Chip,
  Card, CardContent, InputAdornment, Tooltip
} from '@mui/material';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import SecurityIcon from '@mui/icons-material/Security';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookIcon from '@mui/icons-material/Book';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircleIcon from '@mui/icons-material/Circle';

import api from '../api/axiosConfig';

function Caseta() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const chatBottomRef = useRef(null);
  
  // --- ESTADOS ---
  const [reloj, setReloj] = useState(new Date());
  const [tabIndex, setTabIndex] = useState(0); // 0: Escaner, 1: Manual, 2: Bitácora
  const [tabLateral, setTabLateral] = useState(1); // 0: Autos, 1: Chat (Default para ver el cambio)

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

  // --- RELOJ ---
  useEffect(() => {
    const timer = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CARGA DE DATOS ---
  const cargarDatos = async () => {
    try {
      const [resVisitas, resUsuarios] = await Promise.all([
        api.get('/api/visitas/?estado=ACTIVA'),
        api.get('/api/usuarios/') // Trae a todos para el directorio
      ]);
      setVisitasActivas(resVisitas.data.results || resVisitas.data);
      
      // Filtrar usuarios: Excluir admins y staff, dejar solo residentes
      const listaVecinos = (resUsuarios.data.results || resUsuarios.data).filter(u => !u.is_staff && !u.is_superuser);
      setVecinos(listaVecinos);
      // Si no hay búsqueda activa, actualizar filtrados
      if (!busqueda) setVecinosFiltrados(listaVecinos);

    } catch (error) {
      console.error("Error cargando datos caseta", error);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => {
        cargarDatos();
        if (chatActivo) cargarChat(chatActivo.id); // Refrescar chat si está abierto
    }, 5000); // Refresco rápido para chat (5s)
    return () => clearInterval(interval);
  }, [chatActivo]); // Dependencia chatActivo para el intervalo

  // Filtrado de búsqueda
  useEffect(() => {
      if(!busqueda) {
          setVecinosFiltrados(vecinos);
      } else {
          const lower = busqueda.toLowerCase();
          setVecinosFiltrados(vecinos.filter(v => 
              (v.first_name + ' ' + v.last_name).toLowerCase().includes(lower) ||
              (v.username).toLowerCase().includes(lower) ||
              (v.email).toLowerCase().includes(lower)
          ));
      }
  }, [busqueda, vecinos]);

  // Scroll automático al último mensaje
  useEffect(() => {
      if (chatBottomRef.current) {
          chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [mensajes]);


  // --- CHAT LOGIC ---
  const cargarChat = async (userId) => {
    try {
      // ?usuario=ID filtra la conversación con ese vecino específico
      const res = await api.get(`/api/chat/?usuario=${userId}`);
      setMensajes(res.data.results || res.data);
    } catch (error) {
      console.error("Error cargando chat", error);
    }
  };

  const seleccionarVecino = (vecino) => {
    setChatActivo(vecino);
    cargarChat(vecino.id);
    // En móviles o pantallas chicas, esto podría ocultar la lista, pero aquí es split view o full panel
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await api.post('/api/chat/', {
        destinatario: chatActivo.id,
        mensaje: nuevoMensaje
      });
      setNuevoMensaje('');
      cargarChat(chatActivo.id);
    } catch (error) {
      enqueueSnackbar('Error enviando mensaje', { variant: 'error' });
    }
  };

  // --- ACCESOS LOGIC ---
  const handleRegistroManual = async () => {
      if(!formManual.nombre || !formManual.destino) return enqueueSnackbar('Faltan datos', {variant: 'warning'});
      try {
          await api.post('/api/visitas/', { ...formManual, metodo: 'MANUAL' });
          enqueueSnackbar('Ingreso registrado', { variant: 'success' });
          setFormManual({ nombre: '', destino: '', tipo: 'Visita', placas: '' });
          cargarDatos();
      } catch (e) { enqueueSnackbar('Error al registrar', { variant: 'error' }); }
  };

  const handleSalida = async (id) => {
      if (!confirm("¿Registrar salida?")) return;
      try {
          await api.patch(`/api/visitas/${id}/`, { estado: 'FINALIZADA', fecha_salida: new Date() });
          enqueueSnackbar('Salida registrada', { variant: 'info' });
          cargarDatos();
      } catch (e) { enqueueSnackbar('Error', { variant: 'error' }); }
  };

  const handleIncidente = async () => {
      if(!incidente) return;
      await api.post('/api/reportes-diarios/', { mensaje: incidente, tipo: 'INCIDENTE' });
      setIncidente('');
      enqueueSnackbar('Incidente registrado', { variant: 'warning' });
  };

  // --- QR ---
  useEffect(() => {
      if (tabIndex === 0 && document.getElementById("reader")) {
          const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
          scanner.render((decoded) => {
              setQrResult({ valido: true, mensaje: "Lectura Exitosa: " + decoded });
              enqueueSnackbar('QR Leído', {variant:'success'});
          });
          return () => scanner.clear().catch(e=>console.error(e));
      }
  }, [tabIndex]);

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0b141a' }}> {/* Fondo Dark WhatsApp */}
      
      {/* HEADER */}
      <AppBar position="static" sx={{ bgcolor: '#202c33', borderBottom: '1px solid #333' }}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2, color: '#00a884' }} /> {/* Verde WhatsApp */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>CASETA VIGILANCIA</Typography>
          
          <Chip 
             icon={<AccessTimeIcon sx={{color:'white'}}/>} 
             label={reloj.toLocaleTimeString()} 
             sx={{ bgcolor: '#111b21', color: '#00e676', fontWeight: 'bold', border: '1px solid #333', mr: 2 }} 
          />
          
          <Button variant="contained" color="error" startIcon={<WarningIcon />} onClick={() => alert("ALERTA GENERAL ENVIADA")}>
            SOS
          </Button>
          <IconButton color="inherit" onClick={() => { localStorage.clear(); navigate('/'); }} sx={{ ml: 1 }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        
        {/* --- IZQUIERDA: OPERACIONES --- */}
        <Grid item xs={12} md={7} lg={8} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
           <Paper sx={{ flexGrow: 1, bgcolor: '#111b21', color: '#e9edef', borderRadius: 3, overflow: 'hidden', display:'flex', flexDirection:'column' }}>
             <Tabs value={tabIndex} onChange={(e,v)=>setTabIndex(v)} centered indicatorColor="primary" textColor="inherit" sx={{borderBottom:'1px solid #333'}}>
                <Tab icon={<QrCodeScannerIcon/>} label="QR" />
                <Tab icon={<DirectionsCarIcon/>} label="Manual" />
                <Tab icon={<BookIcon/>} label="Bitácora" />
             </Tabs>
             
             <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                {tabIndex === 0 && (
                    <Box textAlign="center">
                        <Typography variant="h6" gutterBottom>Escanear Pase</Typography>
                        <Box id="reader" sx={{ width: '100%', maxWidth: 400, mx: 'auto', bgcolor: 'black', borderRadius: 2, overflow:'hidden' }} />
                        {qrResult && <Paper sx={{mt:2, p:2, bgcolor:'#005c4b', color:'white'}}>{qrResult.mensaje}</Paper>}
                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box maxWidth="sm" mx="auto">
                        <Typography color="#00a884" variant="h6" mb={2}>Registro Manual</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}><TextField fullWidth label="Conductor" variant="filled" sx={{bgcolor:'#202c33', borderRadius:1}} InputLabelProps={{style:{color:'#aebac1'}}} inputProps={{style:{color:'white'}}} value={formManual.nombre} onChange={e=>setFormManual({...formManual, nombre:e.target.value})}/></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Placas" variant="filled" sx={{bgcolor:'#202c33', borderRadius:1}} InputLabelProps={{style:{color:'#aebac1'}}} inputProps={{style:{color:'white'}}} value={formManual.placas} onChange={e=>setFormManual({...formManual, placas:e.target.value})}/></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Destino" variant="filled" sx={{bgcolor:'#202c33', borderRadius:1}} InputLabelProps={{style:{color:'#aebac1'}}} inputProps={{style:{color:'white'}}} value={formManual.destino} onChange={e=>setFormManual({...formManual, destino:e.target.value})}/></Grid>
                            <Grid item xs={12}><Button fullWidth variant="contained" size="large" sx={{bgcolor:'#00a884', color:'white', py:1.5}} onClick={handleRegistroManual}>Dar Acceso</Button></Grid>
                        </Grid>
                    </Box>
                )}

                {tabIndex === 2 && (
                    <Box>
                        <Typography color="error" variant="h6">Reportar Incidente</Typography>
                        <TextField fullWidth multiline rows={4} variant="filled" placeholder="Descripción..." sx={{bgcolor:'#202c33', borderRadius:1, mt:2}} inputProps={{style:{color:'white'}}} value={incidente} onChange={e=>setIncidente(e.target.value)}/>
                        <Button fullWidth variant="contained" color="warning" sx={{mt:2}} onClick={handleIncidente}>Registrar</Button>
                    </Box>
                )}
             </Box>
           </Paper>
        </Grid>

        {/* --- DERECHA: CHAT Y VISITAS (Estilo WhatsApp) --- */}
        <Grid item xs={12} md={5} lg={4} sx={{ bgcolor: '#111b21', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* TABS LATERALES */}
            <Box sx={{ borderBottom: '1px solid #333', bgcolor: '#202c33' }}>
                <Tabs value={tabLateral} onChange={(e,v)=>setTabLateral(v)} textColor="inherit" indicatorColor="primary" variant="fullWidth">
                    <Tab label={`Adentro (${visitasActivas.length})`} />
                    <Tab label="Chat Vecinos" icon={<ChatIcon sx={{color: '#00a884'}}/>} iconPosition="start" />
                </Tabs>
            </Box>

            {/* TAB 0: AUTOS ADENTRO */}
            {tabLateral === 0 && (
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                    {visitasActivas.length === 0 ? <Typography align="center" sx={{mt:4, color:'#8696a0'}}>Sin visitas activas</Typography> : 
                    visitasActivas.map(v => (
                        <Card key={v.id} sx={{ mb: 1, bgcolor: '#202c33', color: '#e9edef' }}>
                            <CardContent sx={{ pb: '10px !important', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">{v.nombre_visitante}</Typography>
                                    <Typography variant="caption" color="#8696a0">{v.placas_vehiculo || 'Sin placas'}</Typography>
                                </Box>
                                <Button size="small" variant="outlined" color="error" onClick={()=>handleSalida(v.id)}>Salida</Button>
                            </CardContent>
                        </Card>
                    ))}
                </List>
            )}

            {/* TAB 1: CHAT WHATSAPP STYLE */}
            {tabLateral === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* VISTA 1: LISTA DE CONTACTOS (Si no hay chat activo) */}
                    {!chatActivo ? (
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Buscador */}
                            <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    placeholder="Buscar vecino o casa..." 
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{color:'#8696a0'}}/></InputAdornment>,
                                        style: { color: 'white', backgroundColor: '#202c33', borderRadius: 8 }
                                    }}
                                />
                            </Box>
                            
                            {/* Lista */}
                            <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
                                {vecinosFiltrados.length === 0 ? (
                                    <Typography align="center" sx={{ mt: 4, color: '#8696a0' }}>
                                        {vecinos.length === 0 ? "Cargando vecinos..." : "No encontrado"}
                                    </Typography>
                                ) : (
                                    vecinosFiltrados.map(v => (
                                        <ListItem button key={v.id} onClick={() => seleccionarVecino(v)} sx={{ '&:hover': { bgcolor: '#202c33' }, borderBottom:'1px solid #222' }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: '#00a884' }}>{v.username.charAt(0).toUpperCase()}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={<Typography color="#e9edef" fontWeight="bold">{v.first_name} {v.last_name}</Typography>}
                                                secondary={<Typography color="#8696a0" variant="body2">{v.username} • Casa {v.casa_id || '?'}</Typography>}
                                            />
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>
                    ) : (
                        // VISTA 2: CONVERSACIÓN ACTIVA
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a' }}> {/* Fondo Chat */}
                            
                            {/* Header Chat */}
                            <Box sx={{ p: 1.5, bgcolor: '#202c33', display: 'flex', alignItems: 'center', borderBottom: '1px solid #333' }}>
                                <IconButton onClick={() => setChatActivo(null)} sx={{ color: '#aebac1', mr: 1 }}>
                                    <ArrowBackIcon />
                                </IconButton>
                                <Avatar sx={{ bgcolor: '#00a884', width: 35, height: 35, mr: 2 }}>{chatActivo.username.charAt(0)}</Avatar>
                                <Box>
                                    <Typography color="#e9edef" variant="subtitle2">{chatActivo.first_name || chatActivo.username}</Typography>
                                    <Typography color="#8696a0" variant="caption">Residente</Typography>
                                </Box>
                            </Box>

                            {/* Área de Mensajes */}
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {mensajes.length === 0 && (
                                    <Typography align="center" sx={{ color: '#8696a0', mt: 4, fontSize: '0.9rem', bgcolor:'#1f2c34', p:1, borderRadius:2, alignSelf:'center' }}>
                                        🔒 Inicia la conversación con el vecino.
                                    </Typography>
                                )}
                                
                                {mensajes.map((msg, index) => (
                                    <Box 
                                        key={index} 
                                        sx={{ 
                                            alignSelf: msg.es_mio ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            mb: 0.5
                                        }}
                                    >
                                        <Paper sx={{ 
                                            p: 1, px: 1.5, 
                                            bgcolor: msg.es_mio ? '#005c4b' : '#202c33', // Verde para mí (Guardia), Gris para vecino
                                            color: '#e9edef',
                                            borderRadius: 2,
                                            borderTopRightRadius: msg.es_mio ? 0 : 2,
                                            borderTopLeftRadius: msg.es_mio ? 2 : 0
                                        }}>
                                            <Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{msg.mensaje}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.6, fontSize: '0.65rem', mt: 0.5 }}>
                                                {new Date(msg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                ))}
                                <div ref={chatBottomRef} />
                            </Box>

                            {/* Input Area */}
                            <Box sx={{ p: 1.5, bgcolor: '#202c33', display: 'flex', alignItems: 'center' }}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    placeholder="Escribe un mensaje..." 
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                                    InputProps={{
                                        style: { color: 'white', backgroundColor: '#2a3942', borderRadius: 8 }
                                    }}
                                    sx={{ mr: 1 }}
                                />
                                <IconButton sx={{ bgcolor: '#00a884', color: 'white', '&:hover': { bgcolor: '#008f6f' } }} onClick={enviarMensaje}>
                                    <SendIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Caseta;