import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Avatar, Alert, InputAdornment, IconButton, CssBaseline 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    localStorage.removeItem('token'); 
    localStorage.removeItem('rol');
    try {
     
      // 1. Petición al servidor
      const res = await api.post('/api-token-auth/', form);
      // 2. Guardar credenciales
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('user_data', JSON.stringify(res.data)); 
      const res = await api.post('/api-token-auth/', form);
      // 3. Análisis inteligente de redirección
      const data = res.data;
      const rol = data.rol ? data.rol.toLowerCase() : '';
      const usuario = data.username ? data.username.toLowerCase() : '';

      // Regla de Oro: Superusuarios y Admins al Panel Principal
      if (usuario === 'master' || data.is_superuser || rol.includes('admin') || rol.includes('seguridad')) {
          navigate('/admin-panel');
      } 
      // Guardias a su caseta
      else if (rol.includes('guardia')) {
          navigate('/caseta');
      } 
      // Residentes a su dashboard
      else {
          navigate('/dashboard');
      }

    } catch (e) {
      console.error("Error de acceso:", e);
      setLoading(false);
      
      // AHORA ACEPTAMOS 400 Y 401 COMO CREDENCIALES INCORRECTAS
      if (e.response && (e.response.status === 400 || e.response.status === 401)) {
        setError('Usuario o contraseña incorrectos.');
      } else if (e.message === "Network Error") {
        setError('No hay conexión con el servidor. Intenta más tarde.');
      } else {
        setError('Ocurrió un error inesperado. Verifica tu conexión.');
      }
    }
  };

  // Permitir entrar con la tecla ENTER
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#f0f2f5', // Un gris muy suave y moderno
      backgroundImage: 'linear-gradient(135deg, #f0f2f5 0%, #e3f2fd 100%)' 
    }}>
      <CssBaseline />
      <Container maxWidth="xs">
        <Paper 
          elevation={6} 
          sx={{ 
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            borderRadius: 4,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.01)' } // Efecto sutil al pasar el mouse
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#1976d2', width: 60, height: 60, mb: 2 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight="700" color="#1976d2" sx={{ mb: 1 }}>
            Bienvenido
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tus credenciales para continuar
          </Typography>

          <Box component="div" sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField 
              margin="normal" 
              required 
              fullWidth 
              label="Usuario" 
              autoFocus 
              value={form.username} 
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
              onKeyPress={handleKeyPress}
              sx={{ mb: 2 }}
            />
            
            <TextField 
              margin="normal" 
              required 
              fullWidth 
              label="Contraseña" 
              type={showPassword ? 'text' : 'password'} 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              onKeyPress={handleKeyPress}
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
            
            <Button 
              fullWidth 
              variant="contained" 
              size="large"
              disabled={loading}
              sx={{ 
                mt: 4, 
                mb: 2, 
                py: 1.5, 
                fontSize: '1rem', 
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 2
              }} 
              onClick={handleLogin}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
        <Typography variant="caption" display="block" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © 2026 Sistema de Administración de Fraccionamientos
        </Typography>
      </Container>
    </Box>
  );
}

export default Login;