import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Box, Button, TextField, 
  Tabs, Tab, Card, CardContent, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Avatar, CardMedia, LinearProgress,
  Paper, Menu, MenuItem, Tooltip, Divider
} from '@mui/material';

import PollIcon from '@mui/icons-material/Poll';
import ForumIcon from '@mui/icons-material/Forum';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CampaignIcon from '@mui/icons-material/Campaign'; 
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam'; 
import ShareIcon from '@mui/icons-material/Share'; 

import {
  FacebookShareButton, FacebookIcon,
  WhatsappShareButton, WhatsappIcon,
  TwitterShareButton, TwitterIcon,
  EmailShareButton, EmailIcon
} from "react-share";

import { Chart } from "react-google-charts"; 
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

import portadaFija from '../assets/portada.png'; 

function Comunidad() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [infoComunidad, setInfoComunidad] = useState(null);
  const [encuestas, setEncuestas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [avisos, setAvisos] = useState([]); 

  const [openEditHeader, setOpenEditHeader] = useState(false);
  const [formHeader, setFormHeader] = useState({ titulo: '' });

  const [openEncuesta, setOpenEncuesta] = useState(false);
  const [nuevaEncuesta, setNuevaEncuesta] = useState({ titulo: '', descripcion: '' });
  const [opcionesDinamicas, setOpcionesDinamicas] = useState(["", ""]); 
  
  const [openPost, setOpenPost] = useState(false);
  const [formPost, setFormPost] = useState({ titulo: '', contenido: '', tipo: 'SOCIAL' });
  const [archivoImagenPost, setArchivoImagenPost] = useState(null); 
  const [archivoVideoPost, setArchivoVideoPost] = useState(null);   

  const [openEditPost, setOpenEditPost] = useState(false);
  const [idPostEditar, setIdPostEditar] = useState(null);
  const [formEditPost, setFormEditPost] = useState({ titulo: '', contenido: '' });

  const [anchorElShare, setAnchorElShare] = useState(null);
  const [postToShare, setPostToShare] = useState(null);
  const openShareMenu = Boolean(anchorElShare);

  const [openQueja, setOpenQueja] = useState(false);
  const [formQueja, setFormQueja] = useState({ asunto: '', descripcion: '' });
  const [archivoImagenQueja, setArchivoImagenQueja] = useState(null); 
  const [archivoVideoQueja, setArchivoVideoQueja] = useState(null);   

  const [openAviso, setOpenAviso] = useState(false);
  const [formAviso, setFormAviso] = useState({ titulo: '', mensaje: '' });

  const userDataStr = localStorage.getItem('user_data');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const userRol = localStorage.getItem('rol');
  const isAdmin = userData?.is_superuser || (userRol && (userRol.toLowerCase().includes('admin') || userRol.toLowerCase().includes('guardia')));

  const handleVolver = () => {
    if (isAdmin) {
        navigate('/admin-panel');
    } else {
        navigate('/dashboard');
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
        const resFracc = await api.get('/api/fraccionamientos/');
        const listaFracc = resFracc.data.results || resFracc.data;
        if (listaFracc && listaFracc.length > 0) {
            setInfoComunidad(listaFracc[0]);
        }
        if (tabIndex === 0) { 
             const res = await api.get('/api/avisos/');
             setAvisos(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else if (tabIndex === 1) { 
            const res = await api.get('/api/encuestas/');
            setEncuestas(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else if (tabIndex === 2) { 
            const res = await api.get('/api/foro/');
            setPosts(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else { 
            const res = await api.get('/api/quejas/');
            setQuejas(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, [tabIndex]);

  const handleShareClick = (event, post) => {
    setAnchorElShare(event.currentTarget);
    setPostToShare(post);
  };
  const handleShareClose = () => {
    setAnchorElShare(null);
    setPostToShare(null);
  };

  const crearAviso = async () => {
      if(!formAviso.titulo || !formAviso.mensaje) return alert("Llena todos los campos");
      try { 
          await api.post('/api/avisos/', formAviso); 
          setOpenAviso(false); setFormAviso({titulo:'', mensaje:''}); cargarDatos(); 
      } catch(e) { alert("Error al publicar aviso"); }
  };

  const borrarAviso = async (id) => { 
      if(!confirm("¿Borrar aviso?")) return; 
      try { await api.delete(`/api/avisos/${id}/`); cargarDatos(); } catch(e){ alert("Error"); } 
  };
  
  const handleOpenEditHeader = () => { 
      if(infoComunidad) setFormHeader({ titulo: infoComunidad.titulo_header || infoComunidad.nombre });
      setOpenEditHeader(true); 
  };

  const handleSaveHeader = async () => { 
      if(!infoComunidad) return; 
      const fd = new FormData(); 
      fd.append('titulo_header', formHeader.titulo); 
      try { 
          await api.patch(`/api/fraccionamientos/${infoComunidad.id}/`, fd); 
          setOpenEditHeader(false); cargarDatos(); 
      } catch(e) { console.error(e); } 
  };

  const handleOpcionChange = (i,v) => { const n=[...opcionesDinamicas]; n[i]=v; setOpcionesDinamicas(n); };
  
  const crearEncuesta = async () => { 
      try { await api.post('/api/encuestas/', { titulo: nuevaEncuesta.titulo, descripcion: nuevaEncuesta.descripcion, opciones: opcionesDinamicas }); setOpenEncuesta(false); cargarDatos(); } catch(e){ alert("Error"); } 
  };
  
  const votar = async (eId, oId) => { 
      try { await api.post(`/api/encuestas/${eId}/votar/`, { opcion_id: oId }); cargarDatos(); } catch(e){alert("Error");} 
  };
  
  const crearPost = async () => { 
      const fd = new FormData(); 
      fd.append('titulo', formPost.titulo); 
      fd.append('contenido', formPost.contenido); 
      fd.append('tipo', formPost.tipo); 
      if(archivoImagenPost) fd.append('imagen', archivoImagenPost); 
      if(archivoVideoPost) fd.append('video', archivoVideoPost); 
      try { 
          await api.post('/api/foro/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); 
          setOpenPost(false); setArchivoImagenPost(null); setArchivoVideoPost(null); cargarDatos(); 
      } catch(e){ alert("Error al subir el post"); } 
  };
  
  const borrarPost = async (id) => { 
      if(!confirm("¿Eliminar publicación?")) return; 
      try { await api.delete(`/api/foro/${id}/`); cargarDatos(); } catch (e) { alert("Error al eliminar."); } 
  };
  
  const abrirEditarPost = (post) => { setIdPostEditar(post.id); setFormEditPost({ titulo: post.titulo, contenido: post.contenido }); setOpenEditPost(true); };
  
  const guardarEdicionPost = async () => { 
      try { 
          await api.patch(`/api/foro/${idPostEditar}/`, formEditPost); 
          setOpenEditPost(false); cargarDatos(); 
      } catch (e) { alert("Error al editar."); } 
  };

  const crearQueja = async () => { 
      const fd = new FormData(); 
      fd.append('asunto', formQueja.asunto); 
      fd.append('descripcion', formQueja.descripcion); 
      if(archivoImagenQueja) fd.append('imagen', archivoImagenQueja); 
      if(archivoVideoQueja) fd.append('video', archivoVideoQueja); 
      try { 
          await api.post('/api/quejas/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); 
          setOpenQueja(false); setArchivoImagenQueja(null); setArchivoVideoQueja(null); cargarDatos(); 
      } catch(e){ alert("Error al enviar queja"); } 
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ position: 'relative', bgcolor: '#4a148c', color: 'white', backgroundImage: `url(${portadaFija})`, backgroundSize: 'cover', backgroundPosition: 'center', p: 4, pt: 8, pb: 8, boxShadow: 3 }}>
          <Box sx={{position:'absolute', top:0, left:0, width:'100%', height:'100%', bgcolor:'rgba(0,0,0,0.5)'}} />
          <Container sx={{position:'relative', zIndex:1}}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                  <Box display="flex" alignItems="center">
                    <IconButton edge="start" color="inherit" onClick={handleVolver} sx={{ mr: 2, bgcolor:'rgba(255,255,255,0.2)' }}><ArrowBackIcon /></IconButton>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" sx={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>{infoComunidad ? (infoComunidad.titulo_header || infoComunidad.nombre) : "Cargando..."}</Typography>
                      <Typography variant="subtitle1" sx={{opacity:0.9, textShadow: '1px 1px 2px black'}}>Espacio Vecinal</Typography>
                    </Box>
                  </Box>
                  {isAdmin && <Button variant="contained" color="secondary" startIcon={<EditIcon/>} onClick={handleOpenEditHeader} sx={{mt:{xs:2, md:0}}}>Editar Título</Button>}
              </Box>
          </Container>
      </Box>

      <Paper square elevation={1}>
          <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered indicatorColor="secondary" textColor="secondary" variant="scrollable" scrollButtons="auto">
              <Tab icon={<CampaignIcon/>} label="Avisos" />
              <Tab icon={<PollIcon/>} label="Encuestas" />
              <Tab icon={<ForumIcon/>} label="Foro" />
              <Tab icon={<FeedbackIcon/>} label="Quejas" />
          </Tabs>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading && <LinearProgress sx={{mb:2}} />}

        {/* TAB AVISOS */}
        {tabIndex === 0 && (
            <Grid container spacing={3}>
                {isAdmin && <Grid item xs={12} textAlign="right"><Button variant="contained" color="warning" startIcon={<CampaignIcon/>} onClick={()=>setOpenAviso(true)}>Nuevo Aviso</Button></Grid>}
                {avisos.map(av => (
                    <Grid item xs={12} key={av.id}>
                        <Card elevation={3} sx={{borderLeft: '6px solid #ff9800', bgcolor: '#fff3e0'}}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between"><Typography variant="h6" fontWeight="bold" color="warning.dark">📢 {av.titulo}</Typography>{isAdmin && <IconButton color="error" size="small" onClick={()=>borrarAviso(av.id)}><DeleteIcon/></IconButton>}</Box>
                                <Typography variant="body1" sx={{mt:1, whiteSpace:'pre-line'}}>{av.mensaje}</Typography>
                                <Typography variant="caption" display="block" sx={{mt:2, color:'text.secondary'}}>Publicado: {new Date(av.fecha_creacion).toLocaleDateString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        )}

        {/* TAB ENCUESTAS */}
        {tabIndex === 1 && (
            <Grid container spacing={3}>
                {isAdmin && <Grid item xs={12} textAlign="right"><Button variant="contained" color="secondary" startIcon={<AddIcon/>} onClick={()=>setOpenEncuesta(true)}>Nueva Encuesta</Button></Grid>}
                {encuestas.map(enc => {
                    const data = [["Opción", "Votos"], ...enc.opciones.map(o=>[o.texto, o.votos])];
                    const total = enc.opciones.reduce((a,b)=>a+b.votos, 0);
                    return (
                        <Grid item xs={12} md={6} key={enc.id}>
                            <Card elevation={3} sx={{borderRadius:3}}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" color="secondary">{enc.titulo}</Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>{enc.descripcion}</Typography>
                                    <Box sx={{ height: '200px', mb: 2 }}>{total > 0 ? <Chart chartType="PieChart" data={data} options={{title:`Total: ${total}`, is3D:true, backgroundColor:'transparent'}} width="100%" height="100%"/> : <Box height="100%" display="flex" alignItems="center" justifyContent="center" bgcolor="#eee"><Typography>Sin votos</Typography></Box>}</Box>
                                    <Box display="flex" flexWrap="wrap" gap={1}>{enc.opciones.map(op=><Button key={op.id} variant="outlined" size="small" onClick={()=>votar(enc.id, op.id)}>{op.texto}</Button>)}</Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        )}

        {/* TAB FORO (POSTS) */}
        {tabIndex === 2 && (
            <>
                <Button variant="contained" onClick={() => setOpenPost(true)} sx={{mb:2}}>Publicar Post</Button>
                {posts.map(p => {
                    const isMyPost = p.autor_nombre === userData?.username;
                    const canEdit = isAdmin || isMyPost;
                    return (
                        <Card key={p.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Avatar src={p.autor_avatar}>{p.autor_nombre?.[0]}</Avatar>
                                    <Box>
                                        <Typography fontWeight="bold">{p.autor_nombre}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(p.fecha).toLocaleDateString()}</Typography>
                                    </Box>
                                    
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label={p.tipo} size="small" />
                                        <Tooltip title="Compartir">
                                            <IconButton size="small" color="primary" onClick={(e) => handleShareClick(e, p)}>
                                                <ShareIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {canEdit && (
                                            <>
                                                <IconButton size="small" onClick={() => abrirEditarPost(p)}><EditIcon fontSize="small" /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => borrarPost(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                                <Typography variant="h6">{p.titulo}</Typography>
                                <Typography sx={{mb:1, whiteSpace: 'pre-line'}}>{p.contenido}</Typography>
                                {p.imagen && <CardMedia component="img" image={p.imagen} sx={{height:200, objectFit:'contain', borderRadius:1, mb:1}}/>}
                                {p.video && ( <Box sx={{mt:1}}><video src={p.video} controls style={{width:'100%', maxHeight:'300px', borderRadius:'8px'}} /></Box>)}
                            </CardContent>
                        </Card>
                    );
                })}
            </>
        )}

        {/* TAB QUEJAS */}
        {tabIndex === 3 && (
            <>
                <Button variant="contained" color="error" onClick={() => setOpenQueja(true)} sx={{mb:2}}>Nueva Queja</Button>
                {quejas.map(q => (
                    <Card key={q.id} sx={{ mb: 2, borderLeft: '5px solid orange' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between"><Typography variant="h6">{q.asunto}</Typography><Chip label={q.estado} size="small" color={q.estado==='RESUELTO'?'success':'warning'}/></Box>
                            <Typography variant="body2" paragraph>{q.descripcion}</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {q.imagen && <img src={q.imagen} alt="evidencia" style={{height:100, borderRadius:4}} />}
                              {q.video && <video src={q.video} controls style={{height:100, borderRadius:4}} />}
                            </Box>
                            {q.respuesta_admin && <Box sx={{mt:1, p:1, bgcolor:'#e8f5e9'}}><Typography variant="caption" color="success">Respuesta: {q.respuesta_admin}</Typography></Box>}
                        </CardContent>
                    </Card>
                ))}
            </>
        )}
      </Container>

      {/* MENÚ COMPARTIR */}
      <Menu anchorEl={anchorElShare} open={openShareMenu} onClose={handleShareClose}>
        <MenuItem onClick={handleShareClose}>
           <WhatsappShareButton url={window.location.href} title={`*${postToShare?.titulo}*\n${postToShare?.contenido}`} separator=" - " style={{display:'flex', alignItems:'center'}}>
               <WhatsappIcon size={32} round style={{marginRight: 10}} /><Typography>WhatsApp</Typography>
           </WhatsappShareButton>
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
           <FacebookShareButton url={window.location.href} quote={postToShare?.titulo} style={{display:'flex', alignItems:'center'}}>
               <FacebookIcon size={32} round style={{marginRight: 10}} /><Typography>Facebook</Typography>
           </FacebookShareButton>
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
           <TwitterShareButton url={window.location.href} title={postToShare?.titulo} style={{display:'flex', alignItems:'center'}}>
               <TwitterIcon size={32} round style={{marginRight: 10}} /><Typography>Twitter</Typography>
           </TwitterShareButton>
        </MenuItem>
      </Menu>

      {/* MODALES */}
      <Dialog open={openEditHeader} onClose={()=>setOpenEditHeader(false)}><DialogTitle>Personalizar Título</DialogTitle><DialogContent><TextField margin="dense" label="Título" fullWidth value={formHeader.titulo} onChange={(e)=>setFormHeader({...formHeader, titulo:e.target.value})} /></DialogContent><DialogActions><Button onClick={()=>setOpenEditHeader(false)}>Cancelar</Button><Button onClick={handleSaveHeader} variant="contained">Guardar</Button></DialogActions></Dialog>
      <Dialog open={openAviso} onClose={()=>setOpenAviso(false)} fullWidth maxWidth="sm"><DialogTitle sx={{bgcolor:'#ff9800', color:'white'}}>Nuevo Aviso</DialogTitle><DialogContent sx={{mt:2}}><TextField label="Título" fullWidth value={formAviso.titulo} onChange={(e)=>setFormAviso({...formAviso, titulo:e.target.value})} sx={{mb:2}} /><TextField label="Mensaje" multiline rows={4} fullWidth value={formAviso.mensaje} onChange={(e)=>setFormAviso({...formAviso, mensaje:e.target.value})} /></DialogContent><DialogActions><Button onClick={()=>setOpenAviso(false)}>Cancelar</Button><Button onClick={crearAviso} variant="contained" color="warning">Publicar</Button></DialogActions></Dialog>
      <Dialog open={openEncuesta} onClose={()=>setOpenEncuesta(false)}><DialogTitle>Nueva Encuesta</DialogTitle><DialogContent><TextField fullWidth label="Título" value={nuevaEncuesta.titulo} onChange={(e)=>setNuevaEncuesta({...nuevaEncuesta, titulo:e.target.value})}/><Box mt={1}>{opcionesDinamicas.map((op,i)=><TextField key={i} fullWidth size="small" placeholder={`Opción ${i+1}`} value={op} onChange={(e)=>handleOpcionChange(i,e.target.value)} sx={{mb:1}}/>)}<Button onClick={()=>setOpcionesDinamicas([...opcionesDinamicas,""])}>+ Opción</Button></Box></DialogContent><DialogActions><Button onClick={crearEncuesta}>Publicar</Button></DialogActions></Dialog>
      <Dialog open={openPost} onClose={()=>setOpenPost(false)} fullWidth maxWidth="sm"><DialogTitle>Nuevo Post</DialogTitle><DialogContent><TextField fullWidth label="Título" margin="dense" onChange={(e)=>setFormPost({...formPost, titulo:e.target.value})}/><TextField fullWidth multiline rows={3} margin="dense" label="Contenido" onChange={(e)=>setFormPost({...formPost, contenido:e.target.value})}/><Box display="flex" gap={2} mt={2}><Button variant="outlined" component="label" startIcon={<PhotoCamera/>}>{archivoImagenPost ? "Foto Lista" : "Foto"}<input type="file" hidden accept="image/*" onChange={(e)=>setArchivoImagenPost(e.target.files[0])}/></Button><Button variant="outlined" component="label" startIcon={<VideocamIcon/>}>{archivoVideoPost ? "Video Listo" : "Video"}<input type="file" hidden accept="video/*" onChange={(e)=>setArchivoVideoPost(e.target.files[0])}/></Button></Box></DialogContent><DialogActions><Button onClick={()=>setOpenPost(false)}>Cancelar</Button><Button onClick={crearPost} variant="contained">Publicar</Button></DialogActions></Dialog>
      <Dialog open={openEditPost} onClose={()=>setOpenEditPost(false)} fullWidth maxWidth="sm"><DialogTitle>Editar Post</DialogTitle><DialogContent><TextField fullWidth label="Título" margin="dense" value={formEditPost.titulo} onChange={(e)=>setFormEditPost({...formEditPost, titulo:e.target.value})}/><TextField fullWidth multiline rows={3} margin="dense" label="Contenido" value={formEditPost.contenido} onChange={(e)=>setFormEditPost({...formEditPost, contenido:e.target.value})}/></DialogContent><DialogActions><Button onClick={()=>setOpenEditPost(false)}>Cancelar</Button><Button onClick={guardarEdicionPost} variant="contained" color="primary">Guardar</Button></DialogActions></Dialog>
      <Dialog open={openQueja} onClose={()=>setOpenQueja(false)} fullWidth maxWidth="sm"><DialogTitle>Nueva Queja</DialogTitle><DialogContent><TextField fullWidth label="Asunto" margin="dense" onChange={(e)=>setFormQueja({...formQueja, asunto:e.target.value})}/><TextField fullWidth multiline rows={3} margin="dense" label="Detalles" onChange={(e)=>setFormQueja({...formQueja, descripcion:e.target.value})}/><Typography variant="caption" display="block" sx={{mt:2, mb:1}}>Evidencia:</Typography><Box display="flex" gap={2}><Button variant="outlined" component="label" startIcon={<PhotoCamera/>}>{archivoImagenQueja ? "Imagen OK" : "Foto"}<input type="file" hidden accept="image/*" onChange={(e)=>setArchivoImagenQueja(e.target.files[0])}/></Button><Button variant="outlined" component="label" startIcon={<VideocamIcon/>}>{archivoVideoQueja ? "Video OK" : "Video"}<input type="file" hidden accept="video/*" onChange={(e)=>setArchivoVideoQueja(e.target.files[0])}/></Button></Box></DialogContent><DialogActions><Button onClick={()=>setOpenQueja(false)}>Cancelar</Button><Button onClick={crearQueja} variant="contained" color="error">Enviar</Button></DialogActions></Dialog>
    </Box>
  );
}

export default Comunidad;