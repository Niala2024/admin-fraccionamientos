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
      console.log("🔵 Intentando Login con:", credentials.username);
      
      const res = await api.post('/api/api-token-auth/', credentials);
      
      // --- DIAGNÓSTICO EN CONSOLA ---
      console.log("🟢 RESPUESTA DEL SERVIDOR:", res.data);
      console.log("   ➤ Token:", res.data.token ? "OK" : "FALTA");
      console.log("   ➤ Usuario:", res.data.user);
      console.log("   ➤ ID Usuario:", res.data.user?.id);
      // -----------------------------

      if (!res.data.user || !res.data.user.id) {
        throw new Error("El servidor no devolvió el ID del usuario.");
      }

      const { token, user, casa, casa_nombre } = res.data;

      // Guardamos en limpio
      localStorage.clear(); // Asegura borrar basura vieja
      localStorage.setItem('token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      if (user.rol) localStorage.setItem('rol', user.rol);
      if (casa) localStorage.setItem('casa_data', JSON.stringify(casa));

      // Configurar header
      api.defaults.headers.common['Authorization'] = `Token ${token}`;

      console.log("✅ Datos guardados. Redirigiendo...");

      // Redirección
      const rol = user.rol ? user.rol.toLowerCase() : '';
      if (rol.includes('admin') || user.is_staff) {
        navigate('/admin-panel');
      } else if (rol.includes('guardia')) {
        navigate('/caseta');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error("🔴 ERROR LOGIN:", err);
      setError('Error al iniciar sesión. Revisa la consola (F12) para ver detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Usuario" name="username" margin="normal" value={credentials.username} onChange={handleChange} />
            <TextField 
              fullWidth label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} margin="normal" 
              value={credentials.password} onChange={handleChange} 
              InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} 
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button fullWidth variant="contained" size="large" type="submit" disabled={loading} sx={{ mt: 3 }}>
              {loading ? 'Cargando...' : 'Entrar'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;