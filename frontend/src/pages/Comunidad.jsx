import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Avatar, IconButton, Card, CardHeader, CardContent, CardMedia, 
  CardActions, Divider, CircularProgress, Fab
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

// Iconos
import SendIcon from '@mui/icons-material/Send';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';

import api from '../api/axiosConfig'; 

function Comunidad() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // 🛑 CORRECCIÓN DE SESIÓN: Usamos 'user_data' (el nuevo estándar)
  const token = localStorage.getItem('token');
  const sessionUser = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoPost, setNuevoPost] = useState('');
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Validación de seguridad
  useEffect(() => {
    if (!token || !sessionUser.id) {
        // navigate('/'); // Descomentar si quieres forzar salida
    }
    cargarPosts();
  }, []);

  const cargarPosts = async () => {
    try {
        const res = await api.get('/api/foro/', { headers: { Authorization: `Token ${token}` } });
        setPosts(res.data.results || res.data);
    } catch (error) {
        console.error("Error cargando foro:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleImagenChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImagen(file);
          setPreview(URL.createObjectURL(file));
      }
  };

  const handlePublicar = async () => {
      if (!nuevoPost.trim() && !imagen) return;

      setEnviando(true);
      const formData = new FormData();
      formData.append('contenido', nuevoPost);
      
      // ✅ CLOUDINARY: Aquí enviamos el archivo crudo. 
      // Django + Cloudinary Storage hacen el resto automáticamente.
      if (imagen) {
          formData.append('imagen', imagen);
      }

      try {
          await api.post('/api/foro/', formData, {
              headers: { 
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'multipart/form-data' // Vital para subir archivos
              }
          });
          
          enqueueSnackbar("Publicado correctamente", { variant: 'success' });
          setNuevoPost('');
          setImagen(null);
          setPreview(null);
          cargarPosts(); // Recargamos para ver la nueva foto
      } catch (error) {
          console.error(error);
          enqueueSnackbar("Error al publicar", { variant: 'error' });
      } finally {
          setEnviando(false);
      }
  };

  const handleLike = async (postId, liked) => {
      // Aquí iría la lógica de like si tu backend lo soporta.
      // Por ahora es visual.
      enqueueSnackbar("Función de Like en desarrollo", { variant: 'info' });
  };

  const handleBorrar = async (postId) => {
      if(!confirm("¿Borrar esta publicación?")) return;
      try {
          await api.delete(`/api/foro/${postId}/`, { headers: { Authorization: `Token ${token}` } });
          setPosts(posts.filter(p => p.id !== postId));
          enqueueSnackbar("Eliminado", { variant: 'info' });
      } catch (error) {
          enqueueSnackbar("No tienes permiso para borrar esto", { variant: 'error' });
      }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Box display="flex" alignItems="center" mb={3}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                Regresar
            </Button>
            <Typography variant="h4" fontWeight="bold" color="primary">
                Comunidad Vecinal
            </Typography>
        </Box>

        {/* 📝 SECCIÓN DE CREAR PUBLICACIÓN */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Box display="flex" gap={2}>
                <Avatar src={sessionUser.avatar} sx={{ width: 50, height: 50 }} />
                <Box flexGrow={1}>
                    <TextField 
                        fullWidth 
                        multiline 
                        rows={2} 
                        variant="standard" 
                        placeholder={`¿Qué está pasando, ${sessionUser.first_name || 'Vecino'}?`}
                        value={nuevoPost}
                        onChange={(e) => setNuevoPost(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                    />
                    
                    {/* Previsualización de Imagen */}
                    {preview && (
                        <Box mt={2} position="relative" display="inline-block">
                            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10 }} />
                            <IconButton 
                                size="small" 
                                onClick={() => { setImagen(null); setPreview(null); }}
                                sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover':{bgcolor:'red'} }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button 
                            component="label" 
                            startIcon={<ImageIcon />} 
                            sx={{ color: '#2e7d32' }}
                        >
                            Foto / Video
                            <input type="file" hidden accept="image/*" onChange={handleImagenChange} />
                        </Button>

                        <Button 
                            variant="contained" 
                            endIcon={enviando ? <CircularProgress size={20} color="inherit"/> : <SendIcon />} 
                            onClick={handlePublicar}
                            disabled={enviando || (!nuevoPost.trim() && !imagen)}
                            sx={{ borderRadius: 5, px: 4 }}
                        >
                            Publicar
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>

        {/* 📰 LISTADO DE PUBLICACIONES */}
        {loading ? (
            <Box textAlign="center" mt={5}><CircularProgress /></Box>
        ) : (
            <Box>
                {posts.map((post) => (
                    <Card key={post.id} sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }} elevation={2}>
                        <CardHeader
                            avatar={
                                <Avatar src={post.autor_avatar} aria-label="recipe" sx={{ bgcolor: '#1976d2' }}>
                                    {post.autor_nombre ? post.autor_nombre[0] : 'V'}
                                </Avatar>
                            }
                            action={
                                (post.autor === sessionUser.id || sessionUser.is_staff) && (
                                    <IconButton onClick={() => handleBorrar(post.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                )
                            }
                            title={
                                <Typography fontWeight="bold">
                                    {post.autor_nombre} 
                                    {post.autor_casa && <Typography component="span" variant="caption" color="text.secondary" sx={{ml:1}}>({post.autor_casa})</Typography>}
                                </Typography>
                            }
                            subheader={new Date(post.fecha_creacion).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                        />
                        
                        <CardContent sx={{ pt: 0 }}>
                            <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                                {post.contenido}
                            </Typography>
                        </CardContent>

                        {/* ✅ IMAGEN DESDE CLOUDINARY */}
                        {post.imagen && (
                            <CardMedia
                                component="img"
                                image={post.imagen} // Django entrega la URL completa de Cloudinary aquí
                                alt="Imagen de la publicación"
                                sx={{ maxHeight: 500, objectFit: 'contain', bgcolor: '#f5f5f5' }}
                            />
                        )}

                        <CardActions disableSpacing sx={{ px: 2, pb: 2 }}>
                            <IconButton aria-label="add to favorites" onClick={() => handleLike(post.id)}>
                                <FavoriteBorderIcon />
                            </IconButton>
                            <IconButton aria-label="comentar">
                                <ChatBubbleOutlineIcon />
                            </IconButton>
                        </CardActions>
                    </Card>
                ))}
                
                {posts.length === 0 && (
                    <Box textAlign="center" mt={5} color="text.secondary">
                        <Typography variant="h6">Aún no hay publicaciones.</Typography>
                        <Typography variant="body2">¡Sé el primero en compartir algo con tus vecinos!</Typography>
                    </Box>
                )}
            </Box>
        )}
    </Container>
  );
}

export default Comunidad;