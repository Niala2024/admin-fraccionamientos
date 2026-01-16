import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Avatar, Alert, InputAdornment, IconButton 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // <--- Asegúrate de que este archivo ya tenga el fix de VITE_API_URL

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError(''); // Limpiar errores previos
    try {
      // Petición al backend
      const res = await api.post('/api-token-auth/', form);
      
      console.log("Respuesta del servidor:", res.data); // Para depuración
      alert(JSON.stringify(res.data));
      // Guardar datos en el navegador
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('user_data', JSON.stringify(res.data)); 

      // --- LÓGICA DE REDIRECCIÓN BLINDADA ---
      const data = res.data;
      const rol = data.rol ? data.rol.toLowerCase() : '';
      const usuario = data.username ? data.username.toLowerCase() : '';

      // CASO 1: Es el Jefe (Master, Superusuario o Admin)
      if (usuario === 'master' || data.is_superuser === true || rol.includes('admin') || rol.includes('seguridad')) {
          console.log("Redirigiendo a: /admin-panel");
          navigate('/admin-panel');
      } 
      // CASO 2: Es Guardia de Seguridad
      else if (rol.includes('guardia')) {
          console.log("Redirigiendo a: /caseta");
          navigate('/caseta');
      } 
      // CASO 3: Es un Residente Normal (Default)
      else {
          console.log("Redirigiendo a: /dashboard");
          navigate('/dashboard');
      }

    } catch (e) {
      console.error("Error en Login:", e);
      
      // Manejo de errores detallado para saber qué pasa
      if (e.response) {
        // El servidor respondió con un error (ej: credenciales malas)
        // A veces el error viene como { "non_field_errors": ["..."] }
        const serverMsg = e.response.data.non_field_errors 
                          ? e.response.data.non_field_errors[0] 
                          : JSON.stringify(e.response.data);
        setError(`Error: ${serverMsg}`);
      } else if (e.request) {
        // El servidor no respondió (Backend apagado o URL mal configurada)
        setError('Error de conexión: El servidor no responde. Revisa tu conexión.');
      } else {
        // Error desconocido
        setError('Ocurrió un error inesperado al iniciar sesión.');
      }
    }
  };

  // Permitir login al presionar ENTER
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e3f2fd' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
            Acceso Seguro
          </Typography>
          
          <Box component="div" sx={{ mt: 1, width: '100%' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TextField 
              margin="normal" 
              required 
              fullWidth 
              label="Usuario" 
              autoFocus 
              value={form.username} 
              onChange={(e) => setForm({ ...form, username: e.target.value })} 
              onKeyPress={handleKeyPress}
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
              sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }} 
              onClick={handleLogin}
            >
              Ingresar
            </Button>
          </Box>
        </Paper>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © 2026 Sistema de Administración
        </Typography>
      </Container>
    </Box>
  );
}

export default Login;