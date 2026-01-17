import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, 
  InputAdornment, IconButton, CircularProgress 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = window.location.hostname === 'localhost' 
        ? 'http://127.0.0.1:8000/api-token-auth/' 
        : 'https://web-production-619e0.up.railway.app/api-token-auth/';

    try {
      const res = await api.post(url, credentials);
      const { token, user_id, username, email, rol, is_superuser, is_staff } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('rol', rol);
      localStorage.setItem('user_data', JSON.stringify({ 
          user_id, username, email, rol, is_superuser, is_staff 
      }));

      // --- LÓGICA DE REDIRECCIÓN CORREGIDA ---
      
      // 1. Super Admin o Administrador -> Admin Panel
      if (is_superuser === true || (rol && rol.toLowerCase().includes('admin'))) {
          navigate('/admin-panel');
      } 
      // 2. Guardia -> Dashboard (con herramientas de guardia)
      else if (rol && rol.toLowerCase().includes('guardia')) {
          navigate('/dashboard'); 
      }
      // 3. Residente -> Dashboard
      else {
          navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error de conexión.');
    }
    setLoading(false);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#eceff1',
        backgroundImage: 'linear-gradient(to bottom right, #eceff1, #cfd8dc)' 
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 60, marginBottom: 10, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            <Typography variant="h5" fontWeight="bold" color="primary">Bienvenido</Typography>
            <Typography variant="body2" color="text.secondary">Acceso a Condóminos</Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Usuario" name="username" margin="normal" value={credentials.username} onChange={handleChange} disabled={loading} />
            <TextField fullWidth label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} margin="normal" value={credentials.password} onChange={handleChange} disabled={loading} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>), }} />
            {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
            <Button fullWidth variant="contained" size="large" type="submit" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />} sx={{ mt: 3, mb: 2, borderRadius: 2, py: 1.5 }}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;