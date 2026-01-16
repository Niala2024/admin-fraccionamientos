import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, AppBar, Toolbar, 
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, List, 
  ListItem, ListItemText, Divider, IconButton, Avatar, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';

// --- ICONOS ---
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import ForumIcon from '@mui/icons-material/Forum'; 
import BadgeIcon from '@mui/icons-material/Badge'; 
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home'; 
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import HelpIcon from '@mui/icons-material/Help';             

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from "react-qr-code"; 
import Footer from '../components/Footer';

function Dashboard() {
  const navigate = useNavigate();
  
  // Datos Generales
  const [casa, setCasa] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [aviso, setAviso] = useState(null);
  
  // Estados de Modales
  const [openPago, setOpenPago] = useState(false);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openEmpleados, setOpenEmpleados] = useState(false); 
  
  // Formularios
  const [formPago, setFormPago] = useState({ monto: '', fecha: '' });
  const [comprobante, setComprobante] = useState(null);

  // Datos Empleados
  const [listaEmpleados, setListaEmpleados] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', telefono: '', direccion: '' });
  const [fotoEmp, setFotoEmp] = useState(null);
  const [imprimirGafete, setImprimirGafete] = useState(null);

  // --- LÓGICA WHATSAPP ---
  const abrirWhatsApp = (telefono, nombre) => {
      if(!telefono) return alert("Sin número registrado");
      let num = telefono.replace(/\D/g, '');
      if(num.length === 10) num = `52${num}`;
      const msg = `Hola ${nombre}, soy tu patrón del fraccionamiento.`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const userLocalStr = localStorage.getItem('user_data'); 
    
    if (!token) { navigate('/'); return; }

    try {
      const usuarioLocal = JSON.parse(userLocalStr || '{}');

      // 1. Usuario
      if (usuarioLocal.id) {
          const resUser = await axios.get(`http://127.0.0.1:8000/api/usuarios/${usuarioLocal.id}/`, { headers: { Authorization: `Token ${token}` } });
          setUserData(resUser.data);
      } else { setUserData(usuarioLocal); }

      // 2. Casa
      const resCasas = await axios.get('http://127.0.0.1:8000/api/casas/', { headers: { Authorization: `Token ${token}` } });
      if (Array.isArray(resCasas.data)) {
          const miCasa = resCasas.data.find(c => c.propietario === usuarioLocal.username) || resCasas.data[0]; 
          setCasa(miCasa);

          // 3. Pagos Historial
          if(miCasa) {
              const resPagos = await axios.get(`http://127.0.0.1:8000/api/pagos/?casa=${miCasa.id}`, { headers: { Authorization: `Token ${token}` } });
              if(Array.isArray(resPagos.data)) setPagos(resPagos.data);
          }
      }

      // 4. Avisos
      try {
          const resAviso = await axios.get('http://127.0.0.1:8000/api/avisos/ultimo/', { headers: { Authorization: `Token ${token}` } });
          if (resAviso.data && resAviso.data.titulo) setAviso(resAviso.data);
      } catch(e) { console.log("Sin avisos"); }

    } catch (e) { 
        console.error("Error cargando dashboard:", e);
        if(e.response?.status === 401) navigate('/'); 
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- LÓGICA PAGOS ---
  const handleSubirPago = async () => {
      if(!formPago.monto || !comprobante) return alert("Ingresa monto y comprobante");
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('monto', formPago.monto);
      formData.append('comprobante', comprobante);
      if(casa) formData.append('casa', casa.id); 
      
      try {
          await axios.post('http://127.0.0.1:8000/api/pagos/', formData, {
              headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          alert("Pago enviado a revisión");
          setOpenPago(false);
          setFormPago({monto:'', fecha:''}); setComprobante(null);
          cargarDatos(); 
      } catch(e) { alert("Error al subir pago"); }
  };

  // --- LÓGICA EMPLEADOS ---
  const cargarEmpleados = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await axios.get('http://127.0.0.1:8000/api/trabajadores/', { headers: { Authorization: `Token ${token}` } });
          if(Array.isArray(res.data)) setListaEmpleados(res.data);
      } catch(e) { console.error(e); }
  };
  const handleCrearEmpleado = async () => {
      if(!formEmp.nombre) return alert("Nombre requerido");
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nombre_completo', formEmp.nombre);
      formData.append('telefono', formEmp.telefono);
      formData.append('direccion', formEmp.direccion);
      if(fotoEmp) formData.append('foto', fotoEmp);
      try {
          await axios.post('http://127.0.0.1:8000/api/trabajadores/', formData, { 
              headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } 
          });
          alert("Empleado registrado"); setFormEmp({nombre:'', telefono:'', direccion:''}); setFotoEmp(null); cargarEmpleados();
      } catch(e) { alert("Error al registrar"); }
  };
  const handleBorrarEmpleado = async (id) => {
      if(!confirm("¿Eliminar trabajador?")) return;
      const token = localStorage.getItem('token');
      try { await axios.delete(`http://127.0.0.1:8000/api/trabajadores/${id}/`, { headers: { Authorization: `Token ${token}` } }); cargarEmpleados(); } catch(e) { alert("Error"); }
  };

  // Impresión
  const handlePrint = () => {
      const printContent = document.getElementById('gafete-print');
      const win = window.open('', '', 'height=600,width=500');
      win.document.write('<html><head><title>Gafete</title></head><body>');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
  };
  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>Panel Residente</Typography>
          
          {/* BOTONES DE NAVEGACIÓN */}
          <Button color="inherit" startIcon={<AddCircleIcon />} onClick={()=>navigate('/visitas')}>Visitas</Button>
          <Button color="inherit" startIcon={<ForumIcon />} onClick={()=>navigate('/comunidad')}>Comunidad</Button>
          <Button color="inherit" startIcon={<BadgeIcon />} onClick={()=>{setOpenEmpleados(true); cargarEmpleados();}}>Empleados</Button> 
          <Button color="inherit" startIcon={<StorefrontIcon />} onClick={()=>navigate('/directorio')}>Directorio</Button>
          <Button color="inherit" startIcon={<HelpIcon />} onClick={()=>navigate('/ayuda')}>Ayuda</Button>
          
          <Box sx={{ flexGrow: 1 }} /> 

          {/* ✅ BOTÓN DE PERFIL (Ahora redirige a /mi-perfil) */}
          <IconButton onClick={() => navigate('/mi-perfil')} sx={{ ml: 1, p: 0, border: '2px solid white' }} title="Ir a Mi Perfil">
            <Avatar src={userData?.avatar} sx={{ width: 40, height: 40 }}>{userData?.username?.[0]}</Avatar>
          </IconButton>
          
          <IconButton color="inherit" onClick={handleLogout} sx={{ml:1}} title="Salir"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, flexGrow: 1 }}>
          <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">Estado de Cuenta</Typography>
          <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                  <Card elevation={3} sx={{borderLeft: '6px solid #2e7d32'}}>
                      <CardContent>
                          <Typography variant="h6" display="flex" alignItems="center" gutterBottom>
                              <HomeIcon sx={{mr:1, color:'#555'}}/> Lote {casa ? casa.numero_exterior : '...'}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">Saldo Pendiente:</Typography>
                          <Typography variant="h4" color={casa?.saldo_pendiente > 0 ? 'error' : 'success'} fontWeight="bold" sx={{my:1}}>
                              ${casa ? casa.saldo_pendiente : '0.00'}
                          </Typography>
                          <Box sx={{display:'flex', gap:1, mt:2}}>
                              <Button variant="outlined" startIcon={<HistoryIcon/>} onClick={()=>setOpenHistorial(true)}>Historial</Button>
                              <Button variant="contained" startIcon={<AttachMoneyIcon/>} onClick={()=>setOpenPago(true)}>Pagar</Button>
                          </Box>
                      </CardContent>
                  </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                  <Paper sx={{p:3, bgcolor:'#e3f2fd', borderLeft: '6px solid #1976d2'}}>
                    {aviso ? (
                        <>
                            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">📢 {aviso.titulo}</Typography>
                            <Typography variant="body1" sx={{whiteSpace:'pre-line'}}>{aviso.mensaje}</Typography>
                            <Typography variant="caption" display="block" sx={{mt:2, color:'gray'}}>Publicado el: {new Date(aviso.fecha_creacion).toLocaleDateString()}</Typography>
                        </>
                    ) : (
                        <><Typography variant="h6" color="primary">👋 ¡Hola Vecino!</Typography><Typography>No hay avisos nuevos por el momento.</Typography></>
                    )}
                  </Paper>
              </Grid>
          </Grid>
      </Container>

      {/* --- MODAL DE PAGO --- */}
      <Dialog open={openPago} onClose={()=>setOpenPago(false)}>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogContent>
              <Typography variant="body2" sx={{mb:2}}>Sube tu comprobante de transferencia para que el administrador lo valide.</Typography>
              <TextField fullWidth label="Monto Pagado" type="number" value={formPago.monto} onChange={(e)=>setFormPago({...formPago, monto:e.target.value})} sx={{mb:2}} />
              <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
                  {comprobante ? comprobante.name : "Subir Comprobante (Imagen)"}
                  <input type="file" hidden accept="image/*" onChange={(e)=>setComprobante(e.target.files[0])} />
              </Button>
          </DialogContent>
          <DialogActions>
              <Button onClick={()=>setOpenPago(false)}>Cancelar</Button>
              <Button onClick={handleSubirPago} variant="contained" color="success">Enviar</Button>
          </DialogActions>
      </Dialog>

      {/* --- MODAL HISTORIAL --- */}
      <Dialog open={openHistorial} onClose={()=>setOpenHistorial(false)} fullWidth maxWidth="md">
          <DialogTitle>Historial de Pagos</DialogTitle>
          <DialogContent>
              <TableContainer component={Paper}>
                  <Table size="small">
                      <TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Fecha</TableCell><TableCell>Monto</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
                      <TableBody>
                          {pagos.map((p) => (
                              <TableRow key={p.id}>
                                  <TableCell>{new Date(p.fecha_pago).toLocaleDateString()}</TableCell>
                                  <TableCell>${p.monto}</TableCell>
                                  <TableCell>
                                      <Chip label={p.estado} color={p.estado==='APROBADO'?'success':p.estado==='PENDIENTE'?'warning':'error'} size="small" />
                                  </TableCell>
                              </TableRow>
                          ))}
                          {pagos.length === 0 && <TableRow><TableCell colSpan={3} align="center">No hay pagos registrados</TableCell></TableRow>}
                      </TableBody>
                  </Table>
              </TableContainer>
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenHistorial(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* --- MODAL EMPLEADOS --- */}
      <Dialog open={openEmpleados} onClose={()=>setOpenEmpleados(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{bgcolor: '#1976d2', color: 'white'}}>Mis Empleados</DialogTitle>
          <DialogContent>
              <Grid container spacing={3} sx={{mt:1}}>
                  <Grid item xs={12} md={5}>
                      <Paper variant="outlined" sx={{p:2}}>
                          <Typography variant="subtitle1">Registrar Nuevo</Typography>
                          <TextField fullWidth size="small" label="Nombre" value={formEmp.nombre} onChange={(e)=>setFormEmp({...formEmp, nombre:e.target.value})} sx={{mb:2}} />
                          <TextField fullWidth size="small" label="Teléfono" value={formEmp.telefono} onChange={(e)=>setFormEmp({...formEmp, telefono:e.target.value})} sx={{mb:2}} />
                          <TextField fullWidth size="small" multiline rows={2} label="Dirección" value={formEmp.direccion} onChange={(e)=>setFormEmp({...formEmp, direccion:e.target.value})} sx={{mb:2}} />
                          <Button variant="outlined" component="label" fullWidth startIcon={<PhotoCamera/>} sx={{mb:2}}>Foto (Opcional)<input type="file" hidden accept="image/*" onChange={(e)=>setFotoEmp(e.target.files[0])} /></Button>
                          <Button variant="contained" fullWidth onClick={handleCrearEmpleado}>Guardar</Button>
                      </Paper>
                  </Grid>
                  <Grid item xs={12} md={7}>
                      <Typography variant="subtitle1">Activos</Typography>
                      <List>{listaEmpleados.map(emp => (
                          <React.Fragment key={emp.id}>
                              <ListItem secondaryAction={
                                  <Box>
                                      <IconButton color="success" onClick={() => abrirWhatsApp(emp.telefono, emp.nombre_completo)}>
                                          <WhatsAppIcon />
                                      </IconButton>
                                      <IconButton edge="end" color="error" onClick={()=>handleBorrarEmpleado(emp.id)}>
                                          <DeleteIcon/>
                                      </IconButton>
                                  </Box>
                              }>
                                  <Avatar src={emp.foto} sx={{mr:2}}>{emp.nombre_completo[0]}</Avatar>
                                  <ListItemText primary={emp.nombre_completo} secondary={<Button size="small" startIcon={<PrintIcon/>} onClick={()=>setImprimirGafete(emp)}>Gafete</Button>} />
                              </ListItem>
                              <Divider />
                          </React.Fragment>
                      ))}</List>
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenEmpleados(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* --- MODAL GAFETE --- */}
      <Dialog open={!!imprimirGafete} onClose={()=>setImprimirGafete(null)}>
          <DialogContent>
              <div id="gafete-print" style={{textAlign:'center', border:'2px solid #000', padding:'20px', borderRadius:'10px', width: '300px', margin:'auto'}}>
                  <h2 style={{color: '#1976d2'}}>PASE DE ACCESO</h2>
                  <p>PERSONAL DE SERVICIO</p>
                  <hr/>
                  {imprimirGafete && (
                      <>
                          <Box display="flex" justifyContent="center" mb={2}>
                            {imprimirGafete.foto ? (
                                <img 
                                    src={imprimirGafete.foto} 
                                    alt="Foto"
                                    style={{width:'100px', height:'100px', borderRadius:'50%', objectFit: 'cover'}} 
                                />
                            ) : (
                                <Box 
                                    sx={{width:100, height:100, bgcolor:'#eee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', mx:'auto'}}
                                >
                                    <Typography variant="caption">Sin Foto</Typography>
                                </Box>
                            )}
                          </Box>
                          <h3>{imprimirGafete.nombre_completo}</h3>
                          <div style={{background:'white', padding:'10px', display:'inline-block'}}>
                            <QRCode value={`WORKER-${imprimirGafete.id}`} size={160} />
                          </div>
                          <p><b>Casa {casa ? casa.numero_exterior : '?'}</b></p>
                      </>
                  )}
              </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePrint} startIcon={<PrintIcon/>} variant="contained">Imprimir</Button>
            <Button onClick={()=>setImprimirGafete(null)}>Cerrar</Button>
          </DialogActions>
      </Dialog>
      <Footer />
    </Box>
  );
}

export default Dashboard;