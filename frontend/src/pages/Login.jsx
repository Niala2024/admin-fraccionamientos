import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, 
  InputAdornment, IconButton, CircularProgress, Alert
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';

// Asegúrate de que la ruta a tu api sea correcta
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
      // Petición al backend
      const res = await api.post('/api/api-token-auth/', credentials);
      
      // Desestructuramos la respuesta del backend (que arreglamos en views.py)
      const { token, user, casa, casa_nombre } = res.data;

      // 🛑 PASO CRÍTICO: Guardar en LocalStorage para que no salga "undefined"
      localStorage.setItem('token', token);
      
      // Guardamos el objeto user completo (que incluye el id)
      localStorage.setItem('user_data', JSON.stringify(user));
      
      // Guardamos el rol por si se necesita para rutas protegidas
      if (user.rol) localStorage.setItem('rol', user.rol);
      
      // Guardamos datos de la casa si existen
      if (casa) {
        localStorage.setItem('casa_data', JSON.stringify(casa));
      }

      // Configurar header por defecto para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Token ${token}`;

      // Redirección basada en el rol
      const rol = user.rol ? user.rol.toLowerCase() : '';
      if (rol.includes('admin') || user.is_staff) {
        navigate('/admin-panel');
      } else if (rol.includes('guardia')) {
        navigate('/caseta');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error("Error Login:", err);
      if (err.response) {
        if (err.response.status === 400) {
            setError('Credenciales incorrectas. Intenta de nuevo.');
        } else {
            setError(`Error del servidor: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('No se pudo conectar con el servidor. Revisa tu internet.');
      } else {
        setError('Error desconocido al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#f5f5f5',
        backgroundImage: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
            Bienvenido
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Sistema de Control de Acceso
          </Typography>

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
              sx={{ mt: 4, mb: 1, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
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