import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Avatar, IconButton, Card, CardHeader, CardContent, CardMedia, 
  CardActions, Divider, CircularProgress, Tabs, Tab, Chip,
  List, ListItem, ListItemText, ListItemAvatar, LinearProgress, Radio, RadioGroup, FormControlLabel, FormControl
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos Estilo Facebook / Social
import SendIcon from '@mui/icons-material/Send';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront'; // Ventas
import HandymanIcon from '@mui/icons-material/Handyman'; // Servicios
import CampaignIcon from '@mui/icons-material/Campaign'; // Avisos
import PollIcon from '@mui/icons-material/Poll'; // Encuestas
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Quejas
import CancelIcon from '@mui/icons-material/Cancel';

import api from '../api/axiosConfig'; 

function Comunidad() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Datos de Sesión
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user_data') || '{}');

  // Control de Pestañas (0: Muro, 1: Encuestas, 2: Quejas)
  const [tabIndex, setTabIndex] = useState(0);

  // --- ESTADOS DEL MURO ---
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [nuevoPost, setNuevoPost] = useState('');
  const [tipoPost, setTipoPost] = useState('SOCIAL'); // SOCIAL, VENTA, SERVICIO
  const [imagenPost, setImagenPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [enviandoPost, setEnviandoPost] = useState(false);

  // --- ESTADOS DE ENCUESTAS ---
  const [encuestas, setEncuestas] = useState([]);
  const [loadingEncuestas, setLoadingEncuestas] = useState(false);

  // --- ESTADOS DE QUEJAS ---
  const [quejas, setQuejas] = useState([]);
  const [nuevaQueja, setNuevaQueja] = useState({ asunto: '', descripcion: '' });
  const [evidenciaQueja, setEvidenciaQueja] = useState(null);
  const [enviandoQueja, setEnviandoQueja] = useState(false);

  useEffect(() => {
    if (!token) navigate('/');
    cargarDatos();
  }, [tabIndex]);

  const cargarDatos = () => {
      if (tabIndex === 0) cargarPosts();
      if (tabIndex === 1) cargarEncuestas();
      if (tabIndex === 2) cargarQuejas();
  };

  // ==========================================
  // LÓGICA DEL MURO (WALL)
  // ==========================================
  const cargarPosts = async () => {
    try {
        const res = await api.get('/api/foro/', { headers: { Authorization: `Token ${token}` } });
        setPosts(res.data.results || res.data);
    } catch (e) { console.error(e); } finally { setLoadingPosts(false); }
  };

  const handleImagenChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImagenPost(file);
          setPreviewPost(URL.createObjectURL(file));
      }
  };

  const handlePublicar = async () => {
      if (!nuevoPost.trim() && !imagenPost) return;
      setEnviandoPost(true);
      
      const formData = new FormData();
      formData.append('contenido', nuevoPost);
      formData.append('tipo', tipoPost); // Enviamos si es VENTA, SERVICIO, etc.
      if (imagenPost) formData.append('imagen', imagenPost);

      try {
          await api.post('/api/foro/', formData, {
              headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          enqueueSnackbar("Publicado en el muro", { variant: 'success' });
          setNuevoPost(''); setImagenPost(null); setPreviewPost(null); setTipoPost('SOCIAL');
          cargarPosts();
      } catch (e) { enqueueSnackbar("Error al publicar", { variant: 'error' }); } 
      finally { setEnviandoPost(false); }
  };

  const borrarPost = async (id) => {
      if(!confirm("¿Eliminar publicación?")) return;
      try { await api.delete(`/api/foro/${id}/`, { headers: { Authorization: `Token ${token}` } }); cargarPosts(); } catch(e){}
  };

  // ==========================================
  // LÓGICA DE ENCUESTAS
  // ==========================================
  const cargarEncuestas = async () => {
      setLoadingEncuestas(true);
      try {
          const res = await api.get('/api/encuestas/', { headers: { Authorization: `Token ${token}` } });
          setEncuestas(res.data.results || res.data);
      } catch (e) { } finally { setLoadingEncuestas(false); }
  };

  const votarEncuesta = async (encuestaId, opcionId) => {
      try {
          await api.post(`/api/encuestas/${encuestaId}/votar/`, { opcion: opcionId }, { headers: { Authorization: `Token ${token}` } });
          enqueueSnackbar("Voto registrado", { variant: 'success' });
          cargarEncuestas(); // Recargar para ver resultados actualizados
      } catch (e) { enqueueSnackbar("Ya votaste o error al registrar", { variant: 'warning' }); }
  };

  // ==========================================
  // LÓGICA DE QUEJAS
  // ==========================================
  const cargarQuejas = async () => {
      try {
          const res = await api.get('/api/quejas/', { headers: { Authorization: `Token ${token}` } });
          setQuejas(res.data.results || res.data);
      } catch (e) {}
  };

  const enviarQueja = async () => {
      if(!nuevaQueja.asunto || !nuevaQueja.descripcion) return enqueueSnackbar("Faltan datos", {variant:'warning'});
      setEnviandoQueja(true);
      const fd = new FormData();
      fd.append('titulo', nuevaQueja.asunto);
      fd.append('descripcion', nuevaQueja.descripcion);
      if(evidenciaQueja) fd.append('foto', evidenciaQueja);

      try {
          await api.post('/api/quejas/', fd, { headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
          enqueueSnackbar("Queja enviada a Administración", { variant: 'success' });
          setNuevaQueja({asunto:'', descripcion:''}); setEvidenciaQueja(null);
          cargarQuejas();
      } catch(e) { enqueueSnackbar("Error enviando reporte", { variant: 'error' }); }
      finally { setEnviandoQueja(false); }
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 10 }}>
        {/* ENCABEZADO */}
        <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
                Atrás
            </Button>
            <Typography variant="h5" fontWeight="900" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                COMUNIDAD DIGITAL
            </Typography>
            <Avatar src={sessionUser.avatar} sx={{ width: 40, height: 40, border: '2px solid #2196F3' }} />
        </Box>

        {/* NAVEGACIÓN (TABS) */}
        <Paper elevation={0} sx={{ borderRadius: 4, mb: 3, border: '1px solid #e0e0e0', overflow:'hidden' }}>
            <Tabs 
                value={tabIndex} 
                onChange={(e, v) => setTabIndex(v)} 
                variant="fullWidth" 
                textColor="primary" 
                indicatorColor="primary"
                sx={{ '& .MuiTab-root': { fontWeight: 'bold' } }}
            >
                <Tab icon={<CampaignIcon />} label="Muro" iconPosition="start" />
                <Tab icon={<PollIcon />} label="Encuestas" iconPosition="start" />
                <Tab icon={<ReportProblemIcon />} label="Quejas" iconPosition="start" />
            </Tabs>
        </Paper>

        {/* ================= PESTAÑA 0: MURO SOCIAL ================= */}
        {tabIndex === 0 && (
            <>
                {/* CAJA DE CREACIÓN ESTILO FACEBOOK */}
                <Paper elevation={3} sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                    <Box display="flex" gap={2}>
                        <Avatar src={sessionUser.avatar} sx={{ width: 45, height: 45 }} />
                        <Box flexGrow={1}>
                            <TextField 
                                fullWidth 
                                multiline 
                                rows={2} 
                                placeholder={`¿Qué deseas compartir, ${sessionUser.first_name}?`} 
                                variant="standard" 
                                InputProps={{ disableUnderline: true }}
                                value={nuevoPost}
                                onChange={(e) => setNuevoPost(e.target.value)}
                            />
                            
                            {/* IMAGEN DE ENCABEZADO PREVIEW */}
                            {previewPost && (
                                <Box mt={2} position="relative" borderRadius={2} overflow="hidden" maxHeight={250}>
                                    <img src={previewPost} alt="Preview" style={{ width: '100%', objectFit: 'cover' }} />
                                    <IconButton 
                                        size="small" 
                                        onClick={() => { setImagenPost(null); setPreviewPost(null); }}
                                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                    >
                                        <CancelIcon />
                                    </IconButton>
                                </Box>
                            )}

                            <Divider sx={{ my: 1.5 }} />

                            <Grid container alignItems="center" justifyContent="space-between">
                                <Grid item>
                                    <Box display="flex" gap={1}>
                                        <Chip 
                                            icon={<ChatBubbleOutlineIcon sx={{fontSize: 16}}/>} 
                                            label="Social" 
                                            size="small" 
                                            color={tipoPost==='SOCIAL'?'primary':'default'} 
                                            onClick={()=>setTipoPost('SOCIAL')} 
                                            clickable
                                        />
                                        <Chip 
                                            icon={<StorefrontIcon sx={{fontSize: 16}}/>} 
                                            label="Venta" 
                                            size="small" 
                                            color={tipoPost==='VENTA'?'success':'default'} 
                                            onClick={()=>setTipoPost('VENTA')} 
                                            clickable
                                        />
                                        <Chip 
                                            icon={<HandymanIcon sx={{fontSize: 16}}/>} 
                                            label="Servicio" 
                                            size="small" 
                                            color={tipoPost==='SERVICIO'?'warning':'default'} 
                                            onClick={()=>setTipoPost('SERVICIO')} 
                                            clickable
                                        />
                                    </Box>
                                </Grid>
                                <Grid item display="flex" gap={1}>
                                    <IconButton color="primary" component="label">
                                        <input hidden accept="image/*" type="file" onChange={handleImagenChange} />
                                        <PhotoCamera />
                                    </IconButton>
                                    <Button 
                                        variant="contained" 
                                        endIcon={enviandoPost ? <CircularProgress size={20} color="inherit"/> : <SendIcon />} 
                                        onClick={handlePublicar}
                                        disabled={enviandoPost || (!nuevoPost && !imagenPost)}
                                        sx={{ borderRadius: 5, textTransform: 'none' }}
                                    >
                                        Publicar
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Paper>

                {/* FEED DE PUBLICACIONES */}
                {loadingPosts ? <Box textAlign="center"><CircularProgress /></Box> : posts.map(post => (
                    <Card key={post.id} sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }} elevation={1}>
                        <CardHeader
                            avatar={<Avatar src={post.autor_avatar} sx={{bgcolor: post.tipo === 'VENTA' ? '#2e7d32' : '#1976d2'}}>{post.autor_nombre?.[0]}</Avatar>}
                            action={
                                <Box>
                                    {post.tipo === 'VENTA' && <Chip label="VENTA" size="small" color="success" sx={{mr:1}}/>}
                                    {post.tipo === 'SERVICIO' && <Chip label="SERVICIO" size="small" color="warning" sx={{mr:1}}/>}
                                    {(post.autor === sessionUser.id || sessionUser.is_staff) && <IconButton size="small" onClick={()=>borrarPost(post.id)}><DeleteIcon fontSize="small"/></IconButton>}
                                </Box>
                            }
                            title={<Typography fontWeight="bold">{post.autor_nombre}</Typography>}
                            subheader={new Date(post.fecha_creacion).toLocaleString('es-MX', {dateStyle:'medium', timeStyle:'short'})}
                        />
                        <CardContent sx={{ py: 1 }}>
                            <Typography variant="body1" sx={{whiteSpace: 'pre-line'}}>{post.contenido}</Typography>
                        </CardContent>
                        
                        {post.imagen && (
                            <CardMedia component="img" image={post.imagen} alt="Post image" sx={{ maxHeight: 500, objectFit: 'cover', bgcolor: '#f0f0f0' }} />
                        )}

                        <Divider />
                        <CardActions disableSpacing sx={{ justifyContent: 'space-between', px: 2 }}>
                            <Button startIcon={<FavoriteBorderIcon />} color="inherit" sx={{textTransform:'none'}}>Me gusta</Button>
                            <Button startIcon={<ChatBubbleOutlineIcon />} color="inherit" sx={{textTransform:'none'}}>Comentar</Button>
                            <Button startIcon={<ShareIcon />} color="inherit" sx={{textTransform:'none'}}>Compartir</Button>
                        </CardActions>
                    </Card>
                ))}
            </>
        )}

        {/* ================= PESTAÑA 1: ENCUESTAS ================= */}
        {tabIndex === 1 && (
            <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{color:'#555'}}>Votaciones Activas</Typography>
                {loadingEncuestas ? <CircularProgress /> : encuestas.length === 0 ? <Typography color="text.secondary">No hay encuestas activas.</Typography> : (
                    encuestas.map(enc => (
                        <Card key={enc.id} sx={{ mb: 3, borderRadius: 3, borderTop: '4px solid #9c27b0' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold">{enc.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>{enc.descripcion}</Typography>
                                <Typography variant="caption" display="block" mb={2}>Cierra: {new Date(enc.fecha_fin).toLocaleDateString()}</Typography>
                                
                                <FormControl component="fieldset" fullWidth>
                                    <RadioGroup>
                                        {enc.opciones.map(op => {
                                            const totalVotos = enc.total_votos || 1; // Evitar división por 0
                                            const porcentaje = Math.round((op.votos / totalVotos) * 100);
                                            return (
                                                <Box key={op.id} sx={{ mb: 1.5, p: 1, border: '1px solid #eee', borderRadius: 2, position: 'relative', overflow:'hidden' }}>
                                                    {/* Barra de progreso de fondo */}
                                                    <Box sx={{ position:'absolute', top:0, left:0, bottom:0, width:`${porcentaje}%`, bgcolor: '#f3e5f5', zIndex: 0, transition: 'width 0.5s' }} />
                                                    
                                                    <Box position="relative" zIndex={1} display="flex" justifyContent="space-between" alignItems="center">
                                                        <FormControlLabel 
                                                            value={op.id} 
                                                            control={<Radio onClick={() => votarEncuesta(enc.id, op.id)} />} 
                                                            label={op.texto} 
                                                        />
                                                        <Typography variant="body2" fontWeight="bold" color="purple">{porcentaje}%</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </RadioGroup>
                                </FormControl>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        )}

        {/* ================= PESTAÑA 2: BUZÓN DE QUEJAS ================= */}
        {tabIndex === 2 && (
            <Box>
                <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '6px solid #d32f2f', mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="error">Reportar a Administración</Typography>
                    <Typography variant="body2" mb={2}>Tus reportes son confidenciales y llegan directamente al administrador.</Typography>
                    
                    <TextField fullWidth label="Asunto" variant="filled" size="small" sx={{ mb: 2 }} value={nuevaQueja.asunto} onChange={e=>setNuevaQueja({...nuevaQueja, asunto:e.target.value})} />
                    <TextField fullWidth label="Descripción detallada" variant="filled" multiline rows={3} sx={{ mb: 2 }} value={nuevaQueja.descripcion} onChange={e=>setNuevaQueja({...nuevaQueja, descripcion:e.target.value})} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button component="label" startIcon={<PhotoCamera />} sx={{ color: '#d32f2f' }}>
                            {evidenciaQueja ? "Evidencia Cargada" : "Adjuntar Foto"}
                            <input type="file" hidden accept="image/*" onChange={e=>setEvidenciaQueja(e.target.files[0])} />
                        </Button>
                        <Button variant="contained" color="error" endIcon={<SendIcon />} onClick={enviarQueja} disabled={enviandoQueja}>
                            {enviandoQueja ? "Enviando..." : "Enviar Reporte"}
                        </Button>
                    </Box>
                </Paper>

                <Typography variant="subtitle1" fontWeight="bold" mb={2}>Mis Reportes Anteriores</Typography>
                {quejas.map(q => (
                    <Paper key={q.id} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography fontWeight="bold">{q.titulo}</Typography>
                            <Chip label={q.estado} size="small" color={q.estado==='RESUELTO'?'success':'warning'} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={1}>{q.descripcion}</Typography>
                        <Typography variant="caption" display="block" mt={1} color="#999">{new Date(q.fecha_creacion).toLocaleDateString()}</Typography>
                    </Paper>
                ))}
            </Box>
        )}

    </Container>
  );
}

export default Comunidad;