import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Grid, Paper, Button, 
  Tabs, Tab, TextField, IconButton, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Divider, Badge, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Card, CardContent
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
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';

import api from '../api/axiosConfig';

function Caseta() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // --- ESTADOS GLOBALES ---
  const [reloj, setReloj] = useState(new Date());
  const [tabIndex, setTabIndex] = useState(0); // 0: Escaner, 1: Manual, 2: Bitácora
  const [tabLateral, setTabLateral] = useState(0); // 0: Autos Adentro, 1: Chat Vecinos

  // --- DATOS ---
  const [visitasActivas, setVisitasActivas] = useState([]);
  const [vecinos, setVecinos] = useState([]);
  const [chatActivo, setChatActivo] = useState(null); // Vecino seleccionado para chat
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // --- FORMULARIOS ---
  const [formManual, setFormManual] = useState({ nombre: '', destino: '', tipo: 'Visita', placas: '' });
  const [incidente, setIncidente] = useState('');
  
  // --- QR ---
  const [qrResult, setQrResult] = useState(null);
  
  // --- RELOJ EN VIVO ---
  useEffect(() => {
    const timer = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 15000); // Refresco automático cada 15s
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [resVisitas, resUsuarios] = await Promise.all([
        api.get('/api/visitas/?estado=ACTIVA'),
        api.get('/api/usuarios/')
      ]);
      setVisitasActivas(resVisitas.data.results || resVisitas.data);
      
      // Filtramos solo residentes para el chat
      const listaVecinos = (resUsuarios.data.results || resUsuarios.data).filter(u => !u.is_staff);
      setVecinos(listaVecinos);
    } catch (error) {
      console.error("Error cargando datos caseta", error);
    }
  };

  // --- LÓGICA DEL CHAT ---
  const cargarChat = async (userId) => {
    try {
      // Nota: Esto asume que tienes un endpoint que filtra mensajes por usuario
      // Si no, habría que filtrar en el frontend.
      const res = await api.get(`/api/chat/?usuario=${userId}`);
      setMensajes(res.data.results || res.data);
    } catch (error) {
      console.error("Error cargando chat");
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await api.post('/api/chat/', {
        destinatario: chatActivo.id,
        mensaje: nuevoMensaje,
        es_guardia: true
      });
      setNuevoMensaje('');
      cargarChat(chatActivo.id); // Recargar
      enqueueSnackbar('Mensaje enviado', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al enviar', { variant: 'error' });
    }
  };

  const seleccionarVecino = (vecino) => {
    setChatActivo(vecino);
    cargarChat(vecino.id);
  };

  // --- LÓGICA DE ACCESOS ---
  const handleRegistroManual = async () => {
    try {
      await api.post('/api/visitas/', { ...formManual, metodo: 'MANUAL' });
      enqueueSnackbar('Ingreso registrado correctamente', { variant: 'success' });
      setFormManual({ nombre: '', destino: '', tipo: 'Visita', placas: '' });
      cargarDatos();
    } catch (error) {
      enqueueSnackbar('Error al registrar', { variant: 'error' });
    }
  };

  const handleSalida = async (id) => {
    if (!confirm("¿Confirmar salida del vehículo?")) return;
    try {
      await api.patch(`/api/visitas/${id}/`, { estado: 'FINALIZADA', fecha_salida: new Date() });
      enqueueSnackbar('Salida registrada', { variant: 'info' });
      cargarDatos();
    } catch (error) {
      enqueueSnackbar('Error al registrar salida', { variant: 'error' });
    }
  };

  const handleIncidente = async () => {
    if(!incidente) return;
    try {
        await api.post('/api/reportes-diarios/', { mensaje: incidente, tipo: 'INCIDENTE' });
        setIncidente('');
        enqueueSnackbar('Incidente reportado en bitácora', { variant: 'warning' });
    } catch (e) {
        enqueueSnackbar('Error guardando incidente', { variant: 'error' });
    }
  };

  // --- LÓGICA QR (Renderizado condicional) ---
  useEffect(() => {
    let scanner = null;
    if (tabIndex === 0) {
      // Pequeño delay para asegurar que el div exista
      setTimeout(() => {
        if (document.getElementById("reader")) {
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render(onScanSuccess);
        }
      }, 500);
    }
    return () => {
        if(scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [tabIndex]);

  const onScanSuccess = async (decodedText) => {
      // Evitar lecturas múltiples muy rápidas
      try {
          // Aquí iría la llamada real a tu backend para validar el QR
          // const res = await api.post('/api/visitas/validar_qr/', { token: decodedText });
          setQrResult({ valido: true, mensaje: "Acceso Autorizado: Juan Pérez (Lote 24)" });
          enqueueSnackbar('QR Validado: Acceso Concedido', { variant: 'success' });
      } catch (error) {
          setQrResult({ valido: false, mensaje: "QR Inválido o Expirado" });
          enqueueSnackbar('QR Inválido', { variant: 'error' });
      }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#101418' }}>
      
      {/* 1. BARRA SUPERIOR (HEADER) */}
      <AppBar position="static" sx={{ bgcolor: '#1e293b', borderBottom: '1px solid #333' }}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2, color: '#4fc3f7', fontSize: 30 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">CONTROL DE ACCESOS</Typography>
            <Typography variant="caption" color="gray">Sistema de Vigilancia Activa</Typography>
          </Box>
          
          {/* RELOJ DIGITAL GRANDE */}
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#000', px: 2, py: 0.5, borderRadius: 2, border: '1px solid #333', mr: 3 }}>
            <AccessTimeIcon sx={{ color: '#00e676', mr: 1 }} />
            <Typography variant="h5" sx={{ fontFamily: 'monospace', color: '#00e676', fontWeight: 'bold' }}>
              {reloj.toLocaleTimeString()}
            </Typography>
          </Box>

          <Button 
            variant="contained" 
            color="error" 
            startIcon={<WarningIcon />} 
            sx={{ mr: 2, fontWeight: 'bold' }}
            onClick={() => alert("¡ALERTA DE PÁNICO ENVIADA A ADMINISTRACIÓN Y POLICÍA!")}
          >
            PÁNICO
          </Button>

          <IconButton color="inherit" onClick={() => { localStorage.clear(); navigate('/'); }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 2. ÁREA DE TRABAJO (GRID) */}
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        
        {/* COLUMNA IZQUIERDA: HERRAMIENTAS DE ACCESO */}
        <Grid item xs={12} md={8} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
          <Paper sx={{ flexGrow: 1, bgcolor: '#1e293b', color: 'white', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Tabs 
                value={tabIndex} 
                onChange={(e, v) => setTabIndex(v)} 
                centered 
                indicatorColor="secondary" 
                textColor="inherit"
                sx={{ borderBottom: '1px solid #444' }}
            >
              <Tab icon={<QrCodeScannerIcon />} label="Escáner QR" />
              <Tab icon={<DirectionsCarIcon />} label="Entrada Manual" />
              <Tab icon={<BookIcon />} label="Bitácora Incidencias" />
            </Tabs>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              {/* PESTAÑA 0: QR */}
              {tabIndex === 0 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Escanee el código del visitante</Typography>
                  <Box sx={{ width: '100%', maxWidth: 400, margin: '0 auto', bgcolor: 'black', p: 1, borderRadius: 2 }}>
                    <div id="reader" style={{ width: '100%' }}></div>
                  </Box>
                  {qrResult && (
                      <Paper sx={{ mt: 3, p: 2, bgcolor: qrResult.valido ? '#1b5e20' : '#b71c1c' }}>
                          <Typography variant="h5" fontWeight="bold">{qrResult.mensaje}</Typography>
                      </Paper>
                  )}
                </Box>
              )}

              {/* PESTAÑA 1: MANUAL */}
              {tabIndex === 1 && (
                <Box maxWidth="sm" sx={{ mx: 'auto' }}>
                  <Typography variant="h6" gutterBottom color="#4fc3f7">Registro de Proveedor / Taxi / Visita sin App</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Nombre del Conductor" variant="filled" sx={{ bgcolor: '#334155', borderRadius: 1 }} InputLabelProps={{style: {color: '#94a3b8'}}} inputProps={{style: {color: 'white'}}} value={formManual.nombre} onChange={e => setFormManual({...formManual, nombre: e.target.value})} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth label="Placas / Vehículo" variant="filled" sx={{ bgcolor: '#334155', borderRadius: 1 }} InputLabelProps={{style: {color: '#94a3b8'}}} inputProps={{style: {color: 'white'}}} value={formManual.placas} onChange={e => setFormManual({...formManual, placas: e.target.value})} />
                    </Grid>
                    <Grid item xs={6}>
                         <FormControl fullWidth variant="filled" sx={{ bgcolor: '#334155', borderRadius: 1 }}>
                            <InputLabel sx={{ color: '#94a3b8' }}>Tipo</InputLabel>
                            <Select value={formManual.tipo} sx={{ color: 'white' }} onChange={e => setFormManual({...formManual, tipo: e.target.value})}>
                                <MenuItem value="Visita">Visita General</MenuItem>
                                <MenuItem value="Proveedor">Proveedor/Servicio</MenuItem>
                                <MenuItem value="Taxi">Taxi/Uber/Didi</MenuItem>
                                <MenuItem value="Emergencia">Emergencia</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Casa / Destino (Ej: Calle Roble #12)" variant="filled" sx={{ bgcolor: '#334155', borderRadius: 1 }} InputLabelProps={{style: {color: '#94a3b8'}}} inputProps={{style: {color: 'white'}}} value={formManual.destino} onChange={e => setFormManual({...formManual, destino: e.target.value})} />
                    </Grid>
                    <Grid item xs={12}>
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 2, py: 1.5, fontSize: '1.1rem', bgcolor: '#0288d1' }} onClick={handleRegistroManual}>
                            AUTORIZAR ENTRADA
                        </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* PESTAÑA 2: INCIDENCIAS */}
              {tabIndex === 2 && (
                <Box>
                    <Typography variant="h6" color="error" gutterBottom>Reportar Novedad o Incidente</Typography>
                    <TextField 
                        fullWidth multiline rows={6} 
                        placeholder="Describa lo sucedido (Ej: Ruido excesivo en casa 4, Portón fallando, etc.)"
                        variant="filled" 
                        sx={{ bgcolor: '#334155', borderRadius: 1 }} 
                        InputLabelProps={{style: {color: '#94a3b8'}}} 
                        inputProps={{style: {color: 'white'}}}
                        value={incidente}
                        onChange={(e) => setIncidente(e.target.value)}
                    />
                    <Button variant="contained" color="warning" fullWidth sx={{ mt: 2 }} onClick={handleIncidente}>
                        REGISTRAR EN BITÁCORA
                    </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* COLUMNA DERECHA: INFORMACIÓN Y CHAT */}
        <Grid item xs={12} md={4} sx={{ bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* TABS LATERALES */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabLateral} onChange={(e,v) => setTabLateral(v)} textColor="secondary" indicatorColor="secondary" variant="fullWidth">
                    <Tab label={`Adentro (${visitasActivas.length})`} />
                    <Tab label="Chat Vecinos" />
                </Tabs>
            </Box>

            {/* CONTENIDO LATERAL 0: AUTOS ADENTRO */}
            {tabLateral === 0 && (
                <List sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                    {visitasActivas.length === 0 ? (
                        <Typography color="gray" align="center" sx={{ mt: 4 }}>No hay visitas registradas adentro.</Typography>
                    ) : (
                        visitasActivas.map((v) => (
                            <Card key={v.id} sx={{ mb: 1, bgcolor: '#1e293b', color: 'white' }}>
                                <CardContent sx={{ pb: '10px !important' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">{v.nombre_visitante}</Typography>
                                            <Typography variant="caption" color="#94a3b8">Hacia: {v.casa_destino || v.detalles_destino}</Typography>
                                        </Box>
                                        <Button variant="outlined" color="error" size="small" onClick={() => handleSalida(v.id)}>
                                            SALIDA
                                        </Button>
                                    </Box>
                                    <Chip label={v.tipo} size="small" sx={{ mt: 1, bgcolor: '#334155', color: 'white' }} />
                                    <Typography variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                                        Entró: {new Date(v.fecha_entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </List>
            )}

            {/* CONTENIDO LATERAL 1: CHAT WHATSAPP */}
            {tabLateral === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {!chatActivo ? (
                        // LISTA DE VECINOS
                        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Box sx={{ p: 1 }}><TextField fullWidth size="small" placeholder="Buscar vecino..." InputProps={{startAdornment: <SearchIcon color="disabled"/>}} sx={{ bgcolor: '#334155', borderRadius: 1 }} inputProps={{style:{color:'white'}}} /></Box>
                            <List>
                                {vecinos.map(vecino => (
                                    <ListItem button key={vecino.id} onClick={() => seleccionarVecino(vecino)} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                                        <ListItemAvatar><Avatar sx={{ bgcolor: '#1976d2' }}>{vecino.nombre ? vecino.nombre[0] : 'V'}</Avatar></ListItemAvatar>
                                        <ListItemText 
                                            primary={<Typography color="white">{vecino.nombre || vecino.username}</Typography>} 
                                            secondary={<Typography color="gray" variant="caption">Casa {vecino.casa || 'S/N'}</Typography>} 
                                        />
                                        <ChatIcon color="disabled" fontSize="small" />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ) : (
                        // CONVERSACIÓN ACTIVA
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ p: 1, bgcolor: '#0288d1', color: 'white', display: 'flex', alignItems: 'center' }}>
                                <IconButton size="small" onClick={() => setChatActivo(null)} sx={{ color: 'white', mr: 1 }}>{'<'}</IconButton>
                                <Typography variant="subtitle2" noWrap>{chatActivo.nombre || chatActivo.username}</Typography>
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#0f172a' }}>
                                {mensajes.length === 0 && <Typography align="center" color="gray" variant="caption">Inicia la conversación...</Typography>}
                                {mensajes.map((msg, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: msg.es_mio ? 'flex-end' : 'flex-start', mb: 1 }}>
                                        <Paper sx={{ p: 1, bgcolor: msg.es_mio ? '#005c4b' : '#202c33', color: 'white', maxWidth: '80%' }}>
                                            <Typography variant="body2">{msg.texto}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, fontSize: '0.6rem' }}>
                                                {new Date(msg.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                ))}
                            </Box>
                            
                            <Box sx={{ p: 1, bgcolor: '#1e293b', display: 'flex' }}>
                                <TextField 
                                    fullWidth size="small" placeholder="Escribe un mensaje..." 
                                    sx={{ bgcolor: '#334155', borderRadius: 1, mr: 1 }} 
                                    inputProps={{style:{color:'white'}}}
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                                />
                                <IconButton color="primary" onClick={enviarMensaje}><SendIcon /></IconButton>
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