import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Avatar, Alert, InputAdornment, IconButton 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // <--- IMPORTACIÓN CENTRALIZADA

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      // USAMOS 'api' EN LUGAR DE 'axios' Y QUITAMOS LA URL COMPLETA
      const res = await api.post('/api-token-auth/', form);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('user_data', JSON.stringify(res.data)); 

      if (res.data.is_superuser === true) {
          navigate('/admin-panel');
      } 
      else if (res.data.rol && (res.data.rol.toLowerCase().includes('admin') || res.data.rol.toLowerCase().includes('seguridad'))) {
          navigate('/admin-panel');
      } 
      else if (res.data.rol && res.data.rol.toLowerCase().includes('guardia')) {
          navigate('/caseta');
      } 
      else {
          navigate('/dashboard');
      }

    } catch (e) {
      console.error("Error completo:", e);
      if (e.response) {
      // El servidor respondió, mostramos EXACTAMENTE qué dijo
        setError(`Servidor dice: ${JSON.stringify(e.response.data)}`);
      } else if (e.request) {
        setError('Error: El servidor no responde (revisa VITE_API_URL)');
      } else {
        setError(`Error desconocido: ${e.message}`);
      }
   }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e3f2fd' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}><LockOutlinedIcon fontSize="large" /></Avatar>
          <Typography component="h1" variant="h5" fontWeight="bold" color="primary">Acceso Seguro</Typography>
          <Box component="form" sx={{ mt: 1, width: '100%' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField margin="normal" required fullWidth label="Usuario" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <TextField margin="normal" required fullWidth label="Contraseña" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>), }} />
            <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }} onClick={handleLogin}>Ingresar</Button>
          </Box>
        </Paper>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>© 2026 Sistema de Administración</Typography>
      </Container>
    </Box>
  );
}

export default Login;