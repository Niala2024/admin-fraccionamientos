import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, AppBar, Toolbar, Card, CardContent, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, 
  FormControl, Tab, Tabs, Alert, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; 
import { useSnackbar } from 'notistack';      
import { Html5QrcodeScanner } from "html5-qrcode"; 

// Iconos
import SecurityIcon from '@mui/icons-material/Security';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email'; 
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AddHomeIcon from '@mui/icons-material/AddHome';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ForumIcon from '@mui/icons-material/Forum';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import EngineeringIcon from '@mui/icons-material/Engineering'; 
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import EditIcon from '@mui/icons-material/Edit';   
import DeleteIcon from '@mui/icons-material/Delete'; 
import GroupIcon from '@mui/icons-material/Group';   
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PolicyIcon from '@mui/icons-material/Policy'; 
import BuildIcon from '@mui/icons-material/Build'; 
import AssignmentIcon from '@mui/icons-material/Assignment'; 
import PrintIcon from '@mui/icons-material/Print'; 
import KeyIcon from '@mui/icons-material/Key'; 

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import Footer from '../components/Footer';

const CATEGORIAS_SERVICIOS = [
    'Plomero', 'Electricista', 'Albañil', 'Jardinero', 
    'Carpintero', 'Pintor', 'Cerrajería', 'Gas', 'Limpieza', 'Otros'
];

function AdminPanel() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar(); 
  
  // INICIALIZACIÓN
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [fraccSeleccionado, setFraccSeleccionado] = useState(''); 
  const [isSuperUser, setIsSuperUser] = useState(false);

  const [casas, setCasas] = useState([]); 
  const [calles, setCalles] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ deudaTotal: 0, casasConDeuda: 0, totalCasas: 0, quejasPendientes: 0 });

  // Modales
  const [openFracc, setOpenFracc] = useState(false);
  const [nombreNuevoFracc, setNombreNuevoFracc] = useState('');
  const [openCasa, setOpenCasa] = useState(false);
  const [openUsuario, setOpenUsuario] = useState(false);
  const [openDirectorio, setOpenDirectorio] = useState(false);
  const [openCalle, setOpenCalle] = useState(false);
  const [openImportar, setOpenImportar] = useState(false); 
  const [openCuota, setOpenCuota] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openScanner, setOpenScanner] = useState(false); 
  const [openServicios, setOpenServicios] = useState(false); 
  const [openNovedades, setOpenNovedades] = useState(false);
  
  const [openPassword, setOpenPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: null, username: '', newPassword: '' });

  const [fechaNovedades, setFechaNovedades] = useState(new Date().toISOString().split('T')[0]);
  const [listaNovedades, setListaNovedades] = useState([]);

  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  const [emailData, setEmailData] = useState({ para: '', nombre: '', asunto: '', mensaje: '' });
  const [nuevaCuota, setNuevaCuota] = useState('');
  const [archivoCSV, setArchivoCSV] = useState(null);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);

  const [tabDirectorio, setTabDirectorio] = useState(0); 
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  const [listaServicios, setListaServicios] = useState([]); 

  const [tipoUsuario, setTipoUsuario] = useState('residente');
  const [nombreCalle, setNombreCalle] = useState('');
  
  const [formCasa, setFormCasa] = useState({ calle_id: '', numero: '', saldo: 0 });
  const [formUser, setFormUser] = useState({ id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState(''); 
  const [formServicio, setFormServicio] = useState({ categoria: '', nombre: '', telefono: '', descripcion: '' });

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const userLocalStr = localStorage.getItem('user_data');
    if (!token) { navigate('/'); return; }
    
    try {
      const userData = JSON.parse(userLocalStr || '{}');
      setIsSuperUser(userData.is_superuser === true); 

      const headers = { 'Authorization': `Token ${token}` };
      const resFracc = await api.get('/api/fraccionamientos/', { headers });
      const listaFracc = resFracc.data.results || resFracc.data;
      setFraccionamientos(Array.isArray(listaFracc) ? listaFracc : []);
      
      if (!fraccSeleccionado && listaFracc.length > 0) {
          setFraccSeleccionado(userData.fraccionamiento_id || listaFracc[0].id);
      }

      const [resCasas, resCalles, resUsers, resQuejas] = await Promise.all([
          api.get('/api/casas/', { headers }),
          api.get('/api/calles/', { headers }),
          api.get('/api/usuarios/', { headers }),
          api.get('/api/quejas/', { headers })
      ]);
      
      const dataCasas = resCasas.data.results || resCasas.data;
      setCasas(Array.isArray(dataCasas) ? dataCasas : []);
      setCalles(resCalles.data.results || resCalles.data);
      setUsuarios(resUsers.data.results || resUsers.data);
      
      const qPendientes = (resQuejas.data.results || resQuejas.data).filter(q => q.estatus === 'PENDIENTE').length;
      const casasFiltradasCalc = dataCasas.filter(c => !fraccSeleccionado || c.fraccionamiento === fraccSeleccionado);
      const deuda = casasFiltradasCalc.reduce((acc, c) => acc + parseFloat(c.saldo_pendiente || 0), 0);
      const morosos = casasFiltradasCalc.filter(c => c.saldo_pendiente > 0).length;

      setStats({ 
          deudaTotal: deuda, 
          casasConDeuda: morosos, 
          totalCasas: casasFiltradasCalc.length,
          quejasPendientes: qPendientes 
      });
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, [navigate]);

  const cargarNovedadesDia = async () => {
      if(!fechaNovedades) return;
      try {
          const res = await api.get(`/api/reportes-diarios/?fecha=${fechaNovedades}`);
          setListaNovedades(res.data.results || res.data);
      } catch(e) { enqueueSnackbar("Error cargando novedades", {variant: 'error'}); }
  };
  useEffect(() => { if (openNovedades) cargarNovedadesDia(); }, [fechaNovedades, openNovedades]);

  const handleImprimirNovedades = () => {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><body><h1>Bitácora</h1><table>' + listaNovedades.map(n => `<tr><td>${n.mensaje}</td></tr>`).join('') + '</table></body></html>');
      printWindow.document.close();
      printWindow.print();
  };

  const cargarServicios = async () => {
      try { const res = await api.get('/api/servicios/'); setListaServicios(res.data.results || res.data); } catch(e){}
  };
  const handleCrearServicio = async () => { await api.post('/api/servicios/', formServicio); setFormServicio({ categoria: '', nombre: '', telefono: '', descripcion: '' }); cargarServicios(); };
  const handleBorrarServicio = async (id) => { if(confirm("¿Borrar?")) { await api.delete(`/api/servicios/${id}/`); cargarServicios(); }};

  useEffect(() => {
      let scanner = null;
      if (openScanner) {
          setTimeout(() => {
              const element = document.getElementById("reader-admin");
              if (element && !scannerRef.current) {
                  scanner = new Html5QrcodeScanner("reader-admin", { fps: 5, qrbox: 250 }, false);
                  scanner.render(onScanSuccess);
                  scannerRef.current = scanner;
              }
          }, 300);
      } else if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
      }
  }, [openScanner]);

  const onScanSuccess = async (decodedText) => {
      const res = await api.post('/api/accesos-trabajadores/escanear_qr/', { codigo: decodedText });
      setScanResult(res.data);
      setTimeout(() => setScanResult(null), 3000);
  };

  const casasFiltradas = casas.filter(c => !fraccSeleccionado || c.fraccionamiento === fraccSeleccionado);
  const enviarWhatsApp = (tel, nom, sal) => { window.open(`https://wa.me/${tel}?text=${encodeURIComponent(sal>0?`Saldo $${sal}`:'Hola')}`,'_blank'); };

  const handleAbrirEmail = (email, nombre) => {
      if(!email) return enqueueSnackbar("Sin email", { variant: 'warning' });
      setEmailData({ para: email, nombre: nombre, asunto: 'Aviso', mensaje: `Hola ${nombre}...` });
      setOpenEmail(true);
  };
  const handleEnviarEmailReal = async () => { await api.post('/api/usuarios/enviar_correo_vecino/', { destinatario: emailData.para, asunto: emailData.asunto, mensaje: emailData.mensaje }); setOpenEmail(false); };

  const abrirModalPassword = (row) => { setPasswordData({ id: row.id, username: row.username, newPassword: '' }); setOpenPassword(true); };
  const handleGuardarPassword = async () => { await api.patch(`/api/usuarios/${passwordData.id}/`, { password: passwordData.newPassword }); setOpenPassword(false); };

  const abrirModalUsuario = (tipo, u = null) => { 
    setTipoUsuario(tipo); 
    if (u) { setIsEditingUser(true); setFormUser({ ...u, casa_id: u.casa_id || '' }); } 
    else { setIsEditingUser(false); setFormUser({ id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' }); } 
    setOpenUsuario(true); 
  };
  
  const handleGuardarUsuario = async () => { 
      const payload = { ...formUser, rol: tipoUsuario === 'guardia' ? 'Guardia de Seguridad' : 'Residente' }; 
      if (!isEditingUser) payload.password = newUserPassword;
      isEditingUser ? await api.patch(`/api/usuarios/${formUser.id}/`, payload) : await api.post('/api/usuarios/', payload);
      setOpenUsuario(false); cargarDatos();
  };
  async function handleBorrarUsuario(id) { if (confirm("¿Eliminar?")) { await api.delete(`/api/usuarios/${id}/`); cargarDatos(); } }

  const handleCrearCasa = async () => { await api.post('/api/casas/', { calle: formCasa.calle_id, numero_exterior: formCasa.numero, saldo_pendiente: formCasa.saldo, fraccionamiento: fraccSeleccionado }); setOpenCasa(false); cargarDatos(); };
  const handleCrearCalle = async () => { await api.post('/api/calles/', { nombre: nombreCalle }); setOpenCalle(false); cargarDatos(); };
  const handleCrearFraccionamiento = async () => { await api.post('/api/fraccionamientos/', { nombre: nombreNuevoFracc }); setOpenFracc(false); cargarDatos(); };
  const handleActualizarCuota = async () => { await api.patch(`/api/fraccionamientos/${fraccSeleccionado}/`, { cuota_mensual: nuevaCuota }); setOpenCuota(false); cargarDatos(); };
  const handleSubirCSV = async () => { const fd=new FormData(); fd.append('file',archivoCSV); await api.post('/api/usuarios/importar_masivo/', fd); setOpenImportar(false); cargarDatos(); };
  const descargarPlantilla = () => { window.open("data:text/csv;charset=utf-8,username,email,nombre"); };

  const columnasCasas = [
    { field: 'calle_nombre', headerName: 'Calle', width: 150 },
    { field: 'numero_exterior', headerName: 'Número', width: 100 },
    { field: 'propietario_nombre', headerName: 'Propietario', width: 200 },
    { field: 'saldo_pendiente', headerName: 'Saldo', width: 130, renderCell: (p) => <Typography color={p.value>0?'error':'success'}>${p.value}</Typography> },
    { field: 'acciones', headerName: 'Contacto', width: 150, renderCell: (p) => p.row.propietario ? (<Box><IconButton color="success" onClick={()=>enviarWhatsApp(p.row.telefono_propietario, p.row.propietario_nombre, p.row.saldo_pendiente)}><WhatsAppIcon/></IconButton><IconButton color="primary" onClick={()=>handleAbrirEmail(p.row.email_propietario, p.row.propietario_nombre)}><EmailIcon/></IconButton></Box>) : null }
  ];

  const columnasUsuarios = [
    { field: 'nombre_completo', headerName: 'Nombre', width: 200 },
    { field: 'rol', headerName: 'Rol', width: 150 },
    { field: 'acciones', headerName: 'Acciones', width: 180, renderCell: (p) => (<><IconButton color="primary" onClick={()=>abrirModalUsuario('residente',p.row)}><EditIcon/></IconButton><IconButton color="warning" onClick={()=>abrirModalPassword(p.row)}><KeyIcon/></IconButton><IconButton color="error" onClick={()=>handleBorrarUsuario(p.row.id)}><DeleteIcon/></IconButton></>) }
  ];

  const KpiCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card elevation={4} sx={{ height: '100%', borderRadius: 3, cursor: onClick?'pointer':'default' }} onClick={onClick}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#eff2f5', minHeight: '100vh', display:'flex', flexDirection:'column' }}>
      <AppBar position="sticky" sx={{ bgcolor: '#1e293b' }}> 
        <Toolbar>
          <SecurityIcon sx={{ mr: 2, color: '#4fc3f7' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>ADMINISTRACIÓN</Typography>
          <Button variant="contained" color="secondary" onClick={() => setOpenScanner(true)} sx={{ mr: 2 }}>Escanear</Button>
          <Button variant="contained" sx={{ bgcolor: '#000', color: '#c084fc', mr: 2 }} onClick={() => navigate('/admin-vigilancia')}>Monitor C5</Button>
          <IconButton onClick={() => navigate('/mi-perfil')} color="inherit" sx={{mr:1}}><AccountCircleIcon /></IconButton>
          <Button color="error" variant="contained" onClick={()=>{localStorage.clear(); navigate('/');}}>Salir</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 5, mb: 5, flexGrow: 1 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={2}>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#4caf50' }} onClick={() => setOpenImportar(true)}>Importar</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#2e7d32' }} onClick={() => setOpenDirectorio(true)}>Usuarios</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#546e7a' }} onClick={() => setOpenCalle(true)}>Calles</Button></Grid>
                <Grid item><Button variant="contained" color="primary" onClick={() => setOpenCasa(true)}>Casa</Button></Grid>
                <Grid item><Button variant="contained" color="info" onClick={() => abrirModalUsuario('residente')}>+ Vecino</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#455a64' }} onClick={() => abrirModalUsuario('guardia')}>+ Guardia</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#2e7d32' }} onClick={() => setOpenCuota(true)}>Cuota</Button></Grid>
                {/* ✅ Botones corregidos para navegar a nuevas páginas */}
                <Grid item><Button variant="contained" sx={{ bgcolor: '#795548' }} startIcon={<EngineeringIcon />} onClick={() => navigate('/personal')}>Personal</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#7b1fa2' }} startIcon={<ForumIcon />} onClick={() => navigate('/comunidad')}>Comunidad</Button></Grid>
                <Grid item><Button variant="contained" color="warning" startIcon={<AccountBalanceWalletIcon />} onClick={() => navigate('/finanzas')}>Finanzas</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#00695c' }} onClick={() => {setOpenServicios(true); cargarServicios();}}>Directorio</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#d32f2f' }} onClick={() => navigate('/quejas')}>Quejas</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#0277bd' }} onClick={() => navigate('/reportes')}>Reportes</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#f57c00' }} onClick={() => setOpenNovedades(true)}>Bitácora</Button></Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={3}><KpiCard title="Deuda Total" value={`$${stats.deudaTotal.toLocaleString()}`} subtitle="Pendiente" icon={<AttachMoneyIcon />} color="#e53935"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Morosidad" value={stats.casasConDeuda} subtitle="Casas con deuda" icon={<ReportProblemIcon />} color="#fb8c00"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Propiedades" value={stats.totalCasas} subtitle="Registradas" icon={<HomeIcon />} color="#1976d2"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Quejas" value={stats.quejasPendientes} subtitle="Pendientes" icon={<ForumIcon />} color="#d32f2f" onClick={() => navigate('/quejas')}/></Grid>
        </Grid>

        <Paper sx={{ height: 600, width: '100%', p: 2 }}>
          <DataGrid rows={casasFiltradas} columns={columnasCasas} pageSize={10} loading={loading} />
        </Paper>
      </Container>

      {/* --- MODALES --- */}
      <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor: '#333', color: 'white'}}>Escáner de Acceso</DialogTitle>
          <DialogContent sx={{ textAlign: 'center', p: 3 }}><div id="reader-admin"></div></DialogContent>
          <DialogActions><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions>
      </Dialog>
      <Dialog open={openCasa} onClose={() => setOpenCasa(false)}><DialogTitle>Nueva Casa</DialogTitle><DialogContent><FormControl fullWidth margin="dense"><InputLabel>Calle</InputLabel><Select value={formCasa.calle_id} onChange={(e) => setFormCasa({...formCasa, calle_id: e.target.value})}>{calles.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}</Select></FormControl><TextField margin="dense" label="Número" fullWidth onChange={(e) => setFormCasa({...formCasa, numero: e.target.value})} /><TextField margin="dense" label="Saldo Inicial" type="number" fullWidth onChange={(e) => setFormCasa({...formCasa, saldo: e.target.value})} /></DialogContent><DialogActions><Button onClick={() => setOpenCasa(false)}>Cancelar</Button><Button onClick={handleCrearCasa}>Guardar</Button></DialogActions></Dialog>
      <Dialog open={openFracc} onClose={()=>setOpenFracc(false)}><DialogTitle>Nuevo Fraccionamiento</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nombre" fullWidth value={nombreNuevoFracc} onChange={(e)=>setNombreNuevoFracc(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenFracc(false)}>Cancelar</Button><Button onClick={handleCrearFraccionamiento}>Crear</Button></DialogActions></Dialog>
      <Dialog open={openImportar} onClose={()=>setOpenImportar(false)} fullWidth maxWidth="sm"><DialogTitle sx={{bgcolor:'#4caf50', color:'white'}}>Importar</DialogTitle><DialogContent sx={{mt:2}}><Button startIcon={<DownloadIcon/>} onClick={descargarPlantilla}>Descargar Plantilla</Button><Button component="label" variant="contained" fullWidth startIcon={<UploadFileIcon/>} sx={{mt:2}}>{archivoCSV ? archivoCSV.name : "Subir CSV"}<input type="file" hidden accept=".csv" onChange={(e)=>setArchivoCSV(e.target.files[0])} /></Button>{resultadoImportacion && <Box sx={{mt:2, p:2, bgcolor:'#e8f5e9'}}>{resultadoImportacion.mensaje}</Box>}</DialogContent><DialogActions><Button onClick={()=>setOpenImportar(false)}>Cerrar</Button><Button onClick={handleSubirCSV} variant="contained" color="success" disabled={!archivoCSV}>Procesar</Button></DialogActions></Dialog>
      <Dialog open={openCuota} onClose={() => setOpenCuota(false)}><DialogTitle>Cuota</DialogTitle><DialogContent><TextField label="Monto" type="number" fullWidth value={nuevaCuota} onChange={(e) => setNuevaCuota(e.target.value)} /></DialogContent><DialogActions><Button onClick={() => setOpenCuota(false)}>Cancelar</Button><Button onClick={handleActualizarCuota}>Actualizar</Button></DialogActions></Dialog>
      <Dialog open={openEmail} onClose={() => setOpenEmail(false)} fullWidth maxWidth="sm"><DialogTitle>Email</DialogTitle><DialogContent><TextField label="Para" fullWidth margin="dense" value={emailData.para} disabled /><TextField label="Asunto" fullWidth margin="dense" value={emailData.asunto} onChange={(e) => setEmailData({...emailData, asunto: e.target.value})} /><TextField label="Mensaje" fullWidth multiline rows={6} margin="dense" value={emailData.mensaje} onChange={(e) => setEmailData({...emailData, mensaje: e.target.value})} /></DialogContent><DialogActions><Button onClick={() => setOpenEmail(false)}>Cancelar</Button><Button onClick={handleEnviarEmailReal}>Enviar</Button></DialogActions></Dialog>
      <Dialog open={openDirectorio} onClose={() => setOpenDirectorio(false)} fullWidth maxWidth="lg"><DialogTitle>Usuarios</DialogTitle><DialogContent><Tabs value={tabDirectorio} onChange={(e,v)=>setTabDirectorio(v)} centered><Tab label="Residentes" /><Tab label="Guardias" /></Tabs><Box sx={{ height: 400 }}><DataGrid rows={usuarios.filter(u => tabDirectorio === 0 ? (!u.rol || u.rol.toLowerCase().includes('residente')) : (u.rol && u.rol.toLowerCase().includes('guardia')))} columns={columnasUsuarios} pageSize={5} /></Box></DialogContent><DialogActions><Button onClick={() => setOpenDirectorio(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openUsuario} onClose={()=>setOpenUsuario(false)}><DialogTitle>Usuario</DialogTitle><DialogContent><TextField label="Nombre" fullWidth value={formUser.nombre} onChange={(e)=>setFormUser({...formUser, nombre:e.target.value})}/><TextField label="Usuario" fullWidth value={formUser.username} onChange={(e)=>setFormUser({...formUser, username:e.target.value})} /><TextField label="Password" type="password" fullWidth value={newUserPassword} onChange={(e)=>setNewUserPassword(e.target.value)} /><TextField label="Email" fullWidth value={formUser.email} onChange={(e)=>setFormUser({...formUser, email:e.target.value})}/><FormControl fullWidth><InputLabel>Casa</InputLabel><Select value={formUser.casa_id} onChange={(e)=>setFormUser({...formUser, casa_id:e.target.value})}>{casasFiltradas.map(c=><MenuItem key={c.id} value={c.id}>{c.calle_nombre} #{c.numero_exterior}</MenuItem>)}</Select></FormControl></DialogContent><DialogActions><Button onClick={()=>setOpenUsuario(false)}>Cancelar</Button><Button onClick={handleGuardarUsuario}>Guardar</Button></DialogActions></Dialog>
      <Dialog open={openPassword} onClose={()=>setOpenPassword(false)}><DialogTitle>Cambiar Pass</DialogTitle><DialogContent><TextField label="Nueva" type="password" fullWidth value={passwordData.newPassword} onChange={(e)=>setPasswordData({...passwordData, newPassword:e.target.value})} /></DialogContent><DialogActions><Button onClick={()=>setOpenPassword(false)}>Cancelar</Button><Button onClick={handleGuardarPassword}>Cambiar</Button></DialogActions></Dialog>
      <Dialog open={openCalle} onClose={()=>setOpenCalle(false)}><DialogTitle>Calle</DialogTitle><DialogContent><TextField fullWidth label="Nombre" value={nombreCalle} onChange={(e)=>setNombreCalle(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenCalle(false)}>Cerrar</Button><Button onClick={handleCrearCalle}>Crear</Button></DialogActions></Dialog>
      <Dialog open={openServicios} onClose={() => setOpenServicios(false)} fullWidth maxWidth="md"><DialogTitle>Servicios</DialogTitle><DialogContent><Tabs value={filtroCategoria} onChange={(e, v) => setFiltroCategoria(v)} scrollButtons="auto"><Tab label="Todos" value="Todos" />{CATEGORIAS_SERVICIOS.map(c => <Tab key={c} label={c} value={c} />)}</Tabs><Box display="flex" gap={1}><Select value={formServicio.categoria} onChange={(e)=>setFormServicio({...formServicio, categoria:e.target.value})}>{CATEGORIAS_SERVICIOS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select><TextField label="Nombre" value={formServicio.nombre} onChange={(e)=>setFormServicio({...formServicio, nombre:e.target.value})} /><TextField label="Tel" value={formServicio.telefono} onChange={(e)=>setFormServicio({...formServicio, telefono:e.target.value})} /><Button onClick={handleCrearServicio}>+</Button></Box><TableContainer component={Paper} sx={{maxHeight: 400}}><Table stickyHeader><TableHead><TableRow><TableCell>Cat</TableCell><TableCell>Nom</TableCell><TableCell>Tel</TableCell><TableCell>Acc</TableCell></TableRow></TableHead><TableBody>{listaServicios.filter(s => filtroCategoria === 'Todos' || s.categoria === filtroCategoria).map(s => (<TableRow key={s.id}><TableCell>{s.categoria}</TableCell><TableCell>{s.nombre}</TableCell><TableCell>{s.telefono}</TableCell><TableCell><IconButton onClick={()=>handleBorrarServicio(s.id)}><DeleteIcon/></IconButton></TableCell></TableRow>))}</TableBody></Table></TableContainer></DialogContent><DialogActions><Button onClick={() => setOpenServicios(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openNovedades} onClose={() => setOpenNovedades(false)} fullWidth maxWidth="md"><DialogTitle>Bitácora <TextField type="date" value={fechaNovedades} onChange={(e) => setFechaNovedades(e.target.value)} /></DialogTitle><DialogContent><TableContainer><Table><TableHead><TableRow><TableCell>Hora</TableCell><TableCell>Guardia</TableCell><TableCell>Reporte</TableCell></TableRow></TableHead><TableBody>{listaNovedades.map(n => (<TableRow key={n.id}><TableCell>{new Date(n.fecha).toLocaleTimeString()}</TableCell><TableCell>{n.guardia_nombre}</TableCell><TableCell>{n.mensaje}</TableCell></TableRow>))}</TableBody></Table></TableContainer></DialogContent><DialogActions><Button onClick={() => setOpenNovedades(false)}>Cerrar</Button><Button onClick={handleImprimirNovedades}>Imprimir</Button><Button onClick={cargarNovedadesDia}>Actualizar</Button></DialogActions></Dialog>

      <Footer />
    </Box>
  );
}

export default AdminPanel;