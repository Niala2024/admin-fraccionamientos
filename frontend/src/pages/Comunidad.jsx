import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Avatar, IconButton, Card, CardHeader, CardContent, CardMedia, 
  CardActions, Divider, CircularProgress, Tabs, Tab, Chip,
  FormControl, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import SendIcon from '@mui/icons-material/Send';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import StorefrontIcon from '@mui/icons-material/Storefront'; 
import HandymanIcon from '@mui/icons-material/Handyman'; 
import CampaignIcon from '@mui/icons-material/Campaign'; 
import PollIcon from '@mui/icons-material/Poll'; 
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; 
import CancelIcon from '@mui/icons-material/Cancel';

import api from '../api/axiosConfig'; 

function Comunidad() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [tabIndex, setTabIndex] = useState(0);

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
    cargarDatos();
  }, [tabIndex]);

  const cargarDatos = () => {
      if (tabIndex === 0) cargarPosts();
      if (tabIndex === 1) cargarEncuestas();
      if (tabIndex === 2) cargarQuejas();
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
          // ✅ CORRECCIÓN: No definimos Content-Type manualmente, Axios lo hace automático
          await api.post('/api/foro/', formData, {
              headers: { 'Authorization': `Token ${token}` }
          });
          enqueueSnackbar("Publicado", { variant: 'success' });
          setNuevoPost(''); setImagenPost(null); setPreviewPost(null); setTipoPost('SOCIAL');
          cargarPosts();
      } catch (e) { 
          enqueueSnackbar("Error al publicar", { variant: 'error' }); 
      } finally { setEnviandoPost(false); }
  };

  const borrarPost = async (id) => {
      if(!confirm("¿Eliminar?")) return;
      try { await api.delete(`/api/foro/${id}/`); cargarPosts(); } catch(e){}
  };

  // --- Encuestas ---
  const cargarEncuestas = async () => {
      try { const res = await api.get('/api/encuestas/'); setEncuestas(res.data.results || res.data); } catch(e){}
  };
  const votarEncuesta = async (encuestaId, opcionId) => {
      try { await api.post(`/api/encuestas/${encuestaId}/votar/`, { opcion: opcionId }); enqueueSnackbar("Voto registrado", {variant:'success'}); cargarEncuestas(); } catch(e){ enqueueSnackbar("Error al votar", {variant:'warning'}); }
  };

  // --- Quejas ---
  const cargarQuejas = async () => {
      try { const res = await api.get('/api/quejas/'); setQuejas(res.data.results || res.data); } catch(e){}
  };
  const enviarQueja = async () => {
      if(!nuevaQueja.asunto) return;
      const fd = new FormData();
      fd.append('titulo', nuevaQueja.asunto); fd.append('descripcion', nuevaQueja.descripcion);
      if(evidenciaQueja) fd.append('foto', evidenciaQueja);
      try { await api.post('/api/quejas/', fd); enqueueSnackbar("Reporte enviado", {variant:'success'}); setNuevaQueja({asunto:'', descripcion:''}); setEvidenciaQueja(null); cargarQuejas(); } catch(e){}
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 10 }}>
        <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>Atrás</Button>
            <Typography variant="h5" fontWeight="900" sx={{ color: '#1976d2' }}>COMUNIDAD</Typography>
            <Avatar src={sessionUser.avatar} sx={{ width: 40, height: 40 }} />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, mb: 3, border: '1px solid #e0e0e0', overflow:'hidden' }}>
            <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="fullWidth" textColor="primary" indicatorColor="primary">
                <Tab icon={<CampaignIcon />} label="Muro" iconPosition="start" />
                <Tab icon={<PollIcon />} label="Encuestas" iconPosition="start" />
                <Tab icon={<ReportProblemIcon />} label="Quejas" iconPosition="start" />
            </Tabs>
        </Paper>

        {tabIndex === 0 && (
            <>
                <Paper elevation={3} sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                    <Box display="flex" gap={2}>
                        <Avatar src={sessionUser.avatar} sx={{ width: 45, height: 45 }} />
                        <Box flexGrow={1}>
                            <TextField fullWidth multiline rows={2} placeholder={`Comparte algo, ${sessionUser.first_name || 'vecino'}...`} variant="standard" InputProps={{ disableUnderline: true }} value={nuevoPost} onChange={(e) => setNuevoPost(e.target.value)} />
                            {previewPost && <Box mt={2}><img src={previewPost} alt="Preview" style={{ width: '100%', borderRadius: 8 }} /><IconButton onClick={() => { setImagenPost(null); setPreviewPost(null); }} sx={{ position: 'absolute', mt: -35, ml: 1, bgcolor: 'white' }}><CancelIcon /></IconButton></Box>}
                            <Divider sx={{ my: 1.5 }} />
                            <Grid container alignItems="center" justifyContent="space-between">
                                <Grid item display="flex" gap={1}>
                                    <Chip icon={<ChatBubbleOutlineIcon/>} label="Social" size="small" color={tipoPost==='SOCIAL'?'primary':'default'} onClick={()=>setTipoPost('SOCIAL')} clickable />
                                    <Chip icon={<StorefrontIcon/>} label="Venta" size="small" color={tipoPost==='VENTA'?'success':'default'} onClick={()=>setTipoPost('VENTA')} clickable />
                                    <Chip icon={<HandymanIcon/>} label="Servicio" size="small" color={tipoPost==='SERVICIO'?'warning':'default'} onClick={()=>setTipoPost('SERVICIO')} clickable />
                                </Grid>
                                <Grid item display="flex" gap={1}>
                                    <IconButton color="primary" component="label"><input hidden accept="image/*" type="file" onChange={handleImagenChange} /><PhotoCamera /></IconButton>
                                    <Button variant="contained" endIcon={enviandoPost ? <CircularProgress size={20} color="inherit"/> : <SendIcon />} onClick={handlePublicar} disabled={enviandoPost || (!nuevoPost && !imagenPost)} sx={{ borderRadius: 5 }}>Publicar</Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Paper>

                {loadingPosts ? <CircularProgress /> : posts.map(post => (
                    <Card key={post.id} sx={{ mb: 3, borderRadius: 3 }} elevation={1}>
                        <CardHeader
                            avatar={<Avatar src={post.autor_avatar}>{post.autor_nombre?.[0]}</Avatar>}
                            action={post.tipo !== 'SOCIAL' && <Chip label={post.tipo} size="small" color={post.tipo === 'VENTA' ? 'success' : 'warning'} />}
                            title={<Typography fontWeight="bold">{post.autor_nombre}</Typography>}
                            subheader={new Date(post.fecha_creacion).toLocaleString()}
                        />
                        <CardContent sx={{ py: 1 }}><Typography sx={{whiteSpace:'pre-line'}}>{post.contenido}</Typography></CardContent>
                        {post.imagen && <CardMedia component="img" image={post.imagen} sx={{ maxHeight: 500, objectFit: 'cover' }} />}
                        <CardActions><Button startIcon={<FavoriteBorderIcon />}>Me gusta</Button>{(post.autor===sessionUser.id || sessionUser.is_staff) && <Button color="error" onClick={()=>borrarPost(post.id)}>Borrar</Button>}</CardActions>
                    </Card>
                ))}
            </>
        )}

        {tabIndex === 1 && (
            <Box>
                {encuestas.map(enc => (
                    <Card key={enc.id} sx={{ mb: 3, borderRadius: 3, borderTop: '4px solid #9c27b0' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold">{enc.titulo}</Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>{enc.descripcion}</Typography>
                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup>
                                    {enc.opciones.map(op => {
                                        const porcentaje = Math.round((op.votos / (enc.total_votos || 1)) * 100);
                                        return (
                                            <Box key={op.id} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 2, background: `linear-gradient(90deg, #f3e5f5 ${porcentaje}%, white ${porcentaje}%)` }}>
                                                <FormControlLabel value={op.id} control={<Radio onClick={() => votarEncuesta(enc.id, op.id)} />} label={`${op.texto} (${porcentaje}%)`} />
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

        {tabIndex === 2 && (
            <Box>
                <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '6px solid #d32f2f', mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="error">Reportar Incidencia</Typography>
                    <TextField fullWidth label="Asunto" variant="filled" size="small" sx={{ mb: 2 }} value={nuevaQueja.asunto} onChange={e=>setNuevaQueja({...nuevaQueja, asunto:e.target.value})} />
                    <TextField fullWidth label="Descripción" variant="filled" multiline rows={3} sx={{ mb: 2 }} value={nuevaQueja.descripcion} onChange={e=>setNuevaQueja({...nuevaQueja, descripcion:e.target.value})} />
                    <Box display="flex" justifyContent="space-between">
                        <Button component="label" startIcon={<PhotoCamera />}>{evidenciaQueja ? "Foto Lista" : "Foto Evidencia"}<input type="file" hidden accept="image/*" onChange={e=>setEvidenciaQueja(e.target.files[0])} /></Button>
                        <Button variant="contained" color="error" onClick={enviarQueja}>Enviar</Button>
                    </Box>
                </Paper>
                {quejas.map(q => (<Paper key={q.id} sx={{p:2, mb:2}}><Typography fontWeight="bold">{q.titulo}</Typography><Typography variant="body2">{q.descripcion}</Typography><Chip label={q.estado} size="small" sx={{mt:1}}/></Paper>))}
            </Box>
        )}
    </Container>
  );
}
export default Comunidad;