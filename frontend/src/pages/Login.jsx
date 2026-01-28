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
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/api-token-auth/', credentials);
      const { token, user, casa } = res.data;

      // --- TRUCO DE COMPATIBILIDAD ---
      // Inyectamos el campo 'user_id' que busca tu archivo MiPerfil.jsx viejo
      const usuarioCompatible = { ...user, user_id: user.id };

      localStorage.clear(); // Limpiamos basura vieja
      localStorage.setItem('token', token);
      
      // 1. Guardamos para los archivos nuevos
      localStorage.setItem('user_data', JSON.stringify(usuarioCompatible));
      
      // 2. Guardamos para Caseta.jsx (que busca 'session_user')
      localStorage.setItem('session_user', JSON.stringify(usuarioCompatible));
      
      // 3. Guardamos datos de casa
      if (casa) {
          localStorage.setItem('session_casa', JSON.stringify(casa));
          localStorage.setItem('casa_data', JSON.stringify(casa));
      }
      // -------------------------------

      api.defaults.headers.common['Authorization'] = `Token ${token}`;

      const rol = user.rol ? user.rol.toLowerCase() : '';
      if (rol.includes('admin') || user.is_staff) {
        navigate('/admin-panel');
      } else if (rol.includes('guardia')) {
        navigate('/caseta');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas o error de servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eceff1' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
            Bienvenido
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Usuario" name="username" margin="normal" value={credentials.username} onChange={handleChange} autoFocus />
            <TextField 
              fullWidth label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} margin="normal" 
              value={credentials.password} onChange={handleChange} 
              InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} 
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button fullWidth variant="contained" size="large" type="submit" disabled={loading} sx={{ mt: 4, py: 1.5 }}>
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;