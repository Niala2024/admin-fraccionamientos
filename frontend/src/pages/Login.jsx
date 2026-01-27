import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, 
  InputAdornment, IconButton, CircularProgress, Alert
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
    if (error) setError(''); 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      return setError('Por favor, ingresa usuario y contraseña.');
    }

    setLoading(true);
    setError('');

    try {
      // Petición de login
      const res = await api.post('/api/api-token-auth/', credentials);
      const { token, user, casa } = res.data;

      // 1. Limpieza y Guardado
      localStorage.clear();
      localStorage.setItem('token', token);
      
      if (user) localStorage.setItem('user_data', JSON.stringify(user));
      if (casa) localStorage.setItem('session_casa', JSON.stringify(casa));

      // 2. LÓGICA DE REDIRECCIÓN INTELIGENTE
      // Normalizamos el rol a minúsculas para evitar errores (Ej: "Guardia", "guardia", "GUARDIA")
      const rol = user.rol ? user.rol.toLowerCase() : '';
      const esAdmin = user.is_superuser || user.is_staff || rol.includes('admin');
      // Detectamos palabras clave de seguridad
      const esVigilancia = rol.includes('guardia') || rol.includes('vigilante') || rol.includes('seguridad');

      if (esAdmin) {
          // Si es Admin -> Panel General
          navigate('/admin-panel');
      } else if (esVigilancia) {
          // ✅ AQUI ESTABA FALTANDO: Si es Guardia -> Monitor de Vigilancia
          navigate('/admin-vigilancia'); 
      } else {
          // Si no es ninguno -> Dashboard de Vecino
          navigate('/dashboard');
      }

    } catch (err) {
      console.error("Error en Login:", err);
      
      if (!err.response) {
        setError('No se pudo conectar con el servidor. Revisa tu internet.');
      } else if (err.response.status === 400 || err.response.status === 403) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error inesperado. Inténtalo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eceff1' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ height: 70, marginBottom: 10, objectFit: 'contain' }} 
              onError={(e) => e.target.style.display = 'none'} 
            />
            <Typography variant="h5" fontWeight="bold" color="primary">Panel de Acceso</Typography>
            <Typography variant="body2" color="text.secondary">Gestión de Fraccionamientos</Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField 
              fullWidth 
              label="Usuario" 
              name="username" 
              margin="normal" 
              variant="outlined"
              value={credentials.username} 
              onChange={handleChange} 
              disabled={loading} 
              autoFocus
            />
            <TextField 
              fullWidth 
              label="Contraseña" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              margin="normal" 
              variant="outlined"
              value={credentials.password} 
              onChange={handleChange} 
              disabled={loading} 
              InputProps={{ 
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ), 
              }} 
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              type="submit" 
              disabled={loading} 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />} 
              sx={{ mt: 4, mb: 1, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Validando...' : 'Entrar al Sistema'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;