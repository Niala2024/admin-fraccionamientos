import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, IconButton, Tab, Tabs, 
  TextField, Chip, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // Configuración unificada
import Footer from '../components/Footer';

function PersonalExterno() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  
  // Estados de datos
  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [historialAccesos, setHistorialAccesos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    try {
      const res = await api.get('/api/trabajadores/');
      setListaTrabajadores(res.data.results || res.data);
    } catch (e) {
      console.error("Error al cargar personal", e);
    }
  };

  const handleBorrarPersonal = async (id) => {
    if (!confirm("¿Dar de baja a este trabajador? No podrá volver a entrar con su QR.")) return;
    try {
      await api.delete(`/api/trabajadores/${id}/`);
      alert("Trabajador dado de baja");
      cargarPersonal();
    } catch (e) {
      alert("Error al procesar la baja");
    }
  };

  const cargarHistorial = async () => {
    if (!fechaInicio || !fechaFin) return alert("Selecciona un rango de fechas");
    try {
      const [resTrab, resProv] = await Promise.all([
        api.get(`/api/accesos-trabajadores/?inicio=${fechaInicio}&fin=${fechaFin}`),
        api.get(`/api/visitas/?inicio=${fechaInicio}&fin=${fechaFin}&tipo=PROVEEDOR`)
      ]);
      
      const datosTrab = resTrab.data.results || resTrab.data;
      const datosProv = resProv.data.results || resProv.data;
      
      const combinado = [
        ...datosTrab.map(t => ({ ...t, tipo_identificador: 'TRABAJADOR' })),
        ...datosProv.map(p => ({ ...p, tipo_identificador: 'PROVEEDOR', nombre: p.nombre_visitante, detalle: p.empresa }))
      ];

      setHistorialAccesos(combinado.sort((a, b) => new Date(b.fecha_entrada || b.fecha_llegada) - new Date(a.fecha_entrada || a.fecha_llegada)));
    } catch (e) {
      alert("Error al cargar historial");
    }
  };

  const descargarReporteAccesos = async () => {
    try {
      const r = await api.get(`/api/reporte-accesos/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Accesos.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      alert("Error al generar PDF");
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#5d4037' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin-panel')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Gestión de Personal Externo</Typography>
        </Toolbar>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered textColor="inherit" indicatorColor="secondary">
          <Tab label="Padrón de Trabajadores" />
          <Tab label="Historial de Entradas" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 3 }}>
          {tabIndex === 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom color="primary">Trabajadores Activos con QR</Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#efebe9' }}>
                    <TableRow>
                      <TableCell>Nombre Completo</TableCell>
                      <TableCell>Responsable (Casa)</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listaTrabajadores.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell fontWeight="bold">{t.nombre_completo}</TableCell>
                        <TableCell>{t.casa_info || 'Administración'}</TableCell>
                        <TableCell>{t.telefono}</TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleBorrarPersonal(t.id)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField type="date" label="Desde" InputLabelProps={{ shrink: true }} size="small" onChange={(e) => setFechaInicio(e.target.value)} />
                <TextField type="date" label="Hasta" InputLabelProps={{ shrink: true }} size="small" onChange={(e) => setFechaFin(e.target.value)} />
                <Button variant="contained" color="warning" onClick={cargarHistorial}>Filtrar</Button>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={descargarReporteAccesos}>PDF</Button>
              </Box>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead><TableRow><TableCell>Fecha/Hora</TableCell><TableCell>Tipo</TableCell><TableCell>Nombre</TableCell><TableCell>Detalle</TableCell></TableRow></TableHead>
                  <TableBody>
                    {historialAccesos.map((h, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(h.fecha_entrada || h.fecha_llegada).toLocaleString()}</TableCell>
                        <TableCell><Chip label={h.tipo_identificador} size="small" color={h.tipo_identificador === 'PROVEEDOR' ? 'info' : 'secondary'} /></TableCell>
                        <TableCell>{h.nombre}</TableCell>
                        <TableCell>{h.detalle || `Casa ${h.casa}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}

export default PersonalExterno;