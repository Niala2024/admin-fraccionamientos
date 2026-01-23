import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, AppBar, Toolbar, Card, CardContent, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, 
  FormControl, Tab, Tabs, Alert, IconButton, Stack
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
import KeyIcon from '@mui/icons-material/Key'; // ✅ ICONO DE LLAVE

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import Footer from '../components/Footer';

// LISTA DE CATEGORÍAS
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
  
  const [stats, setStats] = useState({ deudaTotal: 0, casasConDeuda: 0, totalCasas: 0 });

  // Modales
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
  
  // ✅ MODAL PASSWORD
  const [openPassword, setOpenPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: null, username: '', newPassword: '' });

  const [fechaNovedades, setFechaNovedades] = useState(new Date().toISOString().split('T')[0]);
  const [listaNovedades, setListaNovedades] = useState([]);

  // Scanner Data
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
  
  // Usuarios
  const [formUser, setFormUser] = useState({ id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState(''); // Solo para usuario nuevo
  
  // Egresos
  const [formEgreso, setFormEgreso] = useState({ tipo_id: '', monto: '', descripcion: '' });

  // Servicios
  const [formServicio, setFormServicio] = useState({ categoria: '', nombre: '', telefono: '', descripcion: '' });

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
      
      const dataCasas = resCasas.data.results || resCasas.data;
      setCasas(Array.isArray(dataCasas) ? dataCasas : []);

      const dataCalles = resCalles.data.results || resCalles.data;
      setCalles(Array.isArray(dataCalles) ? dataCalles : []);

      const dataUsers = resUsers.data.results || resUsers.data;
      setUsuarios(Array.isArray(dataUsers) ? dataUsers : []);
      
      setLoading(false);
    } catch (e) { 
        if(e.response?.status===401) {
            enqueueSnackbar("Tu sesión ha expirado. Ingresa nuevamente.", { variant: 'warning' });
            localStorage.clear();
            navigate('/');
        } else {
            console.error(e);
        }
        setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [navigate]);

  const cargarNovedadesDia = async () => {
      if(!fechaNovedades) return;
      try {
          const res = await api.get(`/api/reportes-diarios/?fecha=${fechaNovedades}`, { 
              headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } 
          });
          setListaNovedades(res.data.results || res.data);
      } catch(e) {
          enqueueSnackbar("Error cargando novedades", {variant: 'error'});
      }
  };

  useEffect(() => { if (openNovedades) cargarNovedadesDia(); }, [fechaNovedades, openNovedades]);

  const handleImprimirNovedades = () => {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Reporte de Novedades</title>');
      printWindow.document.write('<style>body{font-family: Arial, sans-serif;} table {width: 100%; border-collapse: collapse; margin-top: 20px;} th, td {border: 1px solid #ddd; padding: 12px; text-align: left;} th {background-color: #f2f2f2;} h1, h3 {text-align: center; color: #333;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h1>Bitácora de Operaciones</h1>`);
      printWindow.document.write(`<h3>Fecha: ${fechaNovedades}</h3>`);
      printWindow.document.write('<table><thead><tr><th>Hora</th><th>Guardia</th><th>Novedad / Reporte</th></tr></thead><tbody>');
      listaNovedades.forEach(n => {
          printWindow.document.write(`<tr><td>${new Date(n.fecha).toLocaleTimeString()}</td><td>${n.guardia_nombre || 'N/A'}</td><td>${n.mensaje}</td></tr>`);
      });
      printWindow.document.write('</tbody></table>');
      printWindow.document.write('<div style="margin-top: 50px; text-align: center;"><p>__________________________</p><p>Firma Supervisión</p></div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
  };

  const cargarServicios = async () => {
      try {
          const res = await api.get('/api/servicios/', { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } });
          setListaServicios(res.data.results || res.data);
      } catch(e) { console.error(e); }
  };

  const handleCrearServicio = async () => {
      if(!formServicio.nombre || !formServicio.telefono || !formServicio.categoria) return enqueueSnackbar("Todos los campos son requeridos", {variant:'warning'});
      try {
          await api.post('/api/servicios/', formServicio, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } });
          enqueueSnackbar("Servicio añadido", {variant:'success'});
          setFormServicio({ categoria: '', nombre: '', telefono: '', descripcion: '' });
          cargarServicios();
      } catch(e) { enqueueSnackbar("Error al crear servicio", {variant:'error'}); }
  };

  const handleBorrarServicio = async (id) => {
      if(!confirm("¿Borrar este servicio del directorio?")) return;
      try {
          await api.delete(`/api/servicios/${id}/`, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } });
          enqueueSnackbar("Eliminado", {variant:'success'});
          cargarServicios();
      } catch(e) { enqueueSnackbar("Error al eliminar", {variant:'error'}); }
  };

  // --- ESCANER ---
  useEffect(() => {
      let scanner = null;
      if (openScanner) {
          const timer = setTimeout(() => {
              const element = document.getElementById("reader-admin");
              if (element && !scannerRef.current) {
                  try {
                      scanner = new Html5QrcodeScanner("reader-admin", { fps: 5, qrbox: {width: 250, height: 250} }, false);
                      scanner.render(onScanSuccess, (e)=>{});
                      scannerRef.current = scanner;
                  } catch (e) { console.error(e); }
              }
          }, 300);
          return () => clearTimeout(timer);
      } else {
          if (scannerRef.current) {
              scannerRef.current.clear().catch(e => console.warn(e));
              scannerRef.current = null;
          }
      }
  }, [openScanner]);

  const onScanSuccess = async (decodedText) => {
      if(scanResult) return;
      try {
          if(scannerRef.current) scannerRef.current.pause();
          const res = await api.post('/api/accesos-trabajadores/escanear_qr/', { codigo: decodedText }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } });
          setScanResult(res.data);
          enqueueSnackbar(res.data.mensaje, { variant: res.data.tipo.includes('ENTRADA') ? 'success' : 'info' });
          setTimeout(() => { setScanResult(null); if(scannerRef.current) scannerRef.current.resume(); }, 3000);
      } catch (error) {
          enqueueSnackbar(error.response?.data?.error || "Error leyendo QR", { variant: 'error' });
          setTimeout(() => { if(scannerRef.current) scannerRef.current.resume(); }, 2000);
      }
  };

  // Cálculos y utilidades
  const listaCasasSegura = Array.isArray(casas) ? casas : [];
  const casasFiltradas = listaCasasSegura.filter(c => !fraccSeleccionado || c.fraccionamiento === fraccSeleccionado);
  
  useEffect(() => {
      const deuda = casasFiltradas.reduce((acc, c) => acc + parseFloat(c.saldo_pendiente || 0), 0);
      const morosos = casasFiltradas.filter(c => c.saldo_pendiente > 0).length;
      setStats({ deudaTotal: deuda, casasConDeuda: morosos, totalCasas: casasFiltradas.length });
  }, [casas, fraccSeleccionado]);

  const handleAbrirEmail = (email, nombre) => {
      if(!email) return enqueueSnackbar("Este vecino no tiene email registrado", { variant: 'warning' });
      setEmailData({ para: email, nombre: nombre, asunto: 'Aviso de Administración', mensaje: `Hola ${nombre},\n\nTe escribimos para informarte que...` });
      setOpenEmail(true);
  };

  const handleEnviarEmailReal = async () => {
      try {
          await api.post('/api/usuarios/enviar_correo_vecino/', { destinatario: emailData.para, asunto: emailData.asunto, mensaje: emailData.mensaje }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }});
          enqueueSnackbar("Correo enviado correctamente", { variant: 'success' }); setOpenEmail(false);
      } catch (error) { enqueueSnackbar("Error al enviar el correo", { variant: 'error' }); }
  };

  // ✅ FUNCIÓN PARA ABRIR MODAL DE PASSWORD
  const abrirModalPassword = (row) => {
      setPasswordData({ id: row.id, username: row.username, newPassword: '' });
      setOpenPassword(true);
  };

  // ✅ FUNCIÓN PARA GUARDAR NUEVA CONTRASEÑA
  const handleGuardarPassword = async () => {
      if(!passwordData.newPassword) return enqueueSnackbar("Escribe una contraseña", {variant:'warning'});
      try {
          await api.patch(`/api/usuarios/${passwordData.id}/`, { password: passwordData.newPassword }, { 
              headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } 
          });
          enqueueSnackbar("Contraseña actualizada correctamente", {variant:'success'});
          setOpenPassword(false);
      } catch (e) {
          enqueueSnackbar("Error al cambiar contraseña", {variant:'error'});
      }
  };

  const columnasCasas = [
    { field: 'calle_nombre', headerName: 'Calle', width: 150 },
    { field: 'numero_exterior', headerName: 'Número', width: 100 },
    { field: 'propietario_nombre', headerName: 'Propietario', width: 200 },
    { field: 'saldo_pendiente', headerName: 'Saldo', width: 130, renderCell: (params) => <Typography fontWeight="bold" color={params.value > 0 ? 'error' : 'success'}>${params.value}</Typography> },
    { field: 'acciones', headerName: 'Contacto', width: 150, renderCell: (params) => { const datos = params.row || params; return datos.propietario ? (<Box><IconButton color="success" onClick={() => enviarWhatsApp(datos.telefono_propietario, datos.propietario_nombre, datos.saldo_pendiente)}><WhatsAppIcon /></IconButton><IconButton color="primary" onClick={() => handleAbrirEmail(datos.email_propietario, datos.propietario_nombre)}><EmailIcon /></IconButton></Box>) : null; } }
  ];

  // ✅ COLUMNAS DE USUARIO CON BOTÓN DE LLAVE
  const columnasUsuarios = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nombre_completo', headerName: 'Nombre Completo', width: 200 },
    { field: 'telefono', headerName: 'Teléfono', width: 150 }, 
    { field: 'username', headerName: 'Usuario', width: 150 },
    { field: 'rol', headerName: 'Rol', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'acciones', headerName: 'Acciones', width: 180, renderCell: (params) => (
        <>
            <IconButton size="small" color="primary" onClick={() => abrirModalUsuario(tabDirectorio === 0 ? 'residente' : 'guardia', params.row)} title="Editar"><EditIcon /></IconButton>
            <IconButton size="small" color="warning" onClick={() => abrirModalPassword(params.row)} title="Cambiar Contraseña"><KeyIcon /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleBorrarUsuario(params.row.id)} title="Borrar"><DeleteIcon /></IconButton>
        </>
    ) }
  ];

  const handleCrearFraccionamiento = async () => { if(!nombreNuevoFracc) return enqueueSnackbar("Escribe un nombre", {variant:'warning'}); try { await api.post('/api/fraccionamientos/', { nombre: nombreNuevoFracc }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Fraccionamiento creado", {variant:'success'}); setNombreNuevoFracc(''); setOpenFracc(false); cargarDatos(); } catch(e) { enqueueSnackbar("Error", {variant:'error'}); } };
  const handleActualizarCuota = async () => { if (!fraccSeleccionado || !nuevaCuota) return enqueueSnackbar("Ingresa un monto válido", {variant:'warning'}); try { await api.patch(`/api/fraccionamientos/${fraccSeleccionado}/`, { cuota_mensual: nuevaCuota }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }}); enqueueSnackbar("Cuota actualizada", { variant: 'success' }); setOpenCuota(false); cargarDatos(); } catch (error) { enqueueSnackbar("Error", { variant: 'error' }); } };
  const cargarPersonal = async () => { try { const res = await api.get('/api/trabajadores/', { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); setListaTrabajadores(res.data.results || res.data); } catch(e){} };
  const handleSubirCSV = async () => { if(!archivoCSV) return enqueueSnackbar("Selecciona archivo", {variant:'warning'}); const fd=new FormData(); fd.append('file',archivoCSV); setLoading(true); try{ const r=await api.post('/api/usuarios/importar_masivo/', fd, { headers:{'Authorization':`Token ${localStorage.getItem('token')}`,'Content-Type':'multipart/form-data'}}); setResultadoImportacion(r.data); cargarDatos(); setArchivoCSV(null); enqueueSnackbar("Proceso terminado", {variant:'info'}); }catch(e){ enqueueSnackbar("Error", {variant:'error'}); } setLoading(false); };
  
  // ✅ FUNCIÓN CORREGIDA Y BLINDADA PARA GUARDAR USUARIO
  const handleGuardarUsuario = async () => { 
      const token = localStorage.getItem('token'); 
      
      // Limpieza de datos críticos para evitar Error 400
      let casaLimpia = null;
      // Solo enviamos casa_id si es residente Y si el valor no está vacío
      if (tipoUsuario === 'residente' && formUser.casa_id) {
          casaLimpia = formUser.casa_id;
      }

      const payload = { 
          username: formUser.username, 
          email: formUser.email, 
          first_name: formUser.nombre, 
          last_name: formUser.apellido,
          telefono: formUser.telefono, 
          rol: tipoUsuario === 'guardia' ? 'Guardia de Seguridad' : 'Residente', 
          casa_id: casaLimpia 
      }; 

      try { 
          if (isEditingUser) {
              // Al editar, NO enviamos password en este endpoint (se usa el botón de llave)
              await api.patch(`/api/usuarios/${formUser.id}/`, payload, { headers: { 'Authorization': `Token ${token}` } }); 
          } else { 
              // Al crear nuevo, SÍ enviamos la password inicial
              if (!newUserPassword) return enqueueSnackbar("Password obligatoria para nuevo usuario", {variant:'warning'}); 
              payload.password = newUserPassword;
              await api.post('/api/usuarios/', payload, { headers: { 'Authorization': `Token ${token}` } }); 
          } 
          
          setOpenUsuario(false); 
          cargarDatos(); 
          enqueueSnackbar("Guardado correctamente", {variant:'success'}); 
      } catch (error) { 
          console.error(error); 
          enqueueSnackbar("Error al guardar. Verifica que el usuario no exista ya.", {variant:'error'}); 
      } 
  };

  async function handleBorrarUsuario(id) { if (confirm("¿Eliminar usuario?")) { await api.delete(`/api/usuarios/${id}/`, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); cargarDatos(); enqueueSnackbar("Eliminado", { variant: 'success' }); } }
  const handleBorrarPersonal = async (id) => { if(confirm("¿Dar de baja?")) { await api.delete(`/api/trabajadores/${id}/`, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); cargarPersonal(); enqueueSnackbar("Baja procesada", {variant:'success'}); }};
  const handleCrearCalle = async () => { if(nombreCalle) { await api.post('/api/calles/', { nombre: nombreCalle }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Calle agregada", {variant:'success'}); setNombreCalle(''); setOpenCalle(false); cargarDatos(); }};
  const handleCrearCasa = async () => { if(!formCasa.calle_id) return enqueueSnackbar("Falta calle", {variant:'warning'}); try { await api.post('/api/casas/', { calle: formCasa.calle_id, numero_exterior: formCasa.numero, saldo_pendiente: formCasa.saldo || 0, fraccionamiento: fraccSeleccionado }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }}); enqueueSnackbar("Casa creada", {variant:'success'}); setOpenCasa(false); cargarDatos(); } catch(e) { enqueueSnackbar("Error", {variant:'error'}); } };
  const handleValidarPago = async (id, accion) => { await api.post(`/api/pagos/${id}/${accion}/`, {}, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Procesado", {variant:'success'}); cargarContabilidad(); cargarDatos(); };
  const handleCargoMasivo = async () => { if(!montoExtra) return enqueueSnackbar("Ingresa un monto", {variant:'warning'}); if(!confirm("¿Aplicar cargo masivo?")) return; await api.post('/api/pagos/cargo_masivo/', { monto: montoExtra, concepto: conceptoExtra }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Aplicado", {variant:'success'}); cargarDatos(); };
  const handleRegistrarEgreso = async () => { if(!formEgreso.tipo_id || !formEgreso.monto) return enqueueSnackbar("Faltan datos", {variant:'warning'}); await api.post('/api/egresos/', { tipo: formEgreso.tipo_id, monto: formEgreso.monto, descripcion: formEgreso.descripcion }, { headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } }); enqueueSnackbar("Registrado", {variant:'success'}); cargarContabilidad(); };
  const enviarWhatsApp = (tel, nom, sal) => { if(!tel) return enqueueSnackbar("Sin teléfono", {variant:'warning'}); let n=tel.replace(/\D/g,''); if(n.length===10) n='52'+n; let m=sal>0?`Hola ${nom}, saldo pendiente $${sal}`:`Hola ${nom}`; window.open(`https://wa.me/${n}?text=${encodeURIComponent(m)}`,'_blank'); };
  const cargarContabilidad = async () => { try { const [t,e,p] = await Promise.all([ api.get('/api/tipos-egresos/',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}), api.get('/api/egresos/',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}), api.get('/api/pagos/?estado=PENDIENTE',{headers:{'Authorization':`Token ${localStorage.getItem('token')}`}}) ]); setTiposEgresos(t.data.results || t.data); setListaEgresos(e.data.results || e.data); setPagosPendientes(p.data.results || p.data); } catch(x){} };
  const cargarHistorial = async () => { if(!fechaInicio || !fechaFin) return enqueueSnackbar("Fechas requeridas", {variant:'warning'}); try { const [resTrab, resProv] = await Promise.all([ api.get(`/api/accesos-trabajadores/?inicio=${fechaInicio}&fin=${fechaFin}`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }), api.get(`/api/visitas/?inicio=${fechaInicio}&fin=${fechaFin}&tipo=PROVEEDOR`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }) ]); const datosTrab = resTrab.data.results || resTrab.data; const datosProv = resProv.data.results || resProv.data; const eventosTrab = datosTrab.map(t => ({ id: `t-${t.id}`, fecha: t.fecha_entrada, tipo: 'TRABAJADOR', nombre: t.nombre, detalle: `Casa ${t.casa}`, salida: t.fecha_salida })); const eventosProv = datosProv.map(p => ({ id: `p-${p.id}`, fecha: p.fecha_llegada, tipo: 'PROVEEDOR', nombre: p.nombre_visitante, detalle: p.empresa, salida: p.fecha_salida_real })); setHistorialAccesos([...eventosTrab, ...eventosProv].sort((a,b) => new Date(b.fecha) - new Date(a.fecha))); } catch(e) { enqueueSnackbar("Error historial", {variant:'error'}); } };
  const descargarReporteAccesos = async () => { const token = localStorage.getItem('token'); const r = await api.get(`/api/reporte-accesos/?inicio=${fechaInicio}&fin=${fechaFin}`, { headers: { 'Authorization': `Token ${token}` }, responseType: 'blob' }); const url = window.URL.createObjectURL(new Blob([r.data])); const l = document.createElement('a'); l.href = url; l.download = `Accesos.pdf`; l.click(); };
  const descargarPlantilla = () => { const h="username,password,email,nombre,apellido,telefono,rol,calle,numero_casa"; const e="juan,123,mail@x.com,Juan,Perez,6181234,Residente,Calle 1,10"; const u=encodeURI("data:text/csv;charset=utf-8,"+h+"\n"+e); const l=document.createElement("a"); l.href=u; l.download="plantilla.csv"; document.body.appendChild(l); l.click(); };
  
  const abrirModalUsuario = (tipo, u = null) => { 
    setTipoUsuario(tipo); 
    if (u) { 
        setIsEditingUser(true); 
        setFormUser({ 
            id: u.id, 
            username: u.username, 
            email: u.email, 
            nombre: u.first_name || '', 
            apellido: u.last_name || '', 
            telefono: u.telefono || '', 
            casa_id: u.casa_id || u.casa || '' 
        }); 
        setNewUserPassword(''); // No se usa password al editar aqui
    } else { 
        setIsEditingUser(false); 
        setFormUser({ id: null, username: '', email: '', nombre: '', apellido: '', telefono: '', casa_id: '' }); 
        setNewUserPassword(''); // Limpio para nuevo
    } 
    setOpenUsuario(true); 
  };

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
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="secondary" startIcon={<QrCodeScannerIcon />} onClick={() => setOpenScanner(true)} sx={{ mr: 2, fontWeight: 'bold' }}>Escanear</Button>
          <Button variant="contained" sx={{ bgcolor: '#000', color: '#c084fc', border: '1px solid #c084fc', mr: 2 }} startIcon={<PolicyIcon />} onClick={() => navigate('/admin-vigilancia')}>Monitor C5</Button>
          <IconButton onClick={() => navigate('/mi-perfil')} color="inherit" sx={{mr:1}} title="Mi Perfil"><AccountCircleIcon /></IconButton>
          <Button color="error" variant="contained" size="small" onClick={()=>{localStorage.clear(); navigate('/');}}>Salir</Button>
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
                <Grid size={{ xs: 12, md: true }} sx={{display:{xs:'none', md:'block'}}} />
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#2e7d32', color: 'white' }} startIcon={<MonetizationOnIcon />} onClick={() => { const actual = fraccionamientos.find(f => f.id === fraccSeleccionado)?.cuota_mensual || 0; setNuevaCuota(actual); setOpenCuota(true); }}>Cuota Mensual</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#795548' }} startIcon={<EngineeringIcon />} onClick={() => {setOpenPersonal(true); cargarPersonal();}}>Personal</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#7b1fa2' }} startIcon={<ForumIcon />} onClick={() => navigate('/comunidad')}>Comunidad</Button></Grid>
                <Grid size="auto"><Button variant="contained" color="warning" startIcon={<AccountBalanceWalletIcon />} onClick={() => {setOpenContabilidad(true); cargarContabilidad();}}>Finanzas</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#00695c' }} startIcon={<StorefrontIcon />} onClick={() => {setOpenServicios(true); cargarServicios();}}>Directorio</Button></Grid>
                <Grid size="auto"><Button variant="contained" sx={{ bgcolor: '#0277bd' }} startIcon={<TrendingUpIcon />} onClick={() => navigate('/reportes')}>Reportes</Button></Grid>
                
                <Grid size="auto">
                    <Button 
                        variant="contained" 
                        sx={{ bgcolor: '#f57c00' }} 
                        startIcon={<AssignmentIcon />} 
                        onClick={() => setOpenNovedades(true)}
                    >
                        Bitácora Diario
                    </Button>
                </Grid>
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
      <Dialog open={openScanner} onClose={() => setOpenScanner(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{bgcolor: '#333', color: 'white'}}>Escáner de Acceso</DialogTitle>
          <DialogContent sx={{ textAlign: 'center', p: 3 }}><div id="reader-admin" style={{ width: '100%', minHeight: '300px' }}></div>{scanResult && (<Card sx={{ mt: 2, bgcolor: scanResult.tipo.includes('ENTRADA') ? '#e8f5e9' : '#ffebee' }}><CardContent><Avatar src={scanResult.foto} sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }} /><Typography variant="h5" fontWeight="bold">{scanResult.nombre}</Typography><Chip label={scanResult.puesto || 'Personal'} sx={{ mt: 1 }} /><Typography variant="h4" color={scanResult.tipo.includes('ENTRADA') ? 'success.main' : 'error.main'} fontWeight="bold" sx={{ mt: 2 }}>{scanResult.tipo.includes('ENTRADA') ? '✅ ENTRADA' : '👋 SALIDA'}</Typography><Typography variant="body2" sx={{ mt: 1 }}>Casa: {scanResult.casa}</Typography><Typography variant="caption">{new Date(scanResult.hora).toLocaleTimeString()}</Typography></CardContent></Card>)}</DialogContent><DialogActions><Button onClick={() => setOpenScanner(false)} variant="contained" color="error">Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openServicios} onClose={() => setOpenServicios(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{bgcolor: '#00695c', color: 'white'}}>Directorio de Servicios</DialogTitle>
          <DialogContent>
              <Tabs value={filtroCategoria} onChange={(e, v) => setFiltroCategoria(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Todos" value="Todos" />
                  {CATEGORIAS_SERVICIOS.map(cat => <Tab key={cat} label={cat} value={cat} />)}
              </Tabs>
              <Paper sx={{p:2, mb:2, bgcolor:'#e0f2f1'}}>
                  <Typography variant="subtitle2" sx={{mb:1, fontWeight:'bold', color:'#00695c'}}>Nuevo Servicio</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                      <FormControl size="small" sx={{minWidth: 150, flexGrow:1}}>
                          <InputLabel>Categoría</InputLabel>
                          <Select value={formServicio.categoria} label="Categoría" onChange={(e)=>setFormServicio({...formServicio, categoria:e.target.value})}>{CATEGORIAS_SERVICIOS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select>
                      </FormControl>
                      <TextField size="small" label="Nombre" sx={{flexGrow:2}} value={formServicio.nombre} onChange={(e)=>setFormServicio({...formServicio, nombre:e.target.value})} />
                      <TextField size="small" label="Teléfono" sx={{flexGrow:1}} value={formServicio.telefono} onChange={(e)=>setFormServicio({...formServicio, telefono:e.target.value})} />
                      <Button variant="contained" onClick={handleCrearServicio} sx={{bgcolor:'#004d40'}}>Agregar</Button>
                  </Box>
              </Paper>
              <TableContainer component={Paper} sx={{maxHeight: 400}}>
                  <Table size="small" stickyHeader><TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Categoría</TableCell><TableCell>Nombre</TableCell><TableCell>Teléfono</TableCell><TableCell align="center">Acción</TableCell></TableRow></TableHead><TableBody>{listaServicios.filter(s => filtroCategoria === 'Todos' || s.categoria === filtroCategoria).map(s => (<TableRow key={s.id}><TableCell><Chip icon={<BuildIcon sx={{fontSize:16}}/>} label={s.categoria} size="small" sx={{bgcolor:'#b2dfdb'}} /></TableCell><TableCell>{s.nombre}</TableCell><TableCell>{s.telefono}</TableCell><TableCell align="center"><IconButton color="success" size="small" onClick={()=>enviarWhatsApp(s.telefono, s.nombre, 0)}><WhatsAppIcon/></IconButton><IconButton color="error" size="small" onClick={()=>handleBorrarServicio(s.id)}><DeleteIcon/></IconButton></TableCell></TableRow>))}{listaServicios.filter(s => filtroCategoria === 'Todos' || s.categoria === filtroCategoria).length === 0 && (<TableRow><TableCell colSpan={4} align="center" sx={{py:3}}>No hay servicios en esta categoría</TableCell></TableRow>)}</TableBody></Table>
              </TableContainer>
          </DialogContent>
          <DialogActions><Button onClick={() => setOpenServicios(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openNovedades} onClose={() => setOpenNovedades(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{ bgcolor: '#f57c00', color: 'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box display="flex" alignItems="center" gap={1}><AssignmentIcon/> Bitácora de Operaciones</Box>
              <TextField 
                  type="date" 
                  size="small" 
                  value={fechaNovedades} 
                  onChange={(e) => setFechaNovedades(e.target.value)}
                  sx={{ bgcolor: 'white', borderRadius: 1, input: { py: 1 } }}
              />
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5', minHeight: 400 }}>
              <TableContainer component={Paper} elevation={0}>
                  <Table stickyHeader>
                      <TableHead>
                          <TableRow>
                              <TableCell sx={{fontWeight:'bold', bgcolor:'#fff3e0'}}>Hora</TableCell>
                              <TableCell sx={{fontWeight:'bold', bgcolor:'#fff3e0'}}>Guardia</TableCell>
                              <TableCell sx={{fontWeight:'bold', bgcolor:'#fff3e0'}}>Reporte</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {listaNovedades.length === 0 ? (
                              <TableRow><TableCell colSpan={3} align="center" sx={{py:5, color:'gray'}}>No hay registros para esta fecha.</TableCell></TableRow>
                          ) : (
                              listaNovedades.map((n) => (
                                  <TableRow key={n.id} hover>
                                      <TableCell sx={{fontFamily:'monospace', color:'#d32f2f', fontWeight:'bold'}}>
                                          {new Date(n.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                      </TableCell>
                                      <TableCell>
                                          <Chip label={n.guardia_nombre} size="small" color="primary" variant="outlined"/>
                                      </TableCell>
                                      <TableCell>{n.mensaje}</TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              </TableContainer>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setOpenNovedades(false)}>Cerrar</Button>
              <Button onClick={handleImprimirNovedades} startIcon={<PrintIcon/>} color="secondary">Imprimir / PDF</Button>
              <Button onClick={cargarNovedadesDia} variant="contained">Actualizar</Button>
          </DialogActions>
      </Dialog>

      <Dialog open={openFracc} onClose={()=>setOpenFracc(false)}><DialogTitle>Nuevo Fraccionamiento</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Nombre" fullWidth value={nombreNuevoFracc} onChange={(e)=>setNombreNuevoFracc(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenFracc(false)}>Cancelar</Button><Button onClick={handleCrearFraccionamiento} variant="contained">Crear</Button></DialogActions></Dialog>
      <Dialog open={openImportar} onClose={()=>setOpenImportar(false)} fullWidth maxWidth="sm"><DialogTitle sx={{bgcolor:'#4caf50', color:'white'}}>Importar</DialogTitle><DialogContent sx={{mt:2}}><Button startIcon={<DownloadIcon/>} onClick={descargarPlantilla}>Descargar Plantilla</Button><Button component="label" variant="contained" fullWidth startIcon={<UploadFileIcon/>} sx={{mt:2}}>{archivoCSV ? archivoCSV.name : "Subir CSV"}<input type="file" hidden accept=".csv" onChange={(e)=>setArchivoCSV(e.target.files[0])} /></Button>{resultadoImportacion && <Box sx={{mt:2, p:2, bgcolor:'#e8f5e9'}}>{resultadoImportacion.mensaje}</Box>}</DialogContent><DialogActions><Button onClick={()=>setOpenImportar(false)}>Cerrar</Button><Button onClick={handleSubirCSV} variant="contained" color="success" disabled={!archivoCSV}>Procesar</Button></DialogActions></Dialog>
      <Dialog open={openCuota} onClose={() => setOpenCuota(false)}><DialogTitle>💲 Cuota de Mantenimiento</DialogTitle><DialogContent><Typography variant="body2" sx={{ mb: 2, mt: 1 }}>Define el monto mensual oficial.</Typography><TextField autoFocus margin="dense" label="Monto Mensual ($)" type="number" fullWidth value={nuevaCuota} onChange={(e) => setNuevaCuota(e.target.value)} /></DialogContent><DialogActions><Button onClick={() => setOpenCuota(false)}>Cancelar</Button><Button onClick={handleActualizarCuota} variant="contained" color="success">Actualizar Tarifa</Button></DialogActions></Dialog>
      <Dialog open={openEmail} onClose={() => setOpenEmail(false)} fullWidth maxWidth="sm"><DialogTitle>✉️ Enviar Correo a {emailData.nombre}</DialogTitle><DialogContent><TextField label="Para" fullWidth margin="dense" value={emailData.para} disabled /><TextField label="Asunto" fullWidth margin="dense" value={emailData.asunto} onChange={(e) => setEmailData({...emailData, asunto: e.target.value})} /><TextField label="Mensaje" fullWidth multiline rows={6} margin="dense" value={emailData.mensaje} onChange={(e) => setEmailData({...emailData, mensaje: e.target.value})} /></DialogContent><DialogActions><Button onClick={() => setOpenEmail(false)}>Cancelar</Button><Button onClick={handleEnviarEmailReal} variant="contained" color="primary" startIcon={<EmailIcon/>}>Enviar</Button></DialogActions></Dialog>
      
      {/* ✅ MODAL DE DIRECTORIO DE USUARIOS (CON LLAVE) */}
      <Dialog open={openDirectorio} onClose={() => setOpenDirectorio(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#2e7d32', color: 'white'}}>Directorio de Usuarios</DialogTitle><DialogContent><Tabs value={tabDirectorio} onChange={(e,v)=>setTabDirectorio(v)} centered sx={{mb:2}}><Tab label="Residentes" /><Tab label="Guardias / Staff" /></Tabs><Box sx={{ height: 400, width: '100%' }}><DataGrid rows={usuarios.filter(u => tabDirectorio === 0 ? (!u.rol || u.rol.toLowerCase().includes('residente')) : (u.rol && u.rol.toLowerCase().includes('guardia')))} columns={columnasUsuarios} pageSize={5} /></Box></DialogContent><DialogActions><Button onClick={() => setOpenDirectorio(false)}>Cerrar</Button></DialogActions></Dialog>
      
      {/* ✅ MODAL EDITAR / CREAR USUARIO (SIN CAMPO PASSWORD CUANDO SE EDITA) */}
      <Dialog open={openUsuario} onClose={()=>setOpenUsuario(false)}>
          <DialogTitle>{isEditingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogContent>
              <TextField margin="dense" label="Nombre(s)" fullWidth value={formUser.nombre} onChange={(e)=>setFormUser({...formUser, nombre:e.target.value})}/>
              <TextField margin="dense" label="Apellidos" fullWidth value={formUser.apellido} onChange={(e)=>setFormUser({...formUser, apellido:e.target.value})}/>
              <TextField margin="dense" label="Usuario" fullWidth value={formUser.username} onChange={(e)=>setFormUser({...formUser, username:e.target.value})} autoComplete="off" />
              
              {/* SOLO MOSTRAMOS CAMPO PASSWORD SI ES NUEVO USUARIO */}
              {!isEditingUser && (
                  <TextField margin="dense" label="Contraseña Inicial" type="password" fullWidth value={newUserPassword} onChange={(e)=>setNewUserPassword(e.target.value)} autoComplete="new-password" />
              )}

              <TextField margin="dense" label="Email" fullWidth value={formUser.email} onChange={(e)=>setFormUser({...formUser, email:e.target.value})}/>
              <TextField margin="dense" label="Teléfono / WhatsApp" fullWidth value={formUser.telefono} onChange={(e)=>setFormUser({...formUser, telefono:e.target.value})}/>
              {tipoUsuario==='residente' && (<FormControl fullWidth margin="dense"><InputLabel>Casa</InputLabel><Select value={formUser.casa_id} onChange={(e)=>setFormUser({...formUser, casa_id:e.target.value})}><MenuItem value=""><em>Ninguna</em></MenuItem>{casasFiltradas.map(c=><MenuItem key={c.id} value={c.id}>{c.calle_nombre} #{c.numero_exterior}</MenuItem>)}</Select></FormControl>)}
          </DialogContent>
          <DialogActions><Button onClick={()=>setOpenUsuario(false)}>Cancelar</Button><Button onClick={handleGuardarUsuario} variant="contained">{isEditingUser ? 'Actualizar' : 'Guardar'}</Button></DialogActions>
      </Dialog>
      
      {/* ✅ NUEVO MODAL PARA CAMBIAR PASSWORD */}
      <Dialog open={openPassword} onClose={()=>setOpenPassword(false)}>
          <DialogTitle>Cambiar Contraseña: {passwordData.username}</DialogTitle>
          <DialogContent>
              <TextField 
                  autoFocus
                  margin="dense" 
                  label="Nueva Contraseña" 
                  type="password" 
                  fullWidth 
                  value={passwordData.newPassword} 
                  onChange={(e)=>setPasswordData({...passwordData, newPassword:e.target.value})} 
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={()=>setOpenPassword(false)}>Cancelar</Button>
              <Button onClick={handleGuardarPassword} variant="contained" color="warning">Cambiar</Button>
          </DialogActions>
      </Dialog>

      <Dialog open={openCasa} onClose={() => setOpenCasa(false)}><DialogTitle>Nueva Casa</DialogTitle><DialogContent><FormControl fullWidth margin="dense"><InputLabel>Calle</InputLabel><Select value={formCasa.calle_id} onChange={(e) => setFormCasa({...formCasa, calle_id: e.target.value})}>{calles.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}</Select></FormControl><TextField margin="dense" label="Número" fullWidth onChange={(e) => setFormCasa({...formCasa, numero: e.target.value})} /></DialogContent><DialogActions><Button onClick={() => setOpenCasa(false)}>Cancelar</Button><Button onClick={handleCrearCasa}>Guardar</Button></DialogActions></Dialog>
      <Dialog open={openCalle} onClose={()=>setOpenCalle(false)}><DialogTitle>Nueva Calle</DialogTitle><DialogContent><TextField fullWidth label="Nombre" value={nombreCalle} onChange={(e)=>setNombreCalle(e.target.value)} /></DialogContent><DialogActions><Button onClick={()=>setOpenCalle(false)}>Cerrar</Button><Button onClick={handleCrearCalle}>Crear</Button></DialogActions></Dialog>
      <Dialog open={openContabilidad} onClose={() => setOpenContabilidad(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#ed6c02', color: 'white'}}>Centro Financiero</DialogTitle><DialogContent><Tabs value={tabContabilidad} onChange={(e,v)=>setTabContabilidad(v)} centered sx={{mb:2}}><Tab label="Validar Pagos" /><Tab label="Gastos" /><Tab label="Cobro Extra" /></Tabs>{tabContabilidad === 0 && (<Box>{pagosPendientes.length===0 ? <Alert severity="success">Todo al día</Alert> : (<Table size="small"><TableHead><TableRow><TableCell>Casa</TableCell><TableCell>Monto</TableCell><TableCell>Foto</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{pagosPendientes.map(p=>(<TableRow key={p.id}><TableCell>Casa {p.casa}</TableCell><TableCell>${p.monto}</TableCell><TableCell>{p.comprobante ? <a href={p.comprobante} target="_blank">Ver</a> : '-'}</TableCell><TableCell><Button size="small" color="success" onClick={()=>handleValidarPago(p.id,'aprobar')}>OK</Button><Button size="small" color="error" onClick={()=>handleValidarPago(p.id,'rechazar')}>X</Button></TableCell></TableRow>))}</TableBody></Table>)}</Box>)}{tabContabilidad === 1 && (<Box><Box display="flex" gap={2} mb={2}><Select size="small" value={formEgreso.tipo_id} onChange={(e)=>setFormEgreso({...formEgreso, tipo_id:e.target.value})}>{tiposEgresos.map(t=><MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}</Select><TextField size="small" label="Monto" type="number" onChange={(e)=>setFormEgreso({...formEgreso, monto:e.target.value})} /><Button variant="contained" onClick={handleRegistrarEgreso}>Registrar</Button></Box><Table size="small"><TableBody>{listaEgresos.map(e=><TableRow key={e.id}><TableCell>{e.fecha_pago}</TableCell><TableCell>{e.nombre_gasto}</TableCell><TableCell>-${e.monto}</TableCell></TableRow>)}</TableBody></Table></Box>)}{tabContabilidad === 2 && (<Box sx={{textAlign:'center', p:3}}><Typography color="error">Cobro Masivo</Typography><TextField label="Concepto" value={conceptoExtra} onChange={(e)=>setConceptoExtra(e.target.value)} sx={{m:1}}/><TextField label="Monto" type="number" value={montoExtra} onChange={(e)=>setMontoExtra(e.target.value)} sx={{m:1}}/><Button variant="contained" color="error" onClick={handleCargoMasivo}>Aplicar</Button></Box>)}</DialogContent><DialogActions><Button onClick={()=>setOpenContabilidad(false)}>Cerrar</Button></DialogActions></Dialog>
      <Dialog open={openPersonal} onClose={()=>setOpenPersonal(false)} fullWidth maxWidth="lg"><DialogTitle sx={{bgcolor: '#5d4037', color: 'white'}}>Personal Externo</DialogTitle><DialogContent><Box sx={{display:'flex', gap:1, bgcolor:'#f5f5f5', p:2, mb:2, borderRadius:1}}><TextField type="date" size="small" InputLabelProps={{shrink:true}} label="Inicio" onChange={(e)=>setFechaInicio(e.target.value)} /><TextField type="date" size="small" InputLabelProps={{shrink:true}} label="Fin" onChange={(e)=>setFechaFin(e.target.value)} /><Button variant="contained" color="warning" size="small" onClick={cargarHistorial}>Filtrar</Button><Button variant="outlined" startIcon={<PictureAsPdfIcon/>} onClick={descargarReporteAccesos}>PDF</Button></Box><Tabs value={tabPersonal} onChange={(e,v)=>setTabPersonal(v)} centered sx={{mb:2}}><Tab label="Padrón" /><Tab label="Historial" /></Tabs>{tabPersonal === 0 && (<TableContainer component={Paper}><Table size="small"><TableHead sx={{bgcolor:'#eee'}}><TableRow><TableCell>Nombre</TableCell><TableCell>Patrón</TableCell><TableCell>Teléfono</TableCell><TableCell>Acción</TableCell></TableRow></TableHead><TableBody>{listaTrabajadores.map(t => (<TableRow key={t.id}><TableCell>{t.nombre_completo}</TableCell><TableCell>{t.casa_info}</TableCell><TableCell>{t.telefono}</TableCell><TableCell><IconButton color="error" size="small" onClick={() => handleBorrarPersonal(t.id)}><DeleteIcon/></IconButton></TableCell></TableRow>))}</TableBody></Table></TableContainer>)}{tabPersonal === 1 && (<TableContainer component={Paper} sx={{maxHeight: 450}}><Table stickyHeader size="small"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Tipo</TableCell><TableCell>Nombre</TableCell><TableCell>Detalle</TableCell><TableCell>Salida</TableCell></TableRow></TableHead><TableBody>{historialAccesos.map((h) => (<TableRow key={h.id}><TableCell>{new Date(h.fecha).toLocaleString()}</TableCell><TableCell><Chip label={h.tipo} size="small"/></TableCell><TableCell>{h.nombre}</TableCell><TableCell>{h.detalle}</TableCell><TableCell>{h.salida ? new Date(h.salida).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</TableCell></TableRow>))}</TableBody></Table></TableContainer>)}</DialogContent><DialogActions><Button onClick={()=>setOpenPersonal(false)}>Cerrar</Button></DialogActions></Dialog>

      <Footer />
    </Box>
  );
}

export default AdminPanel;