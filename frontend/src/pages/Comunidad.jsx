import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Avatar, IconButton, Card, CardHeader, CardContent, CardMedia, 
  CardActions, Divider, CircularProgress, Tabs, Tab, Chip,
  FormControl, RadioGroup, FormControlLabel, Radio, Tooltip, Fade
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import SendIcon from '@mui/icons-material/Send';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Usamos este icono para volver
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import HandymanIcon from '@mui/icons-material/Handyman'; 
import CampaignIcon from '@mui/icons-material/Campaign'; 
import PollIcon from '@mui/icons-material/Poll'; 
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; 
import CancelIcon from '@mui/icons-material/Cancel';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Nuevo icono para el botón

import api from '../api/axiosConfig'; 

function Comunidad() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [tabIndex, setTabIndex] = useState(0);
  const [config, setConfig] = useState({ imagen_portada: null, titulo_comunidad: 'Nuestra Comunidad' });

  // Estados Muro
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [nuevoPost, setNuevoPost] = useState('');
  const [tipoPost, setTipoPost] = useState('SOCIAL');
  const [imagenPost, setImagenPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [enviandoPost, setEnviandoPost] = useState(false);

  // Estados Encuestas y Quejas
  const [encuestas, setEncuestas] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [nuevaQueja, setNuevaQueja] = useState({ asunto: '', descripcion: '' });
  const [evidenciaQueja, setEvidenciaQueja] = useState(null);

  useEffect(() => {
    if (!token) navigate('/');
    cargarConfiguracion();
    cargarDatos();
  }, [tabIndex]);

  // ✅ NUEVA LÓGICA DE RETORNO INTELIGENTE
  const handleVolver = () => {
      // Si es Staff (Admin) va al Dashboard general
      if (sessionUser.is_staff) {
          navigate('/dashboard');
      } else {
          // Si es Residente va a su Perfil (o podrías poner '/caseta' si prefieres)
          navigate('/perfil');
      }
  };

  const cargarDatos = () => {
      if (tabIndex === 0) cargarPosts();
      if (tabIndex === 1) cargarEncuestas();
      if (tabIndex === 2) cargarQuejas();
  };

  const cargarConfiguracion = async () => {
      try { const res = await api.get('/api/config-comunidad/'); if(res.data.id) setConfig(res.data); } catch(e){}
  };

  const cambiarPortada = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const formData = new FormData();
      formData.append('imagen_portada', file);
      try {
          const res = await api.post('/api/config-comunidad/', formData, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setConfig(res.data);
          enqueueSnackbar("Portada actualizada", {variant:'success'});
      } catch(e) { enqueueSnackbar("Error al subir portada", {variant:'error'}); }
  };

  const cargarPosts = async () => {
    try {
        const res = await api.get('/api/foro/');
        setPosts(res.data.results || res.data);
    } catch (e) { console.error(e); } finally { setLoadingPosts(false); }
  };

  const handleImagenChange = (e) => {
      const file = e.target.files[0];
      if (file) { setImagenPost(file); setPreviewPost(URL.createObjectURL(file)); }
  };

  const handlePublicar = async () => {
      if (!nuevoPost.trim() && !imagenPost) return;
      setEnviandoPost(true);
      const formData = new FormData();
      formData.append('contenido', nuevoPost);
      formData.append('tipo', tipoPost);
      if (imagenPost) formData.append('imagen', imagenPost);

      try {
          await api.post('/api/foro/', formData, { headers: { 'Authorization': `Token ${token}` } });
          enqueueSnackbar("Publicado", { variant: 'success' });
          setNuevoPost(''); setImagenPost(null); setPreviewPost(null); setTipoPost('SOCIAL');
          cargarPosts();
      } catch (e) { enqueueSnackbar("Error al publicar", { variant: 'error' }); } 
      finally { setEnviandoPost(false); }
  };

  const borrarPost = async (id) => {
      if(!confirm("¿Eliminar publicación?")) return;
      try { await api.delete(`/api/foro/${id}/`); cargarPosts(); } catch(e){}
  };

  const votarEncuesta = async (encuestaId, opcionId) => {
      try { 
          await api.post(`/api/encuestas/${encuestaId}/votar/`, { opcion: opcionId }, { headers: { 'Authorization': `Token ${token}` } }); 
          enqueueSnackbar("Voto registrado", {variant:'success'}); cargarEncuestas(); 
      } catch(e){ enqueueSnackbar("Error al votar", {variant:'warning'}); }
  };
  const cargarEncuestas = async () => { try { const res = await api.get('/api/encuestas/'); setEncuestas(res.data.results || res.data); } catch(e){} };

  const cargarQuejas = async () => { try { const res = await api.get('/api/quejas/'); setQuejas(res.data.results || res.data); } catch(e){} };
  const enviarQueja = async () => {
      if(!nuevaQueja.asunto) return;
      const fd = new FormData();
      fd.append('titulo', nuevaQueja.asunto); fd.append('descripcion', nuevaQueja.descripcion);
      if(evidenciaQueja) fd.append('foto', evidenciaQueja);
      try { await api.post('/api/quejas/', fd, { headers: { 'Authorization': `Token ${token}` } }); enqueueSnackbar("Reporte enviado", {variant:'success'}); setNuevaQueja({asunto:'', descripcion:''}); setEvidenciaQueja(null); cargarQuejas(); } catch(e){ enqueueSnackbar("Error enviando reporte", {variant:'error'}); }
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }}>
        {/* HEADER CON PORTADA */}
        <Box sx={{ position: 'relative', bgcolor: 'white', mb: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <Box sx={{ 
                height: { xs: 150, md: 250 }, 
                background: config.imagen_portada ? `url(${config.imagen_portada})` : 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
                backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'
            }}>
                {/* BOTÓN DE VOLVER AL PANEL (INTELIGENTE) */}
                <Button 
                    onClick={handleVolver}
                    startIcon={<DashboardIcon />}
                    variant="contained"
                    sx={{ 
                        position: 'absolute', 
                        top: 20, 
                        left: 20, 
                        bgcolor: 'rgba(255,255,255,0.9)', 
                        color: '#1976d2',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#fff' },
                        boxShadow: 3
                    }}
                >
                    {sessionUser.is_staff ? 'Panel Admin' : 'Mi Panel'}
                </Button>

                {sessionUser.is_staff && (
                    <Button component="label" variant="contained" size="small" startIcon={<EditIcon />} sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'white', color: 'black', '&:hover':{bgcolor:'#eee'} }}>
                        Editar Portada
                        <input type="file" hidden accept="image/*" onChange={cambiarPortada} />
                    </Button>
                )}
            </Box>
            <Container maxWidth="md">
                <Box display="flex" flexDirection={{xs:'column', md:'row'}} alignItems="center" mt={-4} mb={2} px={2}>
                    <Avatar src={sessionUser.avatar} sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: 2 }} />
                    <Box ml={{md:3}} mt={{xs:1, md:4}} textAlign={{xs:'center', md:'left'}}>
                        <Typography variant="h4" fontWeight="bold">{config.titulo_comunidad}</Typography>
                        <Typography variant="body1" color="text.secondary">Bienvenido, {sessionUser.first_name || 'vecino'}</Typography>
                    </Box>
                </Box>
                <Divider />
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered sx={{ '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', minHeight: 60 } }}>
                    <Tab label="Muro Social" icon={<CampaignIcon />} iconPosition="start" />
                    <Tab label="Encuestas" icon={<PollIcon />} iconPosition="start" />
                    <Tab label="Reportes y Quejas" icon={<ReportProblemIcon />} iconPosition="start" />
                </Tabs>
            </Container>
        </Box>

        <Container maxWidth="md">
            {/* VISTA DE MURO SOCIAL */}
            {tabIndex === 0 && (
                <Grid container spacing={3}>
                    {/* CREAR POST */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <Box display="flex" gap={2}>
                                <Avatar src={sessionUser.avatar} />
                                <Box flexGrow={1}>
                                    <TextField fullWidth multiline rows={2} placeholder={`¿Qué estás pensando, ${sessionUser.first_name}?`} variant="standard" InputProps={{ disableUnderline: true }} value={nuevoPost} onChange={(e) => setNuevoPost(e.target.value)} sx={{ bgcolor: '#f0f2f5', borderRadius: 4, px: 2, py: 1 }} />
                                    {previewPost && <Box mt={2} position="relative"><img src={previewPost} alt="Preview" style={{ width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'cover' }} /><IconButton onClick={() => { setImagenPost(null); setPreviewPost(null); }} sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}><CancelIcon /></IconButton></Box>}
                                    <Divider sx={{ my: 2 }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box display="flex" gap={1}>
                                            <Tooltip title="Foto"><IconButton color="primary" component="label"><input hidden accept="image/*" type="file" onChange={handleImagenChange} /><AddPhotoAlternateIcon /></IconButton></Tooltip>
                                            <Chip label="Social" size="small" onClick={()=>setTipoPost('SOCIAL')} color={tipoPost==='SOCIAL'?'primary':'default'} variant={tipoPost==='SOCIAL'?'filled':'outlined'} clickable icon={<ChatBubbleOutlineIcon/>} />
                                            <Chip label="Venta" size="small" onClick={()=>setTipoPost('VENTA')} color={tipoPost==='VENTA'?'success':'default'} variant={tipoPost==='VENTA'?'filled':'outlined'} clickable icon={<StorefrontIcon/>} />
                                            <Chip label="Servicio" size="small" onClick={()=>setTipoPost('SERVICIO')} color={tipoPost==='SERVICIO'?'warning':'default'} variant={tipoPost==='SERVICIO'?'filled':'outlined'} clickable icon={<HandymanIcon/>} />
                                        </Box>
                                        <Button variant="contained" disableElevation endIcon={enviandoPost ? <CircularProgress size={20} color="inherit"/> : <SendIcon />} onClick={handlePublicar} disabled={enviandoPost || (!nuevoPost && !imagenPost)} sx={{ borderRadius: 5, textTransform: 'none' }}>Publicar</Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* LISTA DE POSTS */}
                    {loadingPosts ? <Grid item xs={12} textAlign="center"><CircularProgress /></Grid> : posts.map(post => (
                        <Grid item xs={12} key={post.id}>
                            <Fade in={true}>
                                <Card sx={{ borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    <CardHeader
                                        avatar={<Avatar src={post.autor_avatar}>{post.autor_nombre?.[0]}</Avatar>}
                                        action={<Box>{post.tipo !== 'SOCIAL' && <Chip label={post.tipo} size="small" color={post.tipo === 'VENTA' ? 'success' : 'warning'} sx={{mr:1}} />}{(post.autor === sessionUser.id || sessionUser.is_staff) && <IconButton size="small" onClick={()=>borrarPost(post.id)}><DeleteIcon fontSize="small" /></IconButton>}</Box>}
                                        title={<Typography fontWeight="bold">{post.autor_nombre}</Typography>}
                                        subheader={new Date(post.fecha_creacion).toLocaleString('es-MX', {dateStyle: 'medium', timeStyle: 'short'})}
                                    />
                                    <CardContent sx={{ py: 0 }}><Typography variant="body1" sx={{whiteSpace:'pre-line', fontSize: '1.05rem'}}>{post.contenido}</Typography></CardContent>
                                    {post.imagen && <CardMedia component="img" image={post.imagen} sx={{ mt: 2, maxHeight: 500, objectFit: 'contain', bgcolor: '#f5f5f5' }} />}
                                    <CardActions sx={{ px: 2, py: 1 }}>
                                        <Button startIcon={<FavoriteBorderIcon />} color="inherit" fullWidth sx={{ textTransform: 'none', color: 'text.secondary' }}>Me gusta</Button>
                                        <Button startIcon={<ChatBubbleOutlineIcon />} color="inherit" fullWidth sx={{ textTransform: 'none', color: 'text.secondary' }}>Comentar</Button>
                                    </CardActions>
                                </Card>
                            </Fade>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* VISTA ENCUESTAS */}
            {tabIndex === 1 && (
                <Box>
                    {encuestas.map(enc => (
                        <Card key={enc.id} sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <PollIcon color="secondary" />
                                    <Typography variant="h6" fontWeight="bold">{enc.titulo}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>{enc.descripcion}</Typography>
                                <FormControl component="fieldset" fullWidth>
                                    <RadioGroup>
                                        {enc.opciones.map(op => {
                                            const porcentaje = Math.round((op.votos / (enc.total_votos || 1)) * 100);
                                            return (
                                                <Box key={op.id} sx={{ mb: 1.5, position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${porcentaje}%`, bgcolor: '#e1f5fe', zIndex: 0, transition: 'width 0.5s' }} />
                                                    <FormControlLabel value={op.id} control={<Radio onClick={() => votarEncuesta(enc.id, op.id)} />} label={<Box display="flex" justifyContent="space-between" width="100%" sx={{ zIndex: 1, position: 'relative', minWidth: 250 }}><Typography>{op.texto}</Typography><Typography fontWeight="bold">{porcentaje}%</Typography></Box>} sx={{ width: '100%', m: 0, p: 1 }} />
                                                </Box>
                                            );
                                        })}
                                    </RadioGroup>
                                </FormControl>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* VISTA QUEJAS */}
            {tabIndex === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                         <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Typography variant="h6" fontWeight="bold" color="error" gutterBottom>Nuevo Reporte</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>Describe la incidencia. Será enviada al administrador.</Typography>
                            <TextField fullWidth label="Asunto" variant="outlined" size="small" sx={{ mb: 2 }} value={nuevaQueja.asunto} onChange={e=>setNuevaQueja({...nuevaQueja, asunto:e.target.value})} />
                            <TextField fullWidth label="Descripción" variant="outlined" multiline rows={4} sx={{ mb: 2 }} value={nuevaQueja.descripcion} onChange={e=>setNuevaQueja({...nuevaQueja, descripcion:e.target.value})} />
                            <Button fullWidth component="label" variant="outlined" startIcon={<PhotoCamera />} sx={{ mb: 2, textTransform: 'none' }}>
                                {evidenciaQueja ? "Evidencia cargada" : "Adjuntar Foto"}
                                <input type="file" hidden accept="image/*" onChange={e=>setEvidenciaQueja(e.target.files[0])} />
                            </Button>
                            <Button fullWidth variant="contained" color="error" disableElevation onClick={enviarQueja} sx={{ borderRadius: 5 }}>Enviar Reporte</Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>Mis Reportes</Typography>
                        {quejas.map(q => (
                            <Paper key={q.id} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: q.estado === 'RESUELTO' ? '4px solid #4caf50' : '4px solid #f44336' }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography fontWeight="bold">{q.titulo}</Typography>
                                    <Chip label={q.estado} size="small" color={q.estado==='RESUELTO'?'success':(q.estado==='PENDIENTE'?'error':'warning')} />
                                </Box>
                                <Typography variant="body2" color="text.secondary">{q.descripcion}</Typography>
                                <Typography variant="caption" display="block" mt={1} color="text.disabled">{new Date(q.fecha_creacion).toLocaleDateString()}</Typography>
                            </Paper>
                        ))}
                    </Grid>
                </Grid>
            )}
        </Container>
    </Box>
  );
}
export default Comunidad;