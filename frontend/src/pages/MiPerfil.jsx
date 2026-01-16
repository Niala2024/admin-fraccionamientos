import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, TextField, 
  Avatar, IconButton, InputAdornment 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

function MiPerfil() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  
  // Datos del Usuario
  const [perfil, setPerfil] = useState({
    id: '',
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    telefono: '',
    rol: '',
    avatar: null 
  });
  
  // Preview de la imagen
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [archivoAvatar, setArchivoAvatar] = useState(null);

  // Datos para cambio de contraseña
  const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' });
  const [showPass, setShowPass] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    const cargarPerfil = async () => {
        const userStr = localStorage.getItem('user_data');
        if (!userStr) { navigate('/'); return; }
        
        const userData = JSON.parse(userStr);
        try {
            const res = await api.get(`/api/usuarios/${userData.user_id}/`, {
                headers: { Authorization: `Token ${localStorage.getItem('token')}` }
            });
            setPerfil(res.data);
            setAvatarPreview(res.data.avatar); 
        } catch (error) {
            enqueueSnackbar("Error cargando perfil", { variant: 'error' });
        }
    };
    cargarPerfil();
  }, [navigate, enqueueSnackbar]);

  // Guardar Datos Personales (Sin password)
  const handleGuardarDatos = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('first_name', perfil.first_name);
    formData.append('last_name', perfil.last_name);
    formData.append('email', perfil.email);
    formData.append('telefono', perfil.telefono);
    
    if (archivoAvatar) {
        formData.append('avatar', archivoAvatar);
    }

    try {
        await api.patch(`/api/usuarios/${perfil.id}/`, formData, {
            headers: { 
                'Authorization': `Token ${localStorage.getItem('token')}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        enqueueSnackbar("Perfil actualizado correctamente", { variant: 'success' });
        // Actualizamos el localStorage para que el avatar se refresque en otras pantallas
        const userStr = localStorage.getItem('user_data');
        if(userStr) {
            const userData = JSON.parse(userStr);
            userData.avatar = avatarPreview; // Actualización optimista
            localStorage.setItem('user_data', JSON.stringify(userData));
        }

    } catch (error) {
        enqueueSnackbar("Error al actualizar datos", { variant: 'error' });
    }
    setLoading(false);
  };

  // Guardar Nueva Contraseña
  const handleCambiarPassword = async () => {
      if (!passwords.newPass || !passwords.confirmPass) {
          return enqueueSnackbar("Escribe la nueva contraseña", { variant: 'warning' });
      }
      if (passwords.newPass !== passwords.confirmPass) {
          return enqueueSnackbar("Las contraseñas no coinciden", { variant: 'error' });
      }

      setLoading(true);
      try {
          await api.patch(`/api/usuarios/${perfil.id}/`, {
              password: passwords.newPass
          }, {
              headers: { Authorization: `Token ${localStorage.getItem('token')}` }
          });
          enqueueSnackbar("Contraseña cambiada con éxito. Inicia sesión de nuevo.", { variant: 'success' });
          setPasswords({ newPass: '', confirmPass: '' });
          
          // Opcional: Cerrar sesión para obligar a entrar con la nueva
          // localStorage.clear();
          // navigate('/');
          
      } catch (error) {
          enqueueSnackbar("Error al cambiar contraseña", { variant: 'error' });
      }
      setLoading(false);
  };

  const handleAvatarChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setArchivoAvatar(file);
          setAvatarPreview(URL.createObjectURL(file));
      }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Regresar</Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1e293b' }}>Mi Perfil</Typography>

        <Grid container spacing={3}>
            {/* SECCIÓN DATOS */}
            <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <Box position="relative">
                            <Avatar src={avatarPreview} alt={perfil.username} sx={{ width: 120, height: 120, mb: 2, border: '4px solid #fff', boxShadow: 3 }} />
                            <IconButton color="primary" component="label" sx={{ position: 'absolute', bottom: 10, right: -10, bgcolor: 'white', '&:hover':{bgcolor:'#f5f5f5'} }}>
                                <input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
                                <PhotoCamera />
                            </IconButton>
                        </Box>
                        <Typography variant="h6" color="text.secondary">@{perfil.username}</Typography>
                        <Typography variant="caption" sx={{bgcolor:'#e3f2fd', color:'#1976d2', px:1, borderRadius:1, mt:0.5}}>{perfil.rol || 'Usuario'}</Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre" value={perfil.first_name || ''} onChange={(e)=>setPerfil({...perfil, first_name:e.target.value})} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Apellido" value={perfil.last_name || ''} onChange={(e)=>setPerfil({...perfil, last_name:e.target.value})} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={perfil.email || ''} onChange={(e)=>setPerfil({...perfil, email:e.target.value})} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Teléfono" value={perfil.telefono || ''} onChange={(e)=>setPerfil({...perfil, telefono:e.target.value})} /></Grid>
                    </Grid>

                    <Box mt={3} display="flex" justifyContent="flex-end">
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardarDatos} disabled={loading}>Guardar Cambios</Button>
                    </Box>
                </Paper>
            </Grid>

            {/* SECCIÓN PASSWORD */}
            <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3, bgcolor: '#fff3e0' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <KeyIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Seguridad</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>Cambiar tu contraseña cerrará tus sesiones activas.</Typography>

                    <TextField fullWidth margin="dense" label="Nueva Contraseña" type={showPass ? 'text' : 'password'} value={passwords.newPass} onChange={(e)=>setPasswords({...passwords, newPass:e.target.value})} InputProps={{endAdornment: (<InputAdornment position="end"><IconButton onClick={()=>setShowPass(!showPass)}>{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>)}} />
                    <TextField fullWidth margin="dense" label="Confirmar Contraseña" type={showPass ? 'text' : 'password'} value={passwords.confirmPass} onChange={(e)=>setPasswords({...passwords, confirmPass:e.target.value})} />

                    <Button fullWidth variant="contained" color="warning" sx={{ mt: 2 }} onClick={handleCambiarPassword} disabled={loading || !passwords.newPass}>Actualizar Clave</Button>
                </Paper>
            </Grid>
        </Grid>
    </Container>
  );
}

export default MiPerfil;