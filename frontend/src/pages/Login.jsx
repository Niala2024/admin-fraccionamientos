import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, 
  InputAdornment, IconButton, CircularProgress 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // ✅ Asegúrate de importar el que arreglamos (axiosConfig o api)

function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ CORRECCIÓN: Usamos 'api.post' con la ruta relativa.
      // Como 'api' ya tiene la BaseURL correcta (https://admin-fraccionamientos...), 
      // esto se conectará automáticamente al lugar correcto.
      const res = await api.post('/api-token-auth/', credentials);
      
      const { token, user, casa } = res.data;

      // 1. Limpiar basura vieja
      localStorage.clear();

      // 2. Guardar datos frescos
      localStorage.setItem('token', token);
      localStorage.setItem('rol', user.rol);
      localStorage.setItem('session_user', JSON.stringify(user));
      
      if (casa) {
          localStorage.setItem('session_casa', JSON.stringify(casa));
      }

      // 3. Redirigir
      if (user.is_superuser || (user.rol && user.rol.toLowerCase().includes('admin'))) {
          navigate('/admin-panel');
      } else {
          navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error de conexión.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eceff1' }}>
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
            <Button fullWidth variant="contained" size="large" type="submit" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />} sx={{ mt: 3, mb: 2 }}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;