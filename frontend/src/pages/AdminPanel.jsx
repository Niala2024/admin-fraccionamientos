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
  
  // INICIALIZACIÓN
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [fraccSeleccionado, setFraccSeleccionado] = useState(''); 
  const [isSuperUser, setIsSuperUser] = useState(false);

  const [casas, setCasas] = useState([]); 
  const [calles, setCalles] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // KPI Stats
  const [stats, setStats] = useState({ deudaTotal: 0, casasConDeuda: 0, totalCasas: 0, quejasPendientes: 0 });

  // Modales activos
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

  // Manejo de Novedades y Bitácora
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
    printWindow.document.write('<html><head><title>Bitácora</title></head><body><h1>Reporte ' + fechaNovedades + '</h1>' + 
    '<table>' + listaNovedades.map(n => `<tr><td>${new Date(n.fecha).toLocaleTimeString()}</td><td>${n.mensaje}</td></tr>`).join('') + '</table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // Directorio de Servicios
  const cargarServicios = async () => {
    const res = await api.get('/api/servicios/');
    setListaServicios(res.data.results || res.data);
  };
  const handleCrearServicio = async () => {
    await api.post('/api/servicios/', formServicio);
    setFormServicio({ categoria: '', nombre: '', telefono: '', descripcion: '' });
    cargarServicios();
  };

  // QR Scanner
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

  const enviarWhatsApp = (tel, nom, sal) => { 
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(sal > 0 ? `Hola ${nom}, saldo $${sal}` : `Hola ${nom}`)}`, '_blank'); 
  };

  const handleGuardarUsuario = async () => {
    const payload = { ...formUser, rol: tipoUsuario === 'guardia' ? 'Guardia de Seguridad' : 'Residente' };
    if (!isEditingUser) payload.password = newUserPassword;
    isEditingUser ? await api.patch(`/api/usuarios/${formUser.id}/`, payload) : await api.post('/api/usuarios/', payload);
    setOpenUsuario(false); cargarDatos();
  };

  const handleCrearCasa = async () => {
    await api.post('/api/casas/', { calle: formCasa.calle_id, numero_exterior: formCasa.numero, saldo_pendiente: formCasa.saldo, fraccionamiento: fraccSeleccionado });
    setOpenCasa(false); cargarDatos();
  };

  const abrirModalUsuario = (tipo, u = null) => { 
    setTipoUsuario(tipo); 
    setIsEditingUser(!!u);
    setFormUser(u ? { ...u, nombre: u.first_name, apellido: u.last_name } : { id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' });
    setOpenUsuario(true);
  };

  const KpiCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card elevation={4} sx={{ height: '100%', borderRadius: 3, cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { bgcolor: '#f1f5f9' } : {} }} onClick={onClick}>
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
                {/* Botones que ahora navegan a páginas independientes */}
                <Grid item><Button variant="contained" sx={{ bgcolor: '#795548' }} startIcon={<EngineeringIcon />} onClick={() => navigate('/personal')}>Personal</Button></Grid>
                <Grid item><Button variant="contained" color="warning" startIcon={<AccountBalanceWalletIcon />} onClick={() => navigate('/finanzas')}>Finanzas</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#d32f2f' }} startIcon={<ReportProblemIcon />} onClick={() => navigate('/quejas')}>Buzón Quejas</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#0277bd' }} onClick={() => navigate('/reportes')}>Reportes</Button></Grid>
                <Grid item><Button variant="contained" sx={{ bgcolor: '#f57c00' }} onClick={() => setOpenNovedades(true)}>Bitácora</Button></Grid>
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

      {/* Modales Básicos */}
      <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor: '#333', color: 'white'}}>Escáner de Acceso</DialogTitle>
          <DialogContent sx={{ textAlign: 'center', p: 3 }}><div id="reader-admin"></div></DialogContent>
          <DialogActions><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openCasa} onClose={() => setOpenCasa(false)}>
          <DialogTitle>Nueva Casa</DialogTitle>
          <DialogContent>
              <TextField select fullWidth label="Calle" margin="dense" value={formCasa.calle_id} onChange={(e) => setFormCasa({...formCasa, calle_id: e.target.value})}>{calles.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}</TextField>
              <TextField fullWidth label="Número" margin="dense" onChange={(e) => setFormCasa({...formCasa, numero: e.target.value})} />
              <TextField fullWidth label="Saldo Inicial" type="number" margin="dense" onChange={(e) => setFormCasa({...formCasa, saldo: e.target.value})} />
          </DialogContent>
          <DialogActions><Button onClick={() => setOpenCasa(false)}>Cancelar</Button><Button onClick={handleCrearCasa} variant="contained">Guardar</Button></DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
}

export default AdminPanel;