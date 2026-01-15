import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Box, Button, Card, CardContent, AppBar, Toolbar, 
  IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, FormControl, InputLabel, Select, MenuItem, Rating, CardMedia, Divider,
  Paper // <--- ¡ESTE FALTABA!
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CATEGORIAS = [
    {id: 'TODOS', label: 'Todo'},
    {id: 'PLOMERIA', label: 'Plomería'},
    {id: 'ELECTRICIDAD', label: 'Electricidad'},
    {id: 'ALBANIL', label: 'Albañilería'},
    {id: 'JARDINERIA', label: 'Jardinería'},
    {id: 'CERRAJERIA', label: 'Cerrajería'},
    {id: 'GAS', label: 'Gas'},
    {id: 'INTERNET', label: 'Internet/TV'},
    {id: 'LIMPIEZA', label: 'Limpieza'},
    {id: 'VETERINARIA', label: 'Mascotas'},
    {id: 'OTRO', label: 'Otros'},
];

function Directorio() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [filtroCat, setFiltroCat] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal Nuevo
  const [openNuevo, setOpenNuevo] = useState(false);
  const [form, setForm] = useState({ nombre: '', categoria: 'PLOMERIA', telefono: '', descripcion: '' });
  const [foto, setFoto] = useState(null);

  // Datos Usuario
  const rol = localStorage.getItem('rol') || '';

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/servicios/', { headers: { Authorization: `Token ${token}` } });
        setServicios(res.data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleCrear = async () => {
      if(!form.nombre || !form.telefono) return alert("Nombre y Teléfono requeridos");
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if(foto) formData.append('foto', foto);

      try {
          await axios.post('http://127.0.0.1:8000/api/servicios/', formData, { 
              headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } 
          });
          alert("Proveedor agregado exitosamente");
          setOpenNuevo(false); setForm({ nombre: '', categoria: 'PLOMERIA', telefono: '', descripcion: '' }); setFoto(null);
          cargarDatos();
      } catch(e) { alert("Error al guardar"); }
  };

  const handleCalificar = async (id, newValue) => {
      if(!newValue) return;
      const token = localStorage.getItem('token');
      try {
          await axios.post(`http://127.0.0.1:8000/api/servicios/${id}/calificar/`, { estrellas: newValue }, { headers: { Authorization: `Token ${token}` } });
          cargarDatos(); // Recargar para ver el nuevo promedio
      } catch(e) { alert("Error al calificar"); }
  };

  const enviarWhatsApp = (telefono, nombre) => {
      let num = telefono.replace(/\D/g, '');
      if(num.length === 10) num = `52${num}`;
      const msg = `Hola ${nombre}, soy vecino del fraccionamiento, vi tu contacto en la app.`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtrados = servicios.filter(s => {
      const matchCat = filtroCat === 'TODOS' ? true : s.categoria === filtroCat;
      const matchText = s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || s.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchText;
  });

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#00695c' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(rol.toLowerCase().includes('admin') ? '/admin-panel' : '/dashboard')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Directorio de Servicios</Typography>
          <Button color="inherit" variant="outlined" onClick={() => setOpenNuevo(true)} startIcon={<AddIcon />}>Sugerir Nuevo</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        
        {/* FILTROS */}
        <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" placeholder="Buscar (ej. Juan, Fuga...)" InputProps={{startAdornment: <SearchIcon color="action" sx={{mr:1}}/>}} value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {CATEGORIAS.slice(0, 6).map(cat => (
                            <Chip 
                                key={cat.id} 
                                label={cat.label} 
                                onClick={()=>setFiltroCat(cat.id)} 
                                color={filtroCat===cat.id ? "primary" : "default"} 
                                clickable
                            />
                        ))}
                         <Chip label="Ver Más..." onClick={()=>setFiltroCat('TODOS')} variant="outlined"/>
                    </Box>
                </Grid>
            </Grid>
        </Paper>

        {/* LISTADO */}
        <Grid container spacing={3}>
            {filtrados.map(s => (
                <Grid item xs={12} md={6} lg={4} key={s.id}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3, position: 'relative' }}>
                        {s.foto ? (
                            <CardMedia component="img" height="140" image={s.foto} alt={s.nombre} />
                        ) : (
                            <Box sx={{height:100, bgcolor:'#e0f2f1', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <Typography variant="h3">🛠️</Typography>
                            </Box>
                        )}
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="start">
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">{s.nombre}</Typography>
                                    <Chip label={CATEGORIAS.find(c=>c.id===s.categoria)?.label || s.categoria} size="small" color="secondary" variant="outlined" sx={{mt:0.5}}/>
                                </Box>
                                <Box textAlign="center">
                                    <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{display:'flex', alignItems:'center'}}>
                                        {s.promedio} <StarIcon fontSize="small"/>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">({s.total_votos} votos)</Typography>
                                </Box>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                                {s.descripcion || "Sin descripción detallada."}
                            </Typography>
                            
                            <Divider sx={{my:1}} />
                            
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                <Box>
                                    <Typography variant="caption" display="block">Calificar servicio:</Typography>
                                    <Rating 
                                        value={s.mis_estrellas} 
                                        onChange={(event, newValue) => handleCalificar(s.id, newValue)} 
                                    />
                                </Box>
                                <Box>
                                    <IconButton color="primary" href={`tel:${s.telefono}`}><PhoneIcon/></IconButton>
                                    <IconButton color="success" onClick={()=>enviarWhatsApp(s.telefono, s.nombre)}><WhatsAppIcon/></IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
      </Container>

      {/* MODAL NUEVO */}
      <Dialog open={openNuevo} onClose={()=>setOpenNuevo(false)} fullWidth maxWidth="sm">
          <DialogTitle>Recomendar Proveedor</DialogTitle>
          <DialogContent>
              <TextField margin="dense" label="Nombre del Negocio / Persona" fullWidth value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} />
              
              <FormControl fullWidth margin="dense">
                  <InputLabel>Categoría</InputLabel>
                  <Select value={form.categoria} onChange={(e)=>setForm({...form, categoria:e.target.value})}>
                      {CATEGORIAS.filter(c=>c.id!=='TODOS').map(c => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                  </Select>
              </FormControl>

              <TextField margin="dense" label="Teléfono / WhatsApp" fullWidth value={form.telefono} onChange={(e)=>setForm({...form, telefono:e.target.value})} />
              <TextField margin="dense" label="Descripción (Costos aprox, horarios...)" fullWidth multiline rows={3} value={form.descripcion} onChange={(e)=>setForm({...form, descripcion:e.target.value})} />
              
              <Button variant="outlined" component="label" fullWidth sx={{mt:2}}>
                  Subir Tarjeta / Foto (Opcional)
                  <input type="file" hidden accept="image/*" onChange={(e)=>setFoto(e.target.files[0])} />
              </Button>
          </DialogContent>
          <DialogActions>
              <Button onClick={()=>setOpenNuevo(false)}>Cancelar</Button>
              <Button onClick={handleCrear} variant="contained" color="success">Guardar</Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Directorio;