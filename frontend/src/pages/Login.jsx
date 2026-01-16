import React, { useState } from 'react';
import { 
  Container, Paper, TextField, Button, Typography, Box, InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../api/axiosConfig'; // <--- IMPORTANTE: Usamos la config centralizada

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usamos 'api' en lugar de axios directo. 
      // Esto tomará automáticamente la URL http://127.0.0.1:8000 que definimos antes.
      const response = await api.post('/api-token-auth/', { 
        username, 
        password 
      });

      // Si llegamos aquí, el login fue exitoso en LOCAL
      const { token, user_id, username: user, is_superuser, ...rest } = response.data;

      // Guardamos la llave LOCAL
      localStorage.setItem('token', token);
      localStorage.setItem('user_data', JSON.stringify({ 
        user_id, 
        username: user, 
        is_superuser,
        ...rest 
      }));

      enqueueSnackbar(`Bienvenido ${user}`, { variant: 'success' });
      navigate('/admin-panel');

    } catch (error) {
      console.error("Login error:", error);
      // Mensajes de error amigables
      if (error.code === "ERR_NETWORK") {
        enqueueSnackbar("No se encuentra el servidor local (Django). ¿Está prendido?", { variant: 'error' });
      } else if (error.response?.status === 400) {
        enqueueSnackbar("Usuario o contraseña incorrectos", { variant: 'error' });
      } else {
        enqueueSnackbar("Error al iniciar sesión. Revisa la consola.", { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#e3f2fd', // Un color de fondo suave
      backgroundImage: 'radial-gradient(#90caf9 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          
          <Box sx={{ p: 2, bgcolor: '#1976d2', borderRadius: '50%', mb: 2 }}>
            <LoginIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1565c0' }}>
            Acceso Administrativo
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Usuario" autoFocus
              value={username} onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal" required fullWidth label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
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
            
            <Button
              type="submit" fullWidth variant="contained" size="large"
              sx={{ mt: 3, mb: 2, bgcolor: '#1565c0', py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Ingresar'}
            </Button>
            
            <Typography variant="caption" display="block" align="center" color="text.secondary">
              Sistema Local v1.0
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;