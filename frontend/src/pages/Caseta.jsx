import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Button, TextField, AppBar, Toolbar, 
  Alert, Tabs, Tab, List, ListItem, ListItemText, Paper, Grid, 
  Avatar
} from '@mui/material';

// Iconos
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BookIcon from '@mui/icons-material/Book';
import SecurityIcon from '@mui/icons-material/Security';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; 
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

// 1. IMPORTACIÓN CENTRALIZADA (Vital para Railway)
import api from '../api/axiosConfig';
import Footer from '../components/Footer';

function Caseta() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [mensaje, setMensaje] = useState(null);
  const [errorScan, setErrorScan] = useState(null);
  
  // 2. DEFINIR URL BASE PARA LAS IMÁGENES (Nube vs Local)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  // Datos "Quién está adentro"
  const [genteAdentro, setGenteAdentro] = useState({ trabajadores: [], visitas: [] });
  
  // Proveedor Manual
  const [formProv, setFormProv] = useState({ nombre: '', empresa: '', placas: '' });

  // Bitácora
  const [nuevaNota, setNuevaNota] = useState("");
  const [fechaBitacora, setFechaBitacora] = useState(new Date().toISOString().slice(0, 16));
  const [archivoBitacora, setArchivoBitacora] = useState(null);
  const [loadingSubida, setLoadingSubida] = useState(false);

  // Auto-refresh lista de gente adentro cada 10 seg
  useEffect(() => {
      cargarGenteAdentro();
      const interval = setInterval(cargarGenteAdentro, 10000);
      return () => clearInterval(interval);
  }, []);

  const cargarGenteAdentro = async () => {
      const token = localStorage.getItem('token');
      try {
          // 3. USAR 'api.get' y RUTA RELATIVA
          const res = await api.get('/api/visitas/activos/', { headers: { Authorization: `Token ${token}` } });
          setGenteAdentro(res.data);
      } catch(e) { console.error(e); }
  };

  // --- ESCÁNER ---
  useEffect(() => {
    if(tabIndex === 0) {
        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
        scanner.render(onScanSuccess, (err)=>{});
        return () => scanner.clear().catch(e=>console.error(e));
    }
  }, [tabIndex]);

  const onScanSuccess = async (decodedText) => {
      try {
          const token = localStorage.getItem('token');
          // 4. PETICIÓN POST INTELIGENTE
          const res = await api.post(`/api/visitas/validar_qr/`, { qr: decodedText }, { headers: { Authorization: `Token ${token}` } });
          
          const { status, nombre, tipo, casa, foto } = res.data;
          
          setMensaje({ texto: `${status}: ${nombre} (${tipo}) ${casa ? '- Casa ' + casa : ''}`, foto: foto });
          
          setErrorScan(null);
          cargarGenteAdentro(); 
          
          setTimeout(()=>setMensaje(null), 5000);
      } catch(e) { 
          setErrorScan(e.response?.data?.error || "Error al leer QR");
          setMensaje(null);
          setTimeout(()=>setErrorScan(null), 4000);
      }
  };

  // --- REGISTRO MANUAL PROVEEDOR ---
  const registrarProveedor = async () => {
      if(!formProv.nombre || !formProv.empresa) return alert("Datos incompletos");
      const token = localStorage.getItem('token');
      try {
          await api.post('/api/visitas/', {
              nombre_visitante: formProv.nombre,
              empresa: formProv.empresa,
              placas: formProv.placas,
              fecha_llegada: new Date(),
              tipo: 'PROVEEDOR',
              estado: 'INGRESO' 
          }, { headers: { Authorization: `Token ${token}` } });
          alert("Proveedor registrado");
          setFormProv({nombre:'', empresa:'', placas:''});
          cargarGenteAdentro();
      } catch(e) { alert("Error al registrar proveedor"); }
  };

  // --- BITÁCORA ---
  const guardarNota = async () => {
      if(!nuevaNota) return alert("Escribe un mensaje");
      setLoadingSubida(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('mensaje', nuevaNota);
      formData.append('fecha', fechaBitacora);
      if (archivoBitacora) formData.append('media', archivoBitacora);

      try {
          await api.post('/api/bitacora/', formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
          alert("Reporte guardado");
          setNuevaNota(""); setArchivoBitacora(null);
      } catch(e) { alert("Error"); }
      setLoadingSubida(false);
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display:'flex', flexDirection:'column', bgcolor: '#eceff1' }}>
      <AppBar position="static" sx={{ bgcolor: '#263238' }}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>CONTROL DE ACCESOS</Typography>
          <Button color="inherit" onClick={()=>{localStorage.clear(); navigate('/');}}>Salir</Button>
        </Toolbar>
      </AppBar>

      <Grid container sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }} spacing={2}>
          
          {/* --- COLUMNA IZQUIERDA --- */}
          <Grid item xs={12} md={8} sx={{height: '100%'}}>
              <Paper elevation={3} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Tabs value={tabIndex} onChange={(e,v)=>setTabIndex(v)} centered variant="fullWidth" sx={{bgcolor: 'white', borderBottom: 1, borderColor: 'divider'}}>
                      <Tab icon={<QrCodeScannerIcon/>} label="Escáner QR" />
                      <Tab icon={<LocalShippingIcon/>} label="Proveedor Manual" />
                      <Tab icon={<BookIcon/>} label="Bitácora" />
                  </Tabs>

                  <Box p={3} sx={{flexGrow: 1, overflow: 'auto'}}>
                      {/* 0. ESCÁNER */}
                      {tabIndex === 0 && (
                          <Box textAlign="center">
                              {mensaje && (
                                  <Alert severity="success" sx={{mb:2, fontSize:'1.2rem', alignItems: 'center'}}>
                                      {/* 5. USO DE BASE_URL PARA FOTOS ESCANEADAS */}
                                      {mensaje.foto && <Avatar src={`${BASE_URL}${mensaje.foto}`} sx={{width: 60, height: 60, mr: 2, display:'inline-block', verticalAlign:'middle'}}/>}
                                      {mensaje.texto}
                                  </Alert>
                              )}
                              {errorScan && <Alert severity="error" sx={{mb:2}}>{errorScan}</Alert>}
                              
                              <div id="reader" style={{width: '100%', maxWidth: '500px', margin: '0 auto', borderRadius: '10px', overflow:'hidden'}}></div>
                              <Typography variant="body2" sx={{mt:2, color:'gray'}}>Apunta al código QR del Trabajador o Visitante</Typography>
                          </Box>
                      )}

                      {/* 1. PROVEEDOR MANUAL */}
                      {tabIndex === 1 && (
                          <Box maxWidth="sm" margin="auto">
                              <Typography variant="h6" gutterBottom color="primary"><LocalShippingIcon sx={{verticalAlign:'middle', mr:1}}/>Registro de Servicios</Typography>
                              <Typography variant="body2" paragraph color="textSecondary">Para CFE, Gas, Paquetería sin QR.</Typography>
                              <Grid container spacing={2}>
                                  <Grid item xs={12}><TextField fullWidth label="Nombre Chofer / Técnico" value={formProv.nombre} onChange={(e)=>setFormProv({...formProv, nombre:e.target.value})} /></Grid>
                                  <Grid item xs={6}><TextField fullWidth label="Empresa" value={formProv.empresa} onChange={(e)=>setFormProv({...formProv, empresa:e.target.value})} /></Grid>
                                  <Grid item xs={6}><TextField fullWidth label="Placas Vehículo" value={formProv.placas} onChange={(e)=>setFormProv({...formProv, placas:e.target.value})} /></Grid>
                                  <Grid item xs={12}><Button fullWidth variant="contained" size="large" onClick={registrarProveedor}>Registrar Entrada</Button></Grid>
                              </Grid>
                          </Box>
                      )}

                      {/* 2. BITÁCORA */}
                      {tabIndex === 2 && (
                          <Box maxWidth="sm" margin="auto">
                              <Typography variant="h6" gutterBottom color="error"><NoteAddIcon sx={{verticalAlign:'middle', mr:1}}/>Reporte de Incidente</Typography>
                              <TextField fullWidth type="datetime-local" label="Fecha Hora" value={fechaBitacora} onChange={(e)=>setFechaBitacora(e.target.value)} sx={{mb:2}} InputLabelProps={{shrink:true}} />
                              <TextField fullWidth multiline rows={3} label="Descripción del suceso" value={nuevaNota} onChange={(e)=>setNuevaNota(e.target.value)} sx={{mb:2}} />
                              
                              <Button variant="outlined" component="label" fullWidth startIcon={<AttachFileIcon/>} sx={{mb:2}}>
                                  {archivoBitacora ? archivoBitacora.name : "Adjuntar Foto/Video"}
                                  <input type="file" hidden accept="image/*,video/*" onChange={(e)=>setArchivoBitacora(e.target.files[0])} />
                              </Button>

                              <Button variant="contained" color="error" fullWidth size="large" onClick={guardarNota} disabled={loadingSubida}>
                                  {loadingSubida ? "Guardando..." : "Registrar en Bitácora"}
                              </Button>
                          </Box>
                      )}
                  </Box>
              </Paper>
          </Grid>

          {/* --- COLUMNA DERECHA --- */}
          <Grid item xs={12} md={4} sx={{height: '100%'}}>
              <Paper elevation={3} sx={{ height: '100%', borderRadius: 2, bgcolor: '#37474f', color: 'white', display:'flex', flexDirection:'column' }}>
                  <Box p={2} borderBottom={1} borderColor="rgba(255,255,255,0.1)" sx={{bgcolor: '#263238'}}>
                      <Typography variant="h6" sx={{display:'flex', alignItems:'center', fontWeight:'bold', letterSpacing:1}}>
                          <PeopleIcon sx={{mr:1}}/> DENTRO DEL FRACC.
                      </Typography>
                  </Box>
                  
                  <Box sx={{flexGrow: 1, overflow: 'auto', p: 2}}>
                      {/* TRABAJADORES */}
                      <Typography variant="subtitle2" sx={{color:'#81d4fa', mb:1, mt:1, fontWeight:'bold', borderBottom:'1px solid #81d4fa'}}>
                          👷 EMPLEADOS ({genteAdentro.trabajadores.length})
                      </Typography>
                      <List dense>
                          {genteAdentro.trabajadores.map(t => (
                              <ListItem key={t.id} sx={{bgcolor:'rgba(255,255,255,0.1)', mb:1, borderRadius:1}}>
                                  {/* 6. USO DE BASE_URL PARA FOTOS DE LISTA */}
                                  <Avatar src={t.foto ? `${BASE_URL}${t.foto}` : null} sx={{width:40, height:40, mr:2}}/>
                                  <ListItemText 
                                      primary={<Typography variant="body1" fontWeight="bold">{t.nombre}</Typography>} 
                                      secondary={<span style={{color:'#cfd8dc'}}>🏠 Casa {t.casa}</span>} 
                                  />
                                  <AccessTimeIcon sx={{color:'lightgreen', fontSize: 18}}/>
                              </ListItem>
                          ))}
                          {genteAdentro.trabajadores.length === 0 && <Typography variant="caption" color="gray">Ninguno</Typography>}
                      </List>

                      {/* VISITANTES / PROVEEDORES */}
                      <Typography variant="subtitle2" sx={{color:'#ffcc80', mb:1, mt:3, fontWeight:'bold', borderBottom:'1px solid #ffcc80'}}>
                          🚚 VISITAS / PROVEEDORES ({genteAdentro.visitas.length})
                      </Typography>
                      <List dense>
                          {genteAdentro.visitas.map(v => (
                              <ListItem key={v.id} sx={{bgcolor:'rgba(255,255,255,0.1)', mb:1, borderRadius:1}}>
                                  <ListItemText 
                                      primary={<Typography variant="body1">{v.nombre_visitante}</Typography>} 
                                      secondary={
                                          <span style={{color:'#cfd8dc'}}>
                                              {v.tipo === 'PROVEEDOR' ? `🏢 ${v.empresa}` : `🏠 Visita Casa...`}
                                          </span>
                                      } 
                                  />
                                  {v.tipo === 'PROVEEDOR' && <LocalShippingIcon sx={{color:'orange', fontSize: 18}}/>}
                              </ListItem>
                          ))}
                          {genteAdentro.visitas.length === 0 && <Typography variant="caption" color="gray">Ninguno</Typography>}
                      </List>
                  </Box>
              </Paper>
          </Grid>

      </Grid>
      <Footer />
    </Box>
  );
}

export default Caseta;