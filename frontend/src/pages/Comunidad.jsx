import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Avatar, IconButton, Card, CardHeader, CardContent, CardMedia, 
  CardActions, Divider, Tabs, Tab, Chip,
  Radio, LinearProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import CampaignIcon from '@mui/icons-material/Campaign'; 
import PollIcon from '@mui/icons-material/Poll'; 
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; 
import CancelIcon from '@mui/icons-material/Cancel';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DashboardIcon from '@mui/icons-material/Dashboard'; 
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

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

  // Estados Encuestas
  const [encuestas, setEncuestas] = useState([]);
  const [nuevaEncuesta, setNuevaEncuesta] = useState({ 
      titulo: '', descripcion: '', tipo_grafico: 'BARRA', opciones: ['', ''] 
  });

  // Estados Quejas
  const [quejas, setQuejas] = useState([]);
  const [nuevaQueja, setNuevaQueja] = useState({ asunto: '', descripcion: '' });
  const [evidenciaQueja, setEvidenciaQueja] = useState(null);

  useEffect(() => {
    if (!token) navigate('/');
    cargarConfiguracion();
    cargarDatos();
  }, [tabIndex]);

  // ✅ CORRECCIÓN FINAL: Admin -> Panel Admin | Residente -> Dashboard
  const handleVolver = () => {
      if (sessionUser.is_staff || sessionUser.is_superuser) {
          navigate('/admin-panel'); 
      } else {
          navigate('/dashboard'); // Ahora lleva al Dashboard de Vecinos
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

  // --- LOGICA MURO ---
  const cargarPosts = async () => {
    try { const res = await api.get('/api/foro/'); setPosts(res.data.results || res.data); } catch (e) {} finally { setLoadingPosts(false); }
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
  const borrarPost = async (id) => { if(confirm("¿Eliminar?")) try { await api.delete(`/api/foro/${id}/`); cargarPosts(); } catch(e){} };

  // --- LOGICA ENCUESTAS ---
  const cargarEncuestas = async () => { try { const res = await api.get('/api/encuestas/'); setEncuestas(res.data.results || res.data); } catch(e){} };
  
  const handleAddOpcion = () => setNuevaEncuesta({...nuevaEncuesta, opciones: [...nuevaEncuesta.opciones, '']});
  const handleRemoveOpcion = (idx) => { const ops = [...nuevaEncuesta.opciones]; ops.splice(idx,1); setNuevaEncuesta({...nuevaEncuesta, opciones: ops}); };
  const handleChangeOpcion = (val, idx) => { const ops = [...nuevaEncuesta.opciones]; ops[idx] = val; setNuevaEncuesta({...nuevaEncuesta, opciones: ops}); };

  const crearEncuesta = async () => {
      if(!nuevaEncuesta.titulo || nuevaEncuesta.opciones.some(op => !op.trim())) {
          enqueueSnackbar("Completa el título y las opciones", {variant:'warning'}); return;
      }
      try {
          await api.post('/api/encuestas/', {
              titulo: nuevaEncuesta.titulo,
              descripcion: nuevaEncuesta.descripcion,
              tipo_grafico: nuevaEncuesta.tipo_grafico,
              opciones_data: nuevaEncuesta.opciones
          }, { headers: { 'Authorization': `Token ${token}` } });
          enqueueSnackbar("Encuesta creada", {variant:'success'});
          setNuevaEncuesta({ titulo: '', descripcion: '', tipo_grafico: 'BARRA', opciones: ['', ''] });
          cargarEncuestas();
      } catch(e) { enqueueSnackbar("Error al crear encuesta", {variant:'error'}); }
  };

  const votarEncuesta = async (encuestaId, opcionId) => {
      try { 
          await api.post(`/api/encuestas/${encuestaId}/votar/`, { opcion: opcionId }, { headers: { 'Authorization': `Token ${token}` } }); 
          enqueueSnackbar("Voto registrado", {variant:'success'}); cargarEncuestas(); 
      } catch(e){ enqueueSnackbar(e.response?.data?.error || "Error al votar", {variant:'warning'}); }
  };

  const getPieChartStyle = (opciones, total) => {
      if(total === 0) return { background: '#e0e0e0' };
      let gradients = [];
      let currentDeg = 0;
      const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];
      
      opciones.forEach((op, index) => {
          const deg = (op.votos / total) * 360;
          gradients.push(`${colors[index % colors.length]} ${currentDeg}deg ${currentDeg + deg}deg`);
          currentDeg += deg;
      });
      return { background: `conic-gradient(${gradients.join(', ')})` };
  };

  // --- LOGICA QUEJAS ---
  const cargarQuejas = async () => { try { const res = await api.get('/api/quejas/'); setQuejas(res.data.results || res.data); } catch(e){} };
  const enviarQueja = async () => {
      if(!nuevaQueja.asunto) return;
      const fd = new FormData();
      fd.append('titulo', nuevaQueja.asunto); fd.append('descripcion', nuevaQueja.descripcion);
      if(evidenciaQueja) fd.append('foto', evidenciaQueja);
      try { await api.post('/api/quejas/', fd, { headers: { 'Authorization': `Token ${token}` } }); enqueueSnackbar("Reporte enviado", {variant:'success'}); setNuevaQueja({asunto:'', descripcion:''}); setEvidenciaQueja(null); cargarQuejas(); } catch(e){}
  };

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh', pb: 5 }}>
        <Box sx={{ position: 'relative', bgcolor: 'white', mb: 3, boxShadow: 1 }}>
            <Box sx={{ 
                height: { xs: 150, md: 250 }, 
                background: config.imagen_portada ? `url(${config.imagen_portada})` : 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
                backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'
            }}>
                {/* BOTÓN CON REDIRECCIÓN CORREGIDA */}
                <Button 
                    onClick={handleVolver} startIcon={<DashboardIcon />} variant="contained"
                    sx={{ position: 'absolute', top: 20, left: 20, zIndex: 100, bgcolor: 'rgba(255,255,255,0.9)', color: '#1565c0', fontWeight: 'bold', '&:hover': { bgcolor: '#fff' } }}
                >
                    {sessionUser.is_staff ? 'Panel Admin' : 'Mi Panel'}
                </Button>

                {sessionUser.is_staff && (
                    <Button component="label" variant="contained" size="small" startIcon={<EditIcon />} sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'white', color: 'black', '&:hover':{bgcolor:'#eee'}, zIndex: 100 }}>
                        Editar Portada <input type="file" hidden accept="image/*" onChange={cambiarPortada} />
                    </Button>
                )}
            </Box>
            <Container maxWidth="md">
                <Box display="flex" flexDirection={{xs:'column', md:'row'}} alignItems="center" mt={-4} mb={2} px={2}>
                    <Avatar src={sessionUser.avatar} sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: 2, zIndex: 10 }} />
                    <Box ml={{md:3}} mt={{xs:1, md:4}} textAlign={{xs:'center', md:'left'}}>
                        <Typography variant="h4" fontWeight="bold">{config.titulo_comunidad}</Typography>
                        <Typography variant="body1" color="text.secondary">Bienvenido, {sessionUser.first_name || 'vecino'}</Typography>
                    </Box>
                </Box>
                <Divider />
                <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered sx={{ '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', minHeight: 60 } }}>
                    <Tab label="Muro Social" icon={<CampaignIcon />} iconPosition="start" />
                    <Tab label="Encuestas" icon={<PollIcon />} iconPosition="start" />
                    <Tab label="Reportes" icon={<ReportProblemIcon />} iconPosition="start" />
                </Tabs>
            </Container>
        </Box>

        <Container maxWidth="md">
            {tabIndex === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <Box display="flex" gap={2}>
                                <Avatar src={sessionUser.avatar} />
                                <Box flexGrow={1}>
                                    <TextField fullWidth multiline rows={2} placeholder={`¿Qué pasa en la comunidad?`} variant="standard" InputProps={{ disableUnderline: true }} value={nuevoPost} onChange={(e) => setNuevoPost(e.target.value)} sx={{ bgcolor: '#f0f2f5', borderRadius: 4, px: 2, py: 1 }} />
                                    {previewPost && <Box mt={2}><img src={previewPost} alt="P" style={{ width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'cover' }} /><IconButton onClick={()=>{setImagenPost(null);setPreviewPost(null)}}><CancelIcon/></IconButton></Box>}
                                    <Divider sx={{ my: 2 }} />
                                    <Box display="flex" justifyContent="space-between">
                                        <Box display="flex" gap={1}>
                                            <IconButton color="primary" component="label"><input hidden type="file" onChange={(e)=>{if(e.target.files[0]){setImagenPost(e.target.files[0]); setPreviewPost(URL.createObjectURL(e.target.files[0]))}}} /><AddPhotoAlternateIcon /></IconButton>
                                            <Chip label="Social" size="small" onClick={()=>setTipoPost('SOCIAL')} color={tipoPost==='SOCIAL'?'primary':'default'} />
                                            <Chip label="Venta" size="small" onClick={()=>setTipoPost('VENTA')} color={tipoPost==='VENTA'?'success':'default'} />
                                        </Box>
                                        <Button variant="contained" onClick={handlePublicar} disabled={enviandoPost} sx={{ borderRadius: 5 }}>Publicar</Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    {posts.map(post => (
                        <Grid item xs={12} key={post.id}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardHeader avatar={<Avatar src={post.autor_avatar}>{post.autor_nombre?.[0]}</Avatar>} title={<Typography fontWeight="bold">{post.autor_nombre}</Typography>} subheader={new Date(post.fecha_creacion).toLocaleDateString()} action={post.tipo!=='SOCIAL' && <Chip label={post.tipo} size="small" color="primary" variant="outlined"/>} />
                                <CardContent><Typography>{post.contenido}</Typography></CardContent>
                                {post.imagen && <CardMedia component="img" image={post.imagen} sx={{ maxHeight: 500, objectFit: 'contain' }} />}
                                <CardActions><Button startIcon={<FavoriteBorderIcon />}>Like</Button>{(post.autor===sessionUser.id||sessionUser.is_staff)&&<Button color="error" onClick={()=>borrarPost(post.id)}>Borrar</Button>}</CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {tabIndex === 1 && (
                <Box>
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>🗳️ Crear Nueva Encuesta</Typography>
                        <TextField fullWidth label="Título de la pregunta" variant="outlined" size="small" sx={{ mb: 2 }} value={nuevaEncuesta.titulo} onChange={e=>setNuevaEncuesta({...nuevaEncuesta, titulo:e.target.value})} />
                        <TextField fullWidth label="Descripción (Opcional)" variant="outlined" multiline rows={2} size="small" sx={{ mb: 2 }} value={nuevaEncuesta.descripcion} onChange={e=>setNuevaEncuesta({...nuevaEncuesta, descripcion:e.target.value})} />
                        
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Opciones de respuesta:</Typography>
                        {nuevaEncuesta.opciones.map((op, idx) => (
                            <Box key={idx} display="flex" gap={1} mb={1}>
                                <TextField fullWidth placeholder={`Opción ${idx + 1}`} size="small" value={op} onChange={e=>handleChangeOpcion(e.target.value, idx)} />
                                {nuevaEncuesta.opciones.length > 2 && <IconButton color="error" onClick={()=>handleRemoveOpcion(idx)}><RemoveCircleOutlineIcon/></IconButton>}
                            </Box>
                        ))}
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddOpcion} sx={{ mb: 2 }}>Agregar Opción</Button>

                        <Box display="flex" gap={2} mb={2} alignItems="center">
                             <Typography variant="body2">Visualización:</Typography>
                             <Chip icon={<BarChartIcon />} label="Barras" clickable color={nuevaEncuesta.tipo_grafico==='BARRA'?'primary':'default'} onClick={()=>setNuevaEncuesta({...nuevaEncuesta, tipo_grafico:'BARRA'})} />
                             <Chip icon={<PieChartIcon />} label="Pastel" clickable color={nuevaEncuesta.tipo_grafico==='PASTEL'?'secondary':'default'} onClick={()=>setNuevaEncuesta({...nuevaEncuesta, tipo_grafico:'PASTEL'})} />
                        </Box>
                        
                        <Button variant="contained" onClick={crearEncuesta} sx={{ borderRadius: 5 }}>Lanzar Encuesta</Button>
                    </Paper>

                    {encuestas.map(enc => (
                        <Card key={enc.id} sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
                            <CardHeader 
                                avatar={<Avatar src={enc.autor_avatar}>{enc.autor_nombre?.[0]}</Avatar>}
                                title={<Typography fontWeight="bold">{enc.titulo}</Typography>}
                                subheader={`Publicado por ${enc.autor_nombre || 'Vecino'} • ${new Date(enc.fecha_inicio).toLocaleDateString()}`}
                            />
                            <CardContent>
                                <Typography paragraph color="text.secondary">{enc.descripcion}</Typography>
                                {enc.tipo_grafico === 'BARRA' && (
                                    <Box>
                                        {enc.opciones.map(op => {
                                            const pct = Math.round((op.votos / (enc.total_votos || 1)) * 100);
                                            return (
                                                <Box key={op.id} mb={2} onClick={() => !enc.ya_vote && votarEncuesta(enc.id, op.id)} sx={{ cursor: enc.ya_vote ? 'default' : 'pointer', '&:hover .bar-bg': { bgcolor: '#e3f2fd' } }}>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="body2" fontWeight="bold">{op.texto}</Typography>
                                                        <Typography variant="body2">{pct}% ({op.votos})</Typography>
                                                    </Box>
                                                    <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 5 }} />
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                                {enc.tipo_grafico === 'PASTEL' && (
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={5} display="flex" justifyContent="center">
                                            <Box sx={{ 
                                                width: 150, height: 150, borderRadius: '50%', 
                                                ...getPieChartStyle(enc.opciones, enc.total_votos),
                                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                                            }} />
                                        </Grid>
                                        <Grid item xs={12} md={7}>
                                            {enc.opciones.map((op, idx) => {
                                                const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];
                                                const pct = Math.round((op.votos / (enc.total_votos || 1)) * 100);
                                                return (
                                                    <Box key={op.id} display="flex" alignItems="center" gap={1} mb={1} onClick={() => !enc.ya_vote && votarEncuesta(enc.id, op.id)} sx={{ cursor: enc.ya_vote ? 'default' : 'pointer' }}>
                                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: colors[idx % colors.length] }} />
                                                        <Typography variant="body2" flexGrow={1}>{op.texto}</Typography>
                                                        <Typography variant="caption" fontWeight="bold">{pct}%</Typography>
                                                        {!enc.ya_vote && <Radio size="small" checked={false} />}
                                                    </Box>
                                                )
                                            })}
                                        </Grid>
                                    </Grid>
                                )}
                                {enc.ya_vote && <Typography variant="caption" color="success.main" sx={{ mt: 2, display: 'block', textAlign:'center' }}>✓ Ya participaste en esta encuesta</Typography>}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {tabIndex === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                         <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" fontWeight="bold" color="error">Nuevo Reporte</Typography>
                            <TextField fullWidth label="Asunto" size="small" sx={{ my: 2 }} value={nuevaQueja.asunto} onChange={e=>setNuevaQueja({...nuevaQueja, asunto:e.target.value})} />
                            <TextField fullWidth label="Descripción" multiline rows={4} sx={{ mb: 2 }} value={nuevaQueja.descripcion} onChange={e=>setNuevaQueja({...nuevaQueja, descripcion:e.target.value})} />
                            <Button fullWidth component="label" variant="outlined" startIcon={<PhotoCamera />} sx={{ mb: 2 }}>
                                {evidenciaQueja ? "Evidencia cargada" : "Foto"} <input type="file" hidden onChange={e=>setEvidenciaQueja(e.target.files[0])} />
                            </Button>
                            <Button fullWidth variant="contained" color="error" onClick={enviarQueja}>Enviar</Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        {quejas.map(q => (
                            <Paper key={q.id} sx={{ p: 2, mb: 2, borderLeft: q.estado==='RESUELTO'?'4px solid green':'4px solid red' }}>
                                <Box display="flex" justifyContent="space-between"><Typography fontWeight="bold">{q.titulo}</Typography><Chip label={q.estado} size="small" color={q.estado==='RESUELTO'?'success':'error'} /></Box>
                                <Typography variant="body2">{q.descripcion}</Typography>
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