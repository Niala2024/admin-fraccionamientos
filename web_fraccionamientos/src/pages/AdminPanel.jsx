import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, AppBar, Toolbar, Card, CardContent, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, 
  FormControl, Tab, Tabs, Alert, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; 
import { useSnackbar } from 'notistack';      

// Iconos
import SecurityIcon from '@mui/icons-material/Security';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; 
import DomainIcon from '@mui/icons-material/Domain'; 

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // <--- IMPORTACIÓN CENTRALIZADA
import Footer from '../components/Footer';

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
  
  const [stats, setStats] = useState({ deudaTotal: 0, casasConDeuda: 0, totalCasas: 0 });

  const [openFracc, setOpenFracc] = useState(false);
  const [nombreNuevoFracc, setNombreNuevoFracc] = useState('');
  const [openCasa, setOpenCasa] = useState(false);
  const [openUsuario, setOpenUsuario] = useState(false);
  const [openDirectorio, setOpenDirectorio] = useState(false);
  const [openContabilidad, setOpenContabilidad] = useState(false);
  const [openCalle, setOpenCalle] = useState(false);
  const [openPersonal, setOpenPersonal] = useState(false);
  const [openImportar, setOpenImportar] = useState(false); 

  const [archivoCSV, setArchivoCSV] = useState(null);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);

  const [tabPersonal, setTabPersonal] = useState(0);
  const [tabDirectorio, setTabDirectorio] = useState(0); 
  const [tabContabilidad, setTabContabilidad] = useState(0);

  const [listaTrabajadores, setListaTrabajadores] = useState([]);
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
  const [formUser, setFormUser] = useState({ id: null, username: '', password: '', email: '', nombre: '', telefono: '', casa_id: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [formEgreso, setFormEgreso] = useState({ tipo_id: '', monto: '', descripcion: '' });

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const userLocalStr = localStorage.getItem('user_data');
    if (!token) { navigate('/'); return; }
    
    try {
      const userData = JSON.parse(userLocalStr || '{}');
      const soySuper = userData.is_superuser === true;
      const miFraccID = userData.fraccionamiento_id;
      
      setIsSuperUser(soySuper); 

      const headers = { 'Authorization': `Token ${token}` };
      
      // USAMOS API.GET
      const resFracc = await api.get('/api/fraccionamientos/', { headers });
      const listaFracc = resFracc.data.results || resFracc.data;
      setFraccionamientos(Array.isArray(listaFracc) ? listaFracc : []);
      
      if (soySuper) {
          if (!fraccSeleccionado && listaFracc.length > 0) setFraccSeleccionado(listaFracc[0].id);
      } else {
          if (miFraccID) setFraccSeleccionado(miFraccID);
          else if(listaFracc.length > 0) setFraccSeleccionado(listaFracc[0].id);
      }

      const [resCasas, resCalles, resUsers] = await Promise.all([
          api.get('/api/casas/', { headers }),
          api.get('/api/calles/', { headers }),
          api.get('/api/usuarios/', { headers })
      ]);
      
      setCasas(resCasas.data.results || resCasas.data);
      setCalles(resCalles.data.results || resCalles.data);
      setUsuarios(resUsers.data.results || resUsers.data);
      
      setLoading(false);
    } catch (e) { if(e.response?.status===401) navigate('/'); }
  };

  useEffect(() => { cargarDatos(); }, [navigate]);

  const casasFiltradas = casas.filter(c => !fraccSeleccionado || c.fraccionamiento === fraccSeleccionado);
  
  useEffect(() => {
      const deuda = casasFiltradas.reduce((acc, c) => acc + parseFloat(c.saldo_pendiente), 0);
      const morosos = casasFiltradas.filter(c => c.saldo_pendiente > 0).length;
      setStats({ deudaTotal: deuda, casasConDeuda: morosos, totalCasas: casasFiltradas.length });
  }, [casas, fraccSeleccionado]);

  const columnasCasas = [
    { field: 'calle_nombre', headerName: 'Calle', width: 150 },
    { field: 'numero_exterior', headerName: 'Número', width: 100 },
    { field: 'propietario', headerName: 'Propietario', width: 200, valueGetter: (value, row) => row?.propietario || '-- Vacante --' },
    { field: 'saldo_pendiente', headerName: 'Saldo', width: 130, renderCell: (params) => (<Typography fontWeight="bold" color={params.value > 0 ? 'error' : 'success'}>${params.value}</Typography>) },
    { field: 'acciones', headerName: 'Contacto', width: 100, renderCell: (params) => (params.row.propietario ? (<IconButton color="success" onClick={() => enviarWhatsApp(params.row.telefono_propietario, params.row.propietario, params.row.saldo_pendiente)}><WhatsAppIcon /></IconButton>) : null) }
  ];

  const columnasUsuarios = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'first_name', headerName: 'Nombre', width: 200 },
    { field: 'username', headerName: 'Usuario', width: 150 },
    { field: 'rol', headerName: 'Rol', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'acciones', headerName: 'Acciones', width: 150, renderCell: (params) => (<><IconButton size="small" color="primary" onClick={() => abrirModalUsuario(tabDirectorio === 0 ? 'residente' : 'guardia', params.row)}><EditIcon /></IconButton><IconButton size="small" color="error" onClick={() => handleBorrarUsuario(params.row.id)}><DeleteIcon /></IconButton></>) }
  ];

  const handleCrearFraccionamiento = async () => {
      if(!nombreNuevoFracc) return enqueueSnackbar("Escribe un nombre", {variant:'warning'});
      const token = localStorage.getItem('token');
      try {
          await api.post('/api/fraccionamientos/', { nombre: nombreNuevoFracc }, { headers: { 'Authorization': `Token ${token}` } });
          enqueueSnackbar("Fraccionamiento creado", {variant:'success'}); setNombreNuevoFracc(''); setOpenFracc(false); cargarDatos();
      } catch(e) { enqueueSnackbar("Solo el Super Admin puede crear comunidades.", {variant:'error'}); }
  };

  const cargarPersonal = async () => { 
      try { const res = await api.get('/api/trabajadores/', { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); setListaTrabajadores(res.data.results || res.data); } catch(e){} 
  };
  
  const handleSubirCSV = async () => {
      if(!archivoCSV) return enqueueSnackbar("Selecciona un archivo", {variant:'warning'});
      const fd=new FormData(); fd.append('file',archivoCSV); setLoading(true); 
      try{ 
          const r=await api.post('/api/usuarios/importar_masivo/', fd, { headers:{'Authorization':`Token ${localStorage.getItem('token')}`,'Content-Type':'multipart/form-data'}}); 
          setResultadoImportacion(r.data); cargarDatos(); setArchivoCSV(null); enqueueSnackbar("Proceso terminado", {variant:'info'});
      }catch(e){ enqueueSnackbar("Error al importar", {variant:'error'}); } setLoading(false); 
  };
  
  const handleGuardarUsuario = async () => {
      const token = localStorage.getItem('token');
      const payload = { username: formUser.username, email: formUser.email, first_name: formUser.nombre, telefono: formUser.telefono, rol: tipoUsuario==='guardia'?'Guardia de Seguridad':'Residente', casa: formUser.casa_id };
      if (formUser.password) payload.password = formUser.password;
      try {
          if (isEditingUser) await api.patch(`/api/usuarios/${formUser.id}/`, payload, { headers: { 'Authorization': `Token ${token}` } });
          else { if (!formUser.password) return enqueueSnackbar("Contraseña obligatoria", {variant:'warning'}); await api.post('/api/usuarios/', payload, { headers: { 'Authorization': `Token ${token}` } }); }
          setOpenUsuario(false); cargarDatos(); enqueueSnackbar("Usuario guardado", {variant:'success'});
      } catch (error) { enqueueSnackbar("Error al guardar usuario", {variant:'error'}); }
  };

  const handleBorrarUsuario = async (id) => { if(confirm("¿Eliminar usuario?")) { await api.delete(`/api/usuarios/${id}/`, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); cargarDatos(); enqueueSnackbar("Usuario eliminado", {variant:'success'}); }};
  const handleBorrarPersonal = async (id) => { if(confirm("¿Dar de baja?")) { await api.delete(`/api/trabajadores/${id}/`, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); cargarPersonal(); enqueueSnackbar("Baja procesada", {variant:'success'}); }};
  const handleCrearCalle = async () => { if(nombreCalle) { await api.post('/api/calles/', { nombre: nombreCalle }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Calle agregada", {variant:'success'}); setNombreCalle(''); setOpenCalle(false); cargarDatos(); }};
  
  const handleCrearCasa = async () => { 
      if(!formCasa.calle_id) return enqueueSnackbar("Falta la calle", {variant:'warning'}); 
      if(!fraccSeleccionado) return enqueueSnackbar("Selecciona un fraccionamiento arriba", {variant:'warning'});
      try {
        await api.post('/api/casas/', { calle: formCasa.calle_id, numero_exterior: formCasa.numero, saldo_pendiente: formCasa.saldo, fraccionamiento: fraccSeleccionado }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }}); 
        enqueueSnackbar("Casa creada", {variant:'success'}); setOpenCasa(false); cargarDatos(); 
      } catch(e) { enqueueSnackbar("Error al crear casa", {variant:'error'}); }
  };
  
  const handleValidarPago = async (id, accion) => { await api.post(`/api/pagos/${id}/${accion}/`, {}, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Pago procesado", {variant:'success'}); cargarContabilidad(); cargarDatos(); };
  const handleCargoMasivo = async () => { if(!confirm("¿Aplicar cargo masivo?")) return; await api.post('/api/pagos/cargo_masivo/', { monto: montoExtra, concepto: conceptoExtra }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Cargos aplicados", {variant:'success'}); cargarDatos(); };
  const handleRegistrarEgreso = async () => { await api.post('/api/egresos/', { tipo: formEgreso.tipo_id, monto: formEgreso.monto, descripcion: formEgreso.descripcion }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Gasto registrado", {variant:'success'}); cargarContabilidad(); };
  
  const enviarWhatsApp = (tel, nom, sal) => { if(!tel) return enqueueSnackbar("Sin teléfono", {variant:'warning'}); let n=tel.replace(/\D/g,''); if(n.length===10) n='52'+n; let m=sal>0?`Hola ${nom}, saldo pendiente $${sal}`:`Hola ${nom}`; window.open(`https://wa.me/${n}?text=${encodeURIComponent(m)}`,'_blank'); };
  
  const cargarContabilidad = async () => { 
      try { const [t,e,p] = await Promise.all([ api.get('/api/tipos-egresos/',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}), api.get('/api/egresos/',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}), api.get('/api/pagos/?estado=PENDIENTE',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}) ]); 
      setTiposEgresos(t.data.results || t.data); setListaEgresos(e.data.results || e.data); setPagosPendientes(p.data.results || p.data); } catch(x){} 
  };
  
  const cargarHistorial = async () => { 
      if(!fechaInicio || !fechaFin) return enqueueSnackbar("Fechas requeridas", {variant:'warning'}); 
      try { 
          const [resTrab, resProv] = await Promise.all([ api.get(`/api/accesos-trabajadores/?inicio=${fechaInicio}&fin=${fechaFin}`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }), api.get(`/api/visitas/?inicio=${fechaInicio}&fin=${fechaFin}&tipo=PROVEEDOR`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }) ]); 
          const datosTrab = resTrab.data.results || resTrab.data;
          const datosProv = resProv.data.results || resProv.data;
          const eventosTrab = datosTrab.map(t => ({ id: `t-${t.id}`, fecha: t.fecha_entrada, tipo: 'TRABAJADOR', nombre: t.nombre, detalle: `Casa ${t.casa}`, salida: t.fecha_salida })); 
          const eventosProv = datosProv.map(p => ({ id: `p-${p.id}`, fecha: p.fecha_llegada, tipo: 'PROVEEDOR', nombre: p.nombre_visitante, detalle: p.empresa, salida: p.fecha_salida_real })); 
          setHistorialAccesos([...eventosTrab, ...eventosProv].sort((a,b) => new Date(b.fecha) - new Date(a.fecha))); 
      } catch(e) { enqueueSnackbar("Error historial", {variant:'error'}); } 
  };
  
  const descargarReporteAccesos = async () => { const token = localStorage.getItem('token'); const r = await api.get(`/api/reporte-accesos/?inicio=${fechaInicio}&fin=${fechaFin}`, { headers: { 'Authorization': `Token ${token}` }, responseType: 'blob' }); const url = window.URL.createObjectURL(new Blob([r.data])); const l = document.createElement('a'); l.href = url; l.download = `Accesos.pdf`; l.click(); };
  const abrirModalUsuario = (tipo, u=null) => { setTipoUsuario(tipo); if(u){ setIsEditingUser(true); setFormUser({id:u.id, username:u.username, password:'', email:u.email, nombre:u.first_name||'', telefono:u.telefono||'', casa_id:u.casa||''}); }else{ setIsEditingUser(false); setFormUser({id:null, username:'', password:'', email:'', nombre:'', telefono:'', casa_id:''}); } setOpenUsuario(true); };
  const descargarPlantilla = () => { const h="username,password,email,nombre,apellido,telefono,rol,calle,numero_casa"; const e="juan,123,mail@x.com,Juan,Perez,6181234,Residente,Calle 1,10"; const u=encodeURI("data:text/csv;charset=utf-8,"+h+"\n"+e); const l=document.createElement("a"); l.href=u; l.download="plantilla.csv"; document.body.appendChild(l); l.click(); };

  const KpiCard = ({ title, value, subtitle, icon, color }) => (
    <Card elevation={4} sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>{value}</Typography>
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
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 2, display:{xs:'none', sm:'block'} }}>ADMINISTRACIÓN</Typography>
          <Box sx={{ flexGrow: 1, display:'flex', alignItems:'center', bgcolor:'rgba(255,255,255,0.1)', borderRadius:1, px:2, py:0.5 }}>
              <DomainIcon sx={{color:'white', mr:1}}/>
              <FormControl variant="standard" sx={{ minWidth: 200 }}>
                  <Select value={fraccSeleccionado} onChange={(e) => isSuperUser && setFraccSeleccionado(e.target.value)} disableUnderline disabled={!isSuperUser} sx={{ color: 'white', fontWeight:'bold', '& .MuiSvgIcon-root': { color: isSuperUser ? 'white' : 'transparent' } }} displayEmpty>
                    <MenuItem value="" disabled>Seleccionar Comunidad...</MenuItem>
                    {fraccionamientos.map(f => <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>)}
                  </Select>
              </FormControl>
              {isSuperUser && <IconButton onClick={()=>setOpenFracc(true)} sx={{ml:1, color:'#4fc3f7'}} title="Crear Nuevo"><AddCircleOutlineIcon/></IconButton>}
          </Box>
          <Button color="error" variant="contained" size="small" onClick={()=>{localStorage.clear(); navigate('/');}} sx={{ml:2}}>Salir</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 5, mb: 5, flexGrow: 1 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1e293b' }}>
                Panel: {fraccionamientos.find(f=>f.id===fraccSeleccionado)?.nombre || "Cargando..."}
            </Typography>
            <Grid container spacing={2}>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#4caf50' }} startIcon={<CloudUploadIcon />} onClick={() => setOpenImportar(true)}>Importar</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#2e7d32' }} startIcon={<GroupIcon />} onClick={() => setOpenDirectorio(true)}>Usuarios</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#546e7a' }} startIcon={<AddRoadIcon />} onClick={() => setOpenCalle(true)}>Calles</Button></Grid>
                <Grid size="auto"><Button variant="contained" color="primary" startIcon={<AddHomeIcon />} onClick={() => setOpenCasa(true)}>Casa</Button></Grid>
                <Grid size="auto"><Button variant="contained" color="info" startIcon={<PersonAddIcon />} onClick={() => abrirModalUsuario('residente')}>+ Vecino</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#455a64' }} startIcon={<LocalPoliceIcon />} onClick={() => abrirModalUsuario('guardia')}>+ Guardia</Button></Grid>
                <Grid size={{ xs: 12, md: 'grow' }} sx={{display:{xs:'none', md:'block'}}} />
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#795548' }} startIcon={<EngineeringIcon />} onClick={() => {setOpenPersonal(true); cargarPersonal();}}>Personal</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#7b1fa2' }} startIcon={<ForumIcon />} onClick={() => navigate('/comunidad')}>Comunidad</Button></Grid>
                <Grid size="auto"><Button variant="contained" color="warning" startIcon={<AccountBalanceWalletIcon />} onClick={() => {setOpenContabilidad(true); cargarContabilidad();}}>Finanzas</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#00695c' }} startIcon={<StorefrontIcon />} onClick={() => navigate('/directorio')}>Directorio</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#0277bd' }} startIcon={<TrendingUpIcon />} onClick={() => navigate('/reportes')}>Reportes</Button></Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Deuda Total" value={`$${stats.deudaTotal.toLocaleString()}`} subtitle="Pendiente" icon={<AttachMoneyIcon />} color="#e53935"/></Grid>
          <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Morosidad" value={stats.casasConDeuda} subtitle="Casas con deuda" icon={<ReportProblemIcon />} color="#fb8c00"/></Grid>
          <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Propiedades" value={stats.totalCasas} subtitle="Registradas" icon={<HomeIcon />} color="#1976d2"/></Grid>
        </Grid>

        <Paper sx={{ height: 600, width: '100%', p: 2 }}>
          <Typography variant="h6" gutterBottom color="primary">Padrón de Propiedades</Typography>
          <DataGrid rows={casasFiltradas} columns={columnasCasas} pageSize={10} rowsPerPageOptions={[10, 20, 50]} disableSelectionOnClick loading={loading} />
        </Paper>
      </Container>

      {/* --- MODALES --- */}
      <Dialog open={openFracc} onClose={()=>setOpenFracc(false)}><DialogTitle>Nuevo Fraccionamiento</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nombre" fullWidth value={nombreNuevoFracc} onChange={(e)=>setNombreNuevoFracc(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenFracc(false)}>Cancelar</Button><Button onClick={handleCrearFraccionamiento} variant="contained">Crear</Button></DialogActions></Dialog>
      <Dialog open={openImportar} onClose={()=>setOpenImportar(false)} fullWidth maxWidth="sm"><DialogTitle sx={{bgcolor:'#4caf50', color:'white'}}>Importar</DialogTitle><DialogContent sx={{mt:2}}><Button startIcon={<DownloadIcon/>} onClick={descargarPlantilla}>Descargar Plantilla</Button><Button component="label" variant="contained" fullWidth startIcon={<UploadFileIcon/>} sx={{mt:2}}>{archivoCSV ? archivoCSV.name : "Subir CSV"}<input type="file" hidden accept=".csv" onChange={(e)=>setArchivoCSV(e.target.files[0])} /></Button>{resultadoImportacion && <Box sx={{mt:2, p:2, bgcolor:'#e8f5e9'}}>{resultadoImportacion.mensaje}</Box>}</DialogContent><DialogActions><Button onClick={()=>setOpenImportar(false)}>Cerrar</Button><Button onClick={handleSubirCSV} variant="contained" color="success" disabled={!archivoCSV}>Procesar</Button></DialogActions></Dialog>
      
      <Dialog open={openDirectorio} onClose={() => setOpenDirectorio(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#2e7d32', color: 'white'}}>Directorio de Usuarios</DialogTitle><DialogContent><Tabs value={tabDirectorio} onChange={(e,v)=>setTabDirectorio(v)} centered sx={{mb:2}}><Tab label="Residentes" /><Tab label="Guardias / Staff" /></Tabs><Box sx={{ height: 400, width: '100%' }}><DataGrid rows={usuarios.filter(u => tabDirectorio === 0 ? (!u.rol || u.rol.toLowerCase().includes('residente')) : (u.rol && u.rol.toLowerCase().includes('guardia')))} columns={columnasUsuarios} pageSize={5} /></Box></DialogContent><DialogActions><Button onClick={() => setOpenDirectorio(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openUsuario} onClose={()=>setOpenUsuario(false)}><DialogTitle>Usuario</DialogTitle><DialogContent><TextField margin="dense" label="Nombre" fullWidth value={formUser.nombre} onChange={(e)=>setFormUser({...formUser, nombre:e.target.value})}/><TextField margin="dense" label="Usuario" fullWidth value={formUser.username} onChange={(e)=>setFormUser({...formUser, username:e.target.value})}/><TextField margin="dense" label="Password" type="password" fullWidth value={formUser.password} onChange={(e)=>setFormUser({...formUser, password:e.target.value})}/><TextField margin="dense" label="Email" fullWidth value={formUser.email} onChange={(e)=>setFormUser({...formUser, email:e.target.value})}/>{tipoUsuario==='residente' && (<FormControl fullWidth margin="dense"><InputLabel>Casa</InputLabel><Select value={formUser.casa_id} onChange={(e)=>setFormUser({...formUser, casa_id:e.target.value})}>{casasFiltradas.map(c=><MenuItem key={c.id} value={c.id}>{c.calle_nombre} #{c.numero_exterior}</MenuItem>)}</Select></FormControl>)}</DialogContent><DialogActions><Button onClick={()=>setOpenUsuario(false)}>Cancelar</Button><Button onClick={handleGuardarUsuario}>Guardar</Button></DialogActions></Dialog>
      <Dialog open={openCasa} onClose={() => setOpenCasa(false)}><DialogTitle>Nueva Casa</DialogTitle><DialogContent><FormControl fullWidth margin="dense"><InputLabel>Calle</InputLabel><Select value={formCasa.calle_id} onChange={(e) => setFormCasa({...formCasa, calle_id: e.target.value})}>{calles.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}</Select></FormControl><TextField margin="dense" label="Número" fullWidth onChange={(e) => setFormCasa({...formCasa, numero: e.target.value})} /></DialogContent><DialogActions><Button onClick={() => setOpenCasa(false)}>Cancelar</Button><Button onClick={handleCrearCasa}>Guardar</Button></DialogActions></Dialog>
      <Dialog open={openCalle} onClose={()=>setOpenCalle(false)}><DialogTitle>Nueva Calle</DialogTitle><DialogContent><TextField fullWidth label="Nombre" value={nombreCalle} onChange={(e)=>setNombreCalle(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenCalle(false)}>Cerrar</Button><Button onClick={handleCrearCalle}>Crear</Button></DialogActions></Dialog>
      <Dialog open={openContabilidad} onClose={() => setOpenContabilidad(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#ed6c02', color: 'white'}}>Centro Financiero</DialogTitle><DialogContent><Tabs value={tabContabilidad} onChange={(e,v)=>setTabContabilidad(v)} centered sx={{mb:2}}><Tab label="Validar Pagos" /><Tab label="Gastos" /><Tab label="Cobro Extra" /></Tabs>{tabContabilidad === 0 && (<Box>{pagosPendientes.length===0 ? <Alert severity="success">Todo al día</Alert> : (<Table size="small"><TableHead><TableRow><TableCell>Casa</TableCell><TableCell>Monto</TableCell><TableCell>Foto</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{pagosPendientes.map(p=>(<TableRow key={p.id}><TableCell>Casa {p.casa}</TableCell><TableCell>${p.monto}</TableCell><TableCell>{p.comprobante ? <a href={p.comprobante} target="_blank">Ver</a> : '-'}</TableCell><TableCell><Button size="small" color="success" onClick={()=>handleValidarPago(p.id,'aprobar')}>OK</Button><Button size="small" color="error" onClick={()=>handleValidarPago(p.id,'rechazar')}>X</Button></TableCell></TableRow>))}</TableBody></Table>)}</Box>)}{tabContabilidad === 1 && (<Box><Box display="flex" gap={2} mb={2}><Select size="small" value={formEgreso.tipo_id} onChange={(e)=>setFormEgreso({...formEgreso, tipo_id:e.target.value})}>{tiposEgresos.map(t=><MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}</Select><TextField size="small" label="Monto" type="number" onChange={(e)=>setFormEgreso({...formEgreso, monto:e.target.value})} /><Button variant="contained" onClick={handleRegistrarEgreso}>Registrar</Button></Box><Table size="small"><TableBody>{listaEgresos.map(e=><TableRow key={e.id}><TableCell>{e.fecha_pago}</TableCell><TableCell>{e.nombre_gasto}</TableCell><TableCell>-${e.monto}</TableCell></TableRow>)}</TableBody></Table></Box>)}{tabContabilidad === 2 && (<Box sx={{textAlign:'center', p:3}}><Typography color="error">Cobro Masivo</Typography><TextField label="Concepto" value={conceptoExtra} onChange={(e)=>setConceptoExtra(e.target.value)} sx={{m:1}}/><TextField label="Monto" type="number" value={montoExtra} onChange={(e)=>setMontoExtra(e.target.value)} sx={{m:1}}/><Button variant="contained" color="error" onClick={handleCargoMasivo}>Aplicar</Button></Box>)}</DialogContent><DialogActions><Button onClick={()=>setOpenContabilidad(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openPersonal} onClose={()=>setOpenPersonal(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#5d4037', color: 'white'}}>Personal Externo</DialogTitle><DialogContent><Box sx={{display:'flex', gap:1, bgcolor:'#f5f5f5', p:2, mb:2, borderRadius:1}}><TextField type="date" size="small" InputLabelProps={{shrink:true}} label="Inicio" onChange={(e)=>setFechaInicio(e.target.value)} /><TextField type="date" size="small" InputLabelProps={{shrink:true}} label="Fin" onChange={(e)=>setFechaFin(e.target.value)} /><Button variant="contained" color="warning" size="small" onClick={cargarHistorial}>Filtrar</Button><Button variant="outlined" startIcon={<PictureAsPdfIcon/>} onClick={descargarReporteAccesos}>PDF</Button></Box><Tabs value={tabPersonal} onChange={(e,v)=>setTabPersonal(v)} centered sx={{mb:2}}><Tab label="Padrón" /><Tab label="Historial" /></Tabs>{tabPersonal === 0 && (<TableContainer component={Paper}><Table size="small"><TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Nombre</TableCell><TableCell>Patrón</TableCell><TableCell>Teléfono</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{listaTrabajadores.map(t => (<TableRow key={t.id}><TableCell>{t.nombre_completo}</TableCell><TableCell>{t.casa_info}</TableCell><TableCell>{t.telefono}</TableCell><TableCell><IconButton color="error" size="small" onClick={() => handleBorrarPersonal(t.id)}><DeleteIcon/></IconButton></TableCell></TableRow>))}</TableBody></Table></TableContainer>)}{tabPersonal === 1 && (<TableContainer component={Paper} sx={{maxHeight: 450}}><Table stickyHeader size="small"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Tipo</TableCell><TableCell>Nombre</TableCell><TableCell>Detalle</TableCell><TableCell>Salida</TableCell></TableRow></TableHead><TableBody>{historialAccesos.map((h) => (<TableRow key={h.id}><TableCell>{new Date(h.fecha).toLocaleString()}</TableCell><TableCell><Chip label={h.tipo} size="small"/></TableCell><TableCell>{h.nombre}</TableCell><TableCell>{h.detalle}</TableCell><TableCell>{h.salida ? new Date(h.salida).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</TableCell></TableRow>))}</TableBody></Table></TableContainer>)}</DialogContent><DialogActions><Button onClick={()=>setOpenPersonal(false)}>Cerrar</Button></DialogActions></Dialog>

      <Footer />
    </Box>
  );
}

export default AdminPanel;