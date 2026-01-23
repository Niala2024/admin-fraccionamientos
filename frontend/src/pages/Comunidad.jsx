import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Typography, Box, Button, TextField, 
  Tabs, Tab, Card, CardContent, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Avatar, CardMedia, LinearProgress,
  Paper
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

import { Chart } from "react-google-charts"; 
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

// 👇 AQUÍ ESTÁ LA CLAVE: Importamos la imagen desde TUS carpetas
import portadaFija from '../assets/portada.png'; 
// NOTA: Si tu imagen es .jpg, cambia la línea de arriba a: '../assets/portada.jpg'

function Comunidad() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [infoComunidad, setInfoComunidad] = useState(null);
  const [encuestas, setEncuestas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [quejas, setQuejas] = useState([]);
  const [avisos, setAvisos] = useState([]); 

  // Header (Solo edición de título)
  const [openEditHeader, setOpenEditHeader] = useState(false);
  const [formHeader, setFormHeader] = useState({ titulo: '' });

  // Encuestas
  const [openEncuesta, setOpenEncuesta] = useState(false);
  const [nuevaEncuesta, setNuevaEncuesta] = useState({ titulo: '', descripcion: '' });
  const [opcionesDinamicas, setOpcionesDinamicas] = useState(["", ""]); 
  
  // Post (Foro)
  const [openPost, setOpenPost] = useState(false);
  const [formPost, setFormPost] = useState({ titulo: '', contenido: '', tipo: 'SOCIAL' });
  const [archivoImagenPost, setArchivoImagenPost] = useState(null); 
  const [archivoVideoPost, setArchivoVideoPost] = useState(null);   

  // Quejas
  const [openQueja, setOpenQueja] = useState(false);
  const [formQueja, setFormQueja] = useState({ asunto: '', descripcion: '' });
  const [archivoImagenQueja, setArchivoImagenQueja] = useState(null); 
  const [archivoVideoQueja, setArchivoVideoQueja] = useState(null);   

  // Avisos
  const [openAviso, setOpenAviso] = useState(false);
  const [formAviso, setFormAviso] = useState({ titulo: '', mensaje: '' });

  const userDataStr = localStorage.getItem('user_data');
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const userRol = localStorage.getItem('rol');
  
  const isAdmin = userData?.is_superuser || (userRol && (userRol.toLowerCase().includes('admin') || userRol.toLowerCase().includes('guardia')));

  const handleVolver = () => {
    if (userData?.is_superuser === true || (userRol && userRol.toLowerCase().includes('admin'))) {
        navigate('/admin-panel');
    } else {
        navigate('/dashboard');
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    
    const headers = { 'Authorization': `Token ${token}` };
    try {
        const resFracc = await api.get('/api/fraccionamientos/', { headers });
        const listaFracc = resFracc.data.results || resFracc.data;
        if (listaFracc && listaFracc.length > 0) {
            setInfoComunidad(listaFracc[0]);
        }

        if (tabIndex === 0) { 
             const res = await api.get('/api/avisos/', { headers });
             setAvisos(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else if (tabIndex === 1) { 
            const res = await api.get('/api/encuestas/', { headers });
            setEncuestas(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else if (tabIndex === 2) { 
            const res = await api.get('/api/foro/', { headers });
            setPosts(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        } else { 
            const res = await api.get('/api/quejas/', { headers });
            setQuejas(Array.isArray(res.data.results || res.data) ? (res.data.results || res.data) : []);
        }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, [tabIndex]);

  // --- ACCIONES ---
  const crearAviso = async () => {
      if(!formAviso.titulo || !formAviso.mensaje) return alert("Llena todos los campos");
      try {
          await api.post('/api/avisos/', formAviso, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          setOpenAviso(false); setFormAviso({titulo:'', mensaje:''}); cargarDatos(); alert("Aviso publicado");
      } catch(e) { alert("Error al publicar aviso"); }
  };
  const borrarAviso = async (id) => {
      if(!confirm("¿Borrar este aviso?")) return;
      try { await api.delete(`/api/avisos/${id}/`, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }); cargarDatos(); } catch(e){ alert("Error"); }
  };

  const handleOpenEditHeader = () => { 
      if(infoComunidad) { setFormHeader({ titulo: infoComunidad.titulo_header || infoComunidad.nombre }); } 
      setOpenEditHeader(true); 
  };
  
  // ✅ SOLO GUARDAMOS EL TÍTULO (Texto simple, sin problemas de archivos)
  const handleSaveHeader = async () => {
      if(!infoComunidad) return; 
      
      const formData = new FormData();
      formData.append('titulo_header', formHeader.titulo); 
      
      try { 
          await api.patch(`/api/fraccionamientos/${infoComunidad.id}/`, formData, { 
              headers: { Authorization: `Token ${localStorage.getItem('token')}` } 
          }); 
          
          alert("Título actualizado correctamente"); 
          setOpenEditHeader(false); 
          cargarDatos(); 
      } catch(e) { 
          console.error(e);
          alert("Error al actualizar título"); 
      }
  };

  const handleOpcionChange = (i,v) => { const n=[...opcionesDinamicas]; n[i]=v; setOpcionesDinamicas(n); };
  const crearEncuesta = async () => { try { await api.post('/api/encuestas/', { titulo: nuevaEncuesta.titulo, descripcion: nuevaEncuesta.descripcion, opciones: opcionesDinamicas }, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }); setOpenEncuesta(false); cargarDatos(); } catch(e){ alert("Error"); } };
  const votar = async (eId, oId) => { try { await api.post(`/api/encuestas/${eId}/votar/`, { opcion_id: oId }, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }); alert("Voto OK"); cargarDatos(); } catch(e){alert("Error");} };
  
  const crearPost = async () => { 
      const fd = new FormData(); 
      fd.append('titulo',formPost.titulo); 
      fd.append('contenido',formPost.contenido); 
      fd.append('tipo',formPost.tipo); 
      if(archivoImagenPost) fd.append('imagen', archivoImagenPost);
      if(archivoVideoPost) fd.append('video', archivoVideoPost); 

      // Para posts y quejas sí dejamos el undefined para que suban archivos si quieren
      try { await api.post('/api/foro/', fd, { headers: { Authorization: `Token ${localStorage.getItem('token')}`, 'Content-Type': undefined } }); 
      setOpenPost(false); setArchivoImagenPost(null); setArchivoVideoPost(null); cargarDatos(); } catch(e){ alert("Error al publicar"); } 
  };

  const crearQueja = async () => { 
      const fd = new FormData();
      fd.append('asunto', formQueja.asunto);
      fd.append('descripcion', formQueja.descripcion);
      if(archivoImagenQueja) fd.append('imagen', archivoImagenQueja);
      if(archivoVideoQueja) fd.append('video', archivoVideoQueja);

      try { await api.post('/api/quejas/', fd, { headers: { Authorization: `Token ${localStorage.getItem('token')}`, 'Content-Type': undefined } }); 
      setOpenQueja(false); setArchivoImagenQueja(null); setArchivoVideoQueja(null); alert("Queja Enviada"); cargarDatos(); } catch(e){ alert("Error al enviar queja"); } 
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      
      {/* HEADER PORTADA */}
      <Box 
        sx={{ 
            position: 'relative', 
            bgcolor: '#4a148c', 
            color: 'white', 
            // ✅ USAMOS LA VARIABLE IMPORTADA DIRECTAMENTE
            backgroundImage: `url(${portadaFija})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            p: 4, pt: 8, pb: 8, 
            boxShadow: 3 
        }}
      >
          {/* Capa oscura para que se lea el texto */}
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

        {/* CONTENIDO DE TABS... */}
        {tabIndex === 0 && (
            <Grid container spacing={3}>
                {isAdmin && <Grid item xs={12} textAlign="right"><Button variant="contained" color="warning" startIcon={<CampaignIcon/>} onClick={()=>setOpenAviso(true)}>Nuevo Aviso</Button></Grid>}
                {avisos.length === 0 && !loading && <Typography sx={{mt:4, width:'100%', textAlign:'center'}} color="text.secondary">No hay avisos recientes.</Typography>}
                {avisos.map(av => (
                    <Grid item xs={12} key={av.id}>
                        <Card elevation={3} sx={{borderLeft: '6px solid #ff9800', bgcolor: '#fff3e0'}}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight="bold" color="warning.dark">📢 {av.titulo}</Typography>
                                    {isAdmin && <IconButton color="error" size="small" onClick={()=>borrarAviso(av.id)}><DeleteIcon/></IconButton>}
                                </Box>
                                <Typography variant="body1" sx={{mt:1, whiteSpace:'pre-line'}}>{av.mensaje}</Typography>
                                <Typography variant="caption" display="block" sx={{mt:2, color:'text.secondary'}}>Publicado el: {new Date(av.fecha_creacion).toLocaleDateString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        )}
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
                                    <Box sx={{ height: '200px', mb: 2 }}>
                                        {total > 0 ? <Chart chartType="PieChart" data={data} options={{title:`Total: ${total}`, is3D:true, backgroundColor:'transparent'}} width="100%" height="100%"/> : <Box height="100%" display="flex" alignItems="center" justifyContent="center" bgcolor="#eee"><Typography>Sin votos</Typography></Box>}
                                    </Box>
                                    <Box display="flex" flexWrap="wrap" gap={1}>{enc.opciones.map(op=><Button key={op.id} variant="outlined" size="small" onClick={()=>votar(enc.id, op.id)}>{op.texto}</Button>)}</Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        )}
        {tabIndex === 2 && (
            <>
                <Button variant="contained" onClick={() => setOpenPost(true)} sx={{mb:2}}>Publicar Post</Button>
                {posts.map(p => (
                    <Card key={p.id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Avatar src={p.autor_avatar}>{p.autor_nombre?.[0]}</Avatar>
                                <Typography fontWeight="bold">{p.autor_nombre}</Typography>
                                <Chip label={p.tipo} size="small" sx={{ml:'auto'}}/>
                            </Box>
                            <Typography variant="h6">{p.titulo}</Typography>
                            <Typography sx={{mb:1}}>{p.contenido}</Typography>
                            {p.imagen && <CardMedia component="img" image={p.imagen} sx={{height:200, objectFit:'contain', borderRadius:1, mb:1}}/>}
                            {p.video && ( <Box sx={{mt:1}}><video src={p.video} controls style={{width:'100%', maxHeight:'300px', borderRadius:'8px'}} /></Box>)}
                        </CardContent>
                    </Card>
                ))}
            </>
        )}
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

      {/* --- MODALES --- */}

      {/* EDITAR TÍTULO (SIN FOTO, YA QUE ES FIJA) */}
      <Dialog open={openEditHeader} onClose={()=>setOpenEditHeader(false)}>
          <DialogTitle>Personalizar Título</DialogTitle>
          <DialogContent>
              <Typography variant="caption" color="text.secondary" sx={{mb:2, display:'block'}}>
                 La imagen de fondo es fija. Aquí puedes cambiar el texto del título.
              </Typography>
              <TextField margin="dense" label="Título del Encabezado" fullWidth value={formHeader.titulo} onChange={(e)=>setFormHeader({...formHeader, titulo:e.target.value})} />
          </DialogContent>
          <DialogActions>
              <Button onClick={()=>setOpenEditHeader(false)}>Cancelar</Button>
              <Button onClick={handleSaveHeader} variant="contained">Guardar</Button>
          </DialogActions>
      </Dialog>
      
      {/* RESTO DE MODALES SIN CAMBIOS... */}
      <Dialog open={openAviso} onClose={()=>setOpenAviso(false)} fullWidth maxWidth="sm"><DialogTitle sx={{bgcolor:'#ff9800', color:'white'}}>Nuevo Aviso General</DialogTitle><DialogContent sx={{mt:2}}><TextField label="Título del Aviso" fullWidth value={formAviso.titulo} onChange={(e)=>setFormAviso({...formAviso, titulo:e.target.value})} sx={{mb:2}} /><TextField label="Mensaje" multiline rows={4} fullWidth value={formAviso.mensaje} onChange={(e)=>setFormAviso({...formAviso, mensaje:e.target.value})} /></DialogContent><DialogActions><Button onClick={()=>setOpenAviso(false)}>Cancelar</Button><Button onClick={crearAviso} variant="contained" color="warning">Publicar</Button></DialogActions></Dialog>
      <Dialog open={openEncuesta} onClose={()=>setOpenEncuesta(false)}><DialogTitle>Nueva Encuesta</DialogTitle><DialogContent><TextField fullWidth label="Título" value={nuevaEncuesta.titulo} onChange={(e)=>setNuevaEncuesta({...nuevaEncuesta, titulo:e.target.value})}/><Box mt={1}>{opcionesDinamicas.map((op,i)=><TextField key={i} fullWidth size="small" placeholder={`Opción ${i+1}`} value={op} onChange={(e)=>handleOpcionChange(i,e.target.value)} sx={{mb:1}}/>)}<Button onClick={()=>setOpcionesDinamicas([...opcionesDinamicas,""])}>+ Opción</Button></Box></DialogContent><DialogActions><Button onClick={crearEncuesta}>Publicar</Button></DialogActions></Dialog>
      <Dialog open={openPost} onClose={()=>setOpenPost(false)} fullWidth maxWidth="sm"><DialogTitle>Nuevo Post</DialogTitle><DialogContent><TextField fullWidth label="Título" margin="dense" onChange={(e)=>setFormPost({...formPost, titulo:e.target.value})}/><TextField fullWidth multiline rows={3} margin="dense" label="Contenido" onChange={(e)=>setFormPost({...formPost, contenido:e.target.value})}/><Box display="flex" gap={2} mt={2}><Button variant="outlined" component="label" startIcon={<PhotoCamera/>}>{archivoImagenPost ? "Foto Seleccionada" : "Foto"}<input type="file" hidden accept="image/*" onChange={(e)=>setArchivoImagenPost(e.target.files[0])}/></Button><Button variant="outlined" component="label" startIcon={<VideocamIcon/>}>{archivoVideoPost ? "Video Seleccionado" : "Video"}<input type="file" hidden accept="video/*" onChange={(e)=>setArchivoVideoPost(e.target.files[0])}/></Button></Box></DialogContent><DialogActions><Button onClick={()=>setOpenPost(false)}>Cancelar</Button><Button onClick={crearPost} variant="contained">Publicar</Button></DialogActions></Dialog>
      <Dialog open={openQueja} onClose={()=>setOpenQueja(false)} fullWidth maxWidth="sm"><DialogTitle>Nueva Queja</DialogTitle><DialogContent><TextField fullWidth label="Asunto" margin="dense" onChange={(e)=>setFormQueja({...formQueja, asunto:e.target.value})}/><TextField fullWidth multiline rows={3} margin="dense" label="Detalle de la queja" onChange={(e)=>setFormQueja({...formQueja, descripcion:e.target.value})}/><Typography variant="caption" display="block" sx={{mt:2, mb:1}}>Evidencia (Opcional):</Typography><Box display="flex" gap={2}><Button variant="outlined" component="label" startIcon={<PhotoCamera/>}>{archivoImagenQueja ? "Foto Lista" : "Foto"}<input type="file" hidden accept="image/*" onChange={(e)=>setArchivoImagenQueja(e.target.files[0])}/></Button><Button variant="outlined" component="label" startIcon={<VideocamIcon/>}>{archivoVideoQueja ? "Video Listo" : "Video"}<input type="file" hidden accept="video/*" onChange={(e)=>setArchivoVideoQueja(e.target.files[0])}/></Button></Box></DialogContent><DialogActions><Button onClick={()=>setOpenQueja(false)}>Cancelar</Button><Button onClick={crearQueja} variant="contained" color="error">Enviar</Button></DialogActions></Dialog>
    </Box>
  );
}

export default Comunidad;