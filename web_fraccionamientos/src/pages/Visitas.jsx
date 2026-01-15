import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Card, CardContent, 
  AppBar, Toolbar, TextField, Dialog, DialogTitle, 
  DialogContent, IconButton, Chip, Alert, Grid
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Icono para volver al panel
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Visitas() {
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para crear visita
  const [openCrear, setOpenCrear] = useState(false);
  const [nombreVisitante, setNombreVisitante] = useState('');
  const [fechaLlegada, setFechaLlegada] = useState('');
  const [placas, setPlacas] = useState(''); 
  const [errorCrear, setErrorCrear] = useState(''); 

  // Estados para ver QR
  const [openQR, setOpenQR] = useState(false);
  const [qrActual, setQrActual] = useState(null);

  // --- LÓGICA DE NAVEGACIÓN INTELIGENTE ---
  const userRol = localStorage.getItem('rol');
  const rolLimpio = userRol ? userRol.toLowerCase().trim() : "";
  const esAdmin = rolLimpio === 'admin' || rolLimpio === 'administrador';

  const handleVolver = () => {
    if (esAdmin) {
        navigate('/admin-panel'); // Admin vuelve a su panel general
    } else {
        navigate('/dashboard'); // Residente vuelve a su casa
    }
  };
  // ----------------------------------------

  const cargarVisitas = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/visitas/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setVisitas(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      if(error.response?.status === 401) navigate('/');
    }
  };

  useEffect(() => { cargarVisitas(); }, [navigate]);

  const handleCrearVisita = async () => {
    const token = localStorage.getItem('token');
    setErrorCrear(''); 

    try {
        const formData = new FormData();
        formData.append('nombre_visitante', nombreVisitante);
        formData.append('fecha_llegada', fechaLlegada);
        if(placas) formData.append('placas', placas);
        
        await axios.post('http://127.0.0.1:8000/api/visitas/', formData, {
            headers: { 
                'Authorization': `Token ${token}`,
                'Content-Type': 'multipart/form-data' 
            }
        });
        
        setNombreVisitante('');
        setFechaLlegada('');
        setPlacas('');
        setOpenCrear(false);
        cargarVisitas();
        alert("¡Pase generado con éxito!");
        
    } catch (error) {
        console.error("Error creando visita:", error.response?.data);
        const mensaje = error.response?.data?.error || "Error al crear pase. Revisa los datos.";
        setErrorCrear(mensaje);
    }
  };

  const verQR = (urlImagen) => {
      if (!urlImagen) return;
      const urlFinal = urlImagen.startsWith('http') 
        ? urlImagen 
        : `http://127.0.0.1:8000${urlImagen}`;
      
      setQrActual(urlFinal);
      setOpenQR(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* BARRA SUPERIOR ADAPTATIVA */}
      <AppBar position="static" sx={{ bgcolor: esAdmin ? '#1e293b' : 'secondary.main' }}>
        <Toolbar>
          <Button 
            color="inherit" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleVolver}
            sx={{ mr: 2 }}
          >
            {esAdmin ? 'Volver al Panel' : 'Volver'}
          </Button>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {esAdmin ? 'Supervisión de Visitas' : 'Mis Accesos'}
          </Typography>
          
          <Button color="inherit" startIcon={<AddCircleIcon />} onClick={() => setOpenCrear(true)}>
            Nuevo Pase
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#374151' }}>
            Listado de Visitas
        </Typography>
        
        {visitas.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>
                No hay visitas registradas aún.
            </Alert>
        )}

        <Grid container spacing={2}>
            {visitas.map((v) => (
                <Grid item xs={12} sm={6} md={4} key={v.id}>
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{v.nombre_visitante}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(v.fecha_llegada).toLocaleString()}
                                </Typography>
                                {esAdmin && (
                                    <Typography variant="caption" display="block" sx={{mt:0.5, color: 'primary.main'}}>
                                        Residente: {v.nombre_residente || 'Desconocido'}
                                    </Typography>
                                )}
                                <Chip label={v.estado} size="small" color={v.estado === 'PENDIENTE' ? 'warning' : 'success'} sx={{mt:1}} />
                            </Box>
                            
                            {v.imagen_qr ? (
                                <IconButton color="primary" onClick={() => verQR(v.imagen_qr)}>
                                    <QrCodeIcon sx={{ fontSize: 40 }} />
                                </IconButton>
                            ) : (
                                <Typography variant="caption" color="error">Sin QR</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
      </Container>

      {/* MODALES (Crear y QR) - Se mantienen igual */}
      <Dialog open={openCrear} onClose={() => setOpenCrear(false)}>
        <DialogTitle>Nuevo Pase de Acceso</DialogTitle>
        <DialogContent>
            {errorCrear && <Alert severity="error" sx={{mb:2, mt:1}}>{errorCrear}</Alert>}
            
            <TextField margin="dense" label="Nombre Visitante" fullWidth value={nombreVisitante} onChange={(e) => setNombreVisitante(e.target.value)} />
            <TextField 
                margin="dense" label="Fecha y Hora Aproximada" type="datetime-local" fullWidth 
                InputLabelProps={{ shrink: true }}
                value={fechaLlegada} onChange={(e) => setFechaLlegada(e.target.value)} 
            />
            <TextField margin="dense" label="Placas (Opcional)" fullWidth value={placas} onChange={(e) => setPlacas(e.target.value)} />
            
            <Button fullWidth variant="contained" sx={{mt:2}} onClick={handleCrearVisita}>
                Generar QR
            </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={openQR} onClose={() => setOpenQR(false)}>
          <Box sx={{p:4, textAlign:'center'}}>
              <Typography variant="h6" gutterBottom>Muestra este código en caseta</Typography>
              {qrActual && (
                  <img 
                    src={qrActual} 
                    alt="Código QR" 
                    style={{width: '100%', maxWidth:'300px', borderRadius:8, border: '1px solid #ddd'}} 
                    onError={(e) => { e.target.style.display='none'; alert("Imagen no encontrada."); }}
                  />
              )}
          </Box>
      </Dialog>
    </Box>
  );
}

export default Visitas;