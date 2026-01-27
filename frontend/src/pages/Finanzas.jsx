import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, IconButton, Tab, Tabs, 
  Alert, TextField, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // Usamos la configuración centralizada
import Footer from '../components/Footer';

function Finanzas() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  
  // Estados de datos
  const [tiposEgresos, setTiposEgresos] = useState([]);
  const [listaEgresos, setListaEgresos] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);

  // Estados de formularios
  const [formEgreso, setFormEgreso] = useState({ tipo_id: '', monto: '', descripcion: '' });
  const [montoExtra, setMontoExtra] = useState('');
  const [conceptoExtra, setConceptoExtra] = useState('');

  useEffect(() => {
    cargarContabilidad();
  }, []);

  const cargarContabilidad = async () => {
    try {
      const [t, e, p] = await Promise.all([
        api.get('/api/tipos-egresos/'),
        api.get('/api/egresos/'),
        api.get('/api/pagos/?estado=PENDIENTE')
      ]);
      setTiposEgresos(t.data.results || t.data);
      setListaEgresos(e.data.results || e.data);
      setPagosPendientes(p.data.results || p.data);
    } catch (error) {
      console.error("Error cargando finanzas", error);
    }
  };

  const handleValidarPago = async (id, accion) => {
    try {
      await api.post(`/api/pagos/${id}/${accion}/`);
      alert("Pago procesado correctamente");
      cargarContabilidad();
    } catch (error) {
      alert("Error al procesar el pago");
    }
  };

  const handleRegistrarEgreso = async () => {
    if (!formEgreso.tipo_id || !formEgreso.monto) return alert("Faltan datos obligatorios");
    try {
      await api.post('/api/egresos/', {
        tipo: formEgreso.tipo_id,
        monto: formEgreso.monto,
        descripcion: formEgreso.descripcion
      });
      alert("Egreso registrado");
      setFormEgreso({ tipo_id: '', monto: '', descripcion: '' });
      cargarContabilidad();
    } catch (error) {
      alert("Error al registrar egreso");
    }
  };

  const handleCargoMasivo = async () => {
    if (!montoExtra) return alert("Ingresa un monto");
    if (!confirm("¿Aplicar este cargo a todas las casas activas?")) return;
    try {
      await api.post('/api/pagos/cargo_masivo/', { 
        monto: montoExtra, 
        concepto: conceptoExtra 
      });
      alert("Cargo masivo aplicado con éxito");
      setMontoExtra('');
      setConceptoExtra('');
    } catch (error) {
      alert("Error al aplicar cargo masivo");
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#ed6c02' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin-panel')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Centro Financiero</Typography>
        </Toolbar>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered textColor="inherit" indicatorColor="secondary">
          <Tab label="Validar Pagos" />
          <Tab label="Registro de Gastos" />
          <Tab label="Cobros Extraordinarios" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 3 }}>
          {/* PESTAÑA 0: VALIDAR PAGOS */}
          {tabIndex === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom color="primary">Pagos Pendientes de Revisión</Typography>
              {pagosPendientes.length === 0 ? (
                <Alert severity="success">No hay pagos pendientes de validar.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#fff3e0' }}>
                      <TableRow>
                        <TableCell>Casa</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Comprobante</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagosPendientes.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>Casa {p.casa}</TableCell>
                          <TableCell fontWeight="bold">${p.monto}</TableCell>
                          <TableCell>
                            {p.comprobante ? (
                              <Button size="small" onClick={() => window.open(p.comprobante, '_blank')}>Ver Foto</Button>
                            ) : 'Sin foto'}
                          </TableCell>
                          <TableCell align="center">
                            <Button color="success" onClick={() => handleValidarPago(p.id, 'aprobar')}>Aprobar</Button>
                            <Button color="error" onClick={() => handleValidarPago(p.id, 'rechazar')}>Rechazar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* PESTAÑA 1: GASTOS */}
          {tabIndex === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Registrar Nuevo Gasto (Egreso)</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Gasto</InputLabel>
                    <Select 
                      value={formEgreso.tipo_id} 
                      label="Tipo de Gasto"
                      onChange={(e) => setFormEgreso({...formEgreso, tipo_id: e.target.value})}
                    >
                      {tiposEgresos.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="Monto $" type="number" value={formEgreso.monto} onChange={(e) => setFormEgreso({...formEgreso, monto: e.target.value})} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="Descripción" value={formEgreso.descripcion} onChange={(e) => setFormEgreso({...formEgreso, descripcion: e.target.value})} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="contained" sx={{ height: '100%', bgcolor: '#ed6c02' }} onClick={handleRegistrarEgreso}>Registrar</Button>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>Historial de Egresos Recientes</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Categoría</TableCell><TableCell>Monto</TableCell></TableRow></TableHead>
                  <TableBody>
                    {listaEgresos.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{e.fecha_pago}</TableCell>
                        <TableCell>{e.nombre_gasto}</TableCell>
                        <TableCell color="error">-${e.monto}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* PESTAÑA 2: COBRO MASIVO */}
          {tabIndex === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>Generar Cargo Extraordinario</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>Este cobro se aplicará a todas las casas registradas automáticamente.</Typography>
              <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <TextField fullWidth label="Concepto (Ej: Reparación Portón)" value={conceptoExtra} onChange={(e) => setConceptoExtra(e.target.value)} sx={{ mb: 2 }} />
                <TextField fullWidth label="Monto $" type="number" value={montoExtra} onChange={(e) => setMontoExtra(e.target.value)} sx={{ mb: 3 }} />
                <Button variant="contained" color="error" size="large" fullWidth onClick={handleCargoMasivo}>Aplicar a Todo el Fraccionamiento</Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}

export default Finanzas;