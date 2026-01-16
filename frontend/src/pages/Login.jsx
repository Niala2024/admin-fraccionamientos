import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Avatar, Alert, InputAdornment, IconButton, CssBaseline 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
// Nota: Ya no importamos 'api' aquí para evitar que ensucie la petición

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obtenemos la URL de la variable de entorno de forma segura
  const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-619e0.up.railway.app';

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    // 1. LIMPIEZA TOTAL (Borrar cualquier rastro anterior)
    localStorage.clear(); 

    try {
      console.log("Intentando conectar a:", `${API_URL}/api-token-auth/`);

      // 2. USAMOS FETCH (El método que SÍ funcionó en tu consola)
      const response = await fetch(`${API_URL}/api-token-auth/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Importante: NO enviamos Authorization aquí, vamos limpios
        },
        body: JSON.stringify(form)
      });

      // 3. Revisamos si el servidor nos rechazó
      if (response.status === 401 || response.status === 403) {
        throw new Error('CREDENCIALES_INVALIDAS');
      }

      if (!response.ok) {
        throw new Error('ERROR_RED');
      }

      // 4. Si pasamos, convertimos la respuesta a JSON
      const data = await response.json();
      console.log("Login Exitoso:", data);

      // 5. Guardamos los datos nuevos
      localStorage.setItem('token', data.token);
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('user_data', JSON.stringify(data)); 

      // 6. Redirección Inteligente
      const rol = data.rol ? data.rol.toLowerCase() : '';
      const usuario = data.username ? data.username.toLowerCase() : '';

      if (usuario === 'master' || data.is_superuser || rol.includes('admin') || rol.includes('seguridad')) {
          navigate('/admin-panel');
      } else if (rol.includes('guardia')) {
          navigate('/caseta');
      } else {
          navigate('/dashboard');
      }

    } catch (e) {
      console.error("Error Login:", e);
      setLoading(false);
      
      if (e.message === 'CREDENCIALES_INVALIDAS') {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Error de conexión. Verifica que el servidor esté activo.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f2f5', backgroundImage: 'linear-gradient(135deg, #f0f2f5 0%, #e3f2fd 100%)' }}>
      <CssBaseline />
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
          <Avatar sx={{ m: 1, bgcolor: '#1976d2', width: 60, height: 60, mb: 2 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h5" fontWeight="700" color="#1976d2" sx={{ mb: 1 }}>
            Bienvenido
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tus credenciales (Fetch Nativo)
          </Typography>

          <Box component="div" sx={{ width: '100%' }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <TextField margin="normal" required fullWidth label="Usuario" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} onKeyPress={handleKeyPress} sx={{ mb: 2 }} />
            <TextField margin="normal" required fullWidth label="Contraseña" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyPress={handleKeyPress} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>), }} />
            
            <Button fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }} onClick={handleLogin}>
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;