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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; 
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
  
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [fraccSeleccionado, setFraccSeleccionado] = useState(''); 
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [casas, setCasas] = useState([]); 
  const [calles, setCalles] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ deudaTotal: 0, casasConDeuda: 0, totalCasas: 0, quejasPendientes: 0 });

  const [openFracc, setOpenFracc] = useState(false);
  const [nombreNuevoFracc, setNombreNuevoFracc] = useState('');
  const [openCasa, setOpenCasa] = useState(false);
  const [openUsuario, setOpenUsuario] = useState(false);
  const [openDirectorio, setOpenDirectorio] = useState(false);
  const [openContabilidad, setOpenContabilidad] = useState(false);
  const [openCalle, setOpenCalle] = useState(false);
  const [openPersonal, setOpenPersonal] = useState(false);
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

  const [tabPersonal, setTabPersonal] = useState(0);
  const [tabDirectorio, setTabDirectorio] = useState(0); 
  const [tabContabilidad, setTabContabilidad] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [listaServicios, setListaServicios] = useState([]); 
  const [historialAccesos, setHistorialAccesos] = useState([]);
  const [tiposEgresos, setTiposEgresos] = useState([]);
  const [listaEgresos, setListaEgresos] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('residente');
  const [nombreCalle, setNombreCalle] = useState('');
  const [montoExtra, setMontoExtra] = useState('');
  const [conceptoExtra, setConceptoExtra] = useState('');
  const [formCasa, setFormCasa] = useState({ calle_id: '', numero: '', saldo: 0 });
  const [formUser, setFormUser] = useState({ id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState(''); 
  const [formEgreso, setFormEgreso] = useState({ tipo_id: '', monto: '', descripcion: '' });
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
      
      if (!fraccSeleccionado && listaFracc.length > 0) setFraccSeleccionado(userData.fraccionamiento_id || listaFracc[0].id);

      const [resCasas, resCalles, resUsers, resQuejas] = await Promise.all([
          api.get('/api/casas/', { headers }),
          api.get('/api/calles/', { headers }),
          api.get('/api/usuarios/', { headers }),
          api.get('/api/quejas/', { headers })
      ]);
      
      setCasas(resCasas.data.results || resCasas.data);
      setCalles(resCalles.data.results || resCalles.data);
      setUsuarios(resUsers.data.results || resUsers.data);

      const dataQuejas = resQuejas.data.results || resQuejas.data;
      const qPendientes = Array.isArray(dataQuejas) ? dataQuejas.filter(q => q.estatus === 'PENDIENTE').length : 0;
      
      const deuda = (resCasas.data.results || resCasas.data).reduce((acc, c) => acc + parseFloat(c.saldo_pendiente || 0), 0);
      const morosos = (resCasas.data.results || resCasas.data).filter(c => c.saldo_pendiente > 0).length;

      setStats({ deudaTotal: deuda, casasConDeuda: morosos, totalCasas: (resCasas.data.results || resCasas.data).length, quejasPendientes: qPendientes });
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, [navigate]);

  const cargarNovedadesDia = async () => {
      if(!fechaNovedades) return;
      try {
          const res = await api.get(`/api/reportes-diarios/?fecha=${fechaNovedades}`);
          setListaNovedades(res.data.results || res.data);
      } catch(e) { enqueueSnackbar("Error", {variant: 'error'}); }
  };
  useEffect(() => { if (openNovedades) cargarNovedadesDia(); }, [fechaNovedades, openNovedades]);

  const handleCrearServicio = async () => {
      await api.post('/api/servicios/', formServicio);
      setFormServicio({ categoria: '', nombre: '', telefono: '', descripcion: '' });
      cargarServicios();
  };

  const cargarServicios = async () => {
      const res = await api.get('/api/servicios/');
      setListaServicios(res.data.results || res.data);
  };

  const handleBorrarServicio = async (id) => {
      await api.delete(`/api/servicios/${id}/`);
      cargarServicios();
  };

  useEffect(() => {
      let scanner = null;
      if (openScanner) {
          setTimeout(() => {
              const element = document.getElementById("reader-admin");
              if (element && !scannerRef.current) {
                  scanner = new Html5QrcodeScanner("reader-admin", { fps: 5, qrbox: {width: 250, height: 250} }, false);
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

  const handleEnviarEmailReal = async () => {
      await api.post('/api/usuarios/enviar_correo_vecino/', { destinatario: emailData.para, asunto: emailData.asunto, mensaje: emailData.mensaje });
      setOpenEmail(true);
  };

  const handleGuardarPassword = async () => {
      await api.patch(`/api/usuarios/${passwordData.id}/`, { password: passwordData.newPassword });
      setOpenPassword(false);
  };

  const columnasCasas = [
    { field: 'calle_nombre', headerName: 'Calle', width: 150 },
    { field: 'numero_exterior', headerName: 'Número', width: 100 },
    { field: 'propietario_nombre', headerName: 'Propietario', width: 200 },
    { field: 'saldo_pendiente', headerName: 'Saldo', width: 130, renderCell: (params) => <Typography fontWeight="bold" color={params.value > 0 ? 'error' : 'success'}>${params.value}</Typography> },
    { field: 'acciones', headerName: 'Contacto', width: 150, renderCell: (p) => p.row.propietario ? (<Box><IconButton color="success" onClick={() => enviarWhatsApp(p.row.telefono_propietario, p.row.propietario_nombre, p.row.saldo_pendiente)}><WhatsAppIcon /></IconButton><IconButton color="primary" onClick={() => handleAbrirEmail(p.row.email_propietario, p.row.propietario_nombre)}><EmailIcon /></IconButton></Box>) : null }
  ];

  const columnasUsuarios = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nombre_completo', headerName: 'Nombre Completo', width: 200 },
    { field: 'rol', headerName: 'Rol', width: 150 },
    { field: 'acciones', headerName: 'Acciones', width: 180, renderCell: (p) => (
        <>
            <IconButton size="small" color="primary" onClick={() => abrirModalUsuario(tabDirectorio === 0 ? 'residente' : 'guardia', p.row)}><EditIcon /></IconButton>
            <IconButton size="small" color="warning" onClick={() => abrirModalPassword(p.row)}><KeyIcon /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleBorrarUsuario(p.row.id)}><DeleteIcon /></IconButton>
        </>
    )}
  ];

  const handleCrearFraccionamiento = async () => { await api.post('/api/fraccionamientos/', { nombre: nombreNuevoFracc }); cargarDatos(); setOpenFracc(false); };
  const handleActualizarCuota = async () => { await api.patch(`/api/fraccionamientos/${fraccSeleccionado}/`, { cuota_mensual: nuevaCuota }); setOpenCuota(false); };
  const handleGuardarUsuario = async () => { 
      const payload = { ...formUser, rol: tipoUsuario === 'guardia' ? 'Guardia de Seguridad' : 'Residente' };
      if (!isEditingUser) payload.password = newUserPassword;
      isEditingUser ? await api.patch(`/api/usuarios/${formUser.id}/`, payload) : await api.post('/api/usuarios/', payload);
      setOpenUsuario(false); cargarDatos();
  };

  const handleBorrarUsuario = async (id) => { if (confirm("¿Borrar?")) { await api.delete(`/api/usuarios/${id}/`); cargarDatos(); } };
  const handleCrearCalle = async () => { await api.post('/api/calles/', { nombre: nombreCalle }); setOpenCalle(false); cargarDatos(); };
  const handleCrearCasa = async () => { await api.post('/api/casas/', { calle: formCasa.calle_id, numero_exterior: formCasa.numero, saldo_pendiente: formCasa.saldo, fraccionamiento: fraccSeleccionado }); setOpenCasa(false); cargarDatos(); };
  const handleValidarPago = async (id, accion) => { await api.post(`/api/pagos/${id}/${accion}/`); cargarContabilidad(); cargarDatos(); };
  const handleCargoMasivo = async () => { await api.post('/api/pagos/cargo_masivo/', { monto: montoExtra, concepto: conceptoExtra }); cargarDatos(); };
  const handleRegistrarEgreso = async () => { await api.post('/api/egresos/', { tipo: formEgreso.tipo_id, monto: formEgreso.monto, descripcion: formEgreso.descripcion }); cargarContabilidad(); };
  const enviarWhatsApp = (tel, nom, sal) => { window.open(`https://wa.me/${tel}?text=${encodeURIComponent(sal > 0 ? `Hola ${nom}, saldo $${sal}` : `Hola ${nom}`)}`, '_blank'); };
  const cargarContabilidad = async () => { 
      const [t, e, p] = await Promise.all([api.get('/api/tipos-egresos/'), api.get('/api/egresos/'), api.get('/api/pagos/?estado=PENDIENTE')]);
      setTiposEgresos(t.data.results || t.data); setListaEgresos(e.data.results || e.data); setPagosPendientes(p.data.results || p.data);
  };
  const cargarHistorial = async () => { 
      const [resTrab, resProv] = await Promise.all([api.get(`/api/accesos-trabajadores/?inicio=${fechaInicio}&fin=${fechaFin}`), api.get(`/api/visitas/?inicio=${fechaInicio}&fin=${fechaFin}&tipo=PROVEEDOR`)]);
      const data = [...(resTrab.data.results || resTrab.data), ...(resProv.data.results || resProv.data)];
      setHistorialAccesos(data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
  };

  const abrirModalUsuario = (tipo, u = null) => { setTipoUsuario(tipo); setIsEditingUser(!!u); setFormUser(u ? { ...u, nombre: u.first_name, apellido: u.last_name } : { id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' }); setOpenUsuario(true); };
  const handleAbrirEmail = (e, n) => { setEmailData({ para: e, nombre: n, asunto: 'Aviso', mensaje: '' }); setOpenEmail(true); };
  const abrirModalPassword = (row) => { setPasswordData({ id: row.id, username: row.username, newPassword: '' }); setOpenPassword(true); };

  const KpiCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card elevation={4} sx={{ height: '100%', borderRadius: 3, cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { bgcolor: '#f1f5f9' } : {} }} onClick={onClick}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box sx={{ flexGrow: 1 }}><Typography color="text.secondary" variant="subtitle2" fontWeight="bold">{title}</Typography><Typography variant="h4" fontWeight="bold">{value}</Typography><Typography variant="body2" color="text.secondary">{subtitle}</Typography></Box>
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
          <Button variant="contained" color="secondary" startIcon={<QrCodeScannerIcon />} onClick={() => setOpenScanner(true)} sx={{ mr: 2 }}>Escanear</Button>
          <Button variant="contained" sx={{ bgcolor: '#000', color: '#c084fc', border: '1px solid #c084fc', mr: 2 }} onClick={() => navigate('/admin-vigilancia')}>Monitor C5</Button>
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
                <Grid item><Button variant="contained" color="warning" onClick={() => {setOpenContabilidad(true); cargarContabilidad();}}>Finanzas</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#0277bd' }} onClick={() => navigate('/reportes')}>Reportes</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#d32f2f' }} startIcon={<ReportProblemIcon />} onClick={() => navigate('/quejas')}>Quejas</Button></Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={3}><KpiCard title="Deuda Total" value={`$${stats.deudaTotal.toLocaleString()}`} subtitle="Pendiente" icon={<AttachMoneyIcon />} color="#e53935"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Morosidad" value={stats.casasConDeuda} subtitle="Casas con deuda" icon={<ReportProblemIcon />} color="#fb8c00"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Propiedades" value={stats.totalCasas} subtitle="Registradas" icon={<HomeIcon />} color="#1976d2"/></Grid>
          <Grid item xs={12} md={3}><KpiCard title="Quejas Pendientes" value={stats.quejasPendientes} subtitle="Clic para atender" icon={<ForumIcon />} color="#d32f2f" onClick={() => navigate('/quejas')}/></Grid>
        </Grid>

        <Paper sx={{ height: 600, width: '100%', p: 2 }}>
          <DataGrid rows={casas.filter(c => !fraccSeleccionado || c.fraccionamiento === fraccSeleccionado)} columns={columnasCasas} pageSize={10} loading={loading} />
        </Paper>
      </Container>

      {/* MODALES CORREGIDOS (Sin barras invertidas) */}
      <Dialog open={openContabilidad} onClose={() => setOpenContabilidad(false)} fullWidth maxWidth="lg">
          <DialogTitle sx={{bgcolor: '#ed6c02', color: 'white'}}>Centro Financiero</DialogTitle>
          <DialogContent>
              <Tabs value={tabContabilidad} onChange={(e,v)=>setTabContabilidad(v)} centered sx={{mb:2}}><Tab label="Validar Pagos" /><Tab label="Gastos" /></Tabs>
              {tabContabilidad === 0 && (
                <Table size="small">
                    <TableHead><TableRow><TableCell>Casa</TableCell><TableCell>Monto</TableCell><TableCell>Comprobante</TableCell><TableCell>Acción</TableCell></TableRow></TableHead>
                    <TableBody>{pagosPendientes.map(p=>(<TableRow key={p.id}><TableCell>{p.casa}</TableCell><TableCell>${p.monto}</TableCell><TableCell>{p.comprobante ? <a href={p.comprobante} target="_blank" rel="noreferrer">Ver</a> : '-'}</TableCell><TableCell><Button size="small" color="success" onClick={()=>handleValidarPago(p.id,'aprobar')}>OK</Button></TableCell></TableRow>))}</TableBody>
                </Table>
              )}
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenContabilidad(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor: '#333', color: 'white'}}>Escáner de Acceso</DialogTitle>
          <DialogContent sx={{ textAlign: 'center', p: 3 }}><div id="reader-admin" style={{ width: '100%', minHeight: '300px' }}></div></DialogContent>
          <DialogActions><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
}

export default AdminPanel;