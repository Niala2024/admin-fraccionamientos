import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Box, Avatar, Alert, InputAdornment, IconButton 
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

  const handleLogin = async () => {
    try {
      const res = await api.post('/api-token-auth/', form);
      
      // --- PASO CLAVE: VER QUÉ NOS LLEGA ---
      // Esta alerta nos dirá la verdad. Si no sale, es que el código es viejo.
      alert("DATOS RECIBIDOS:\n" + JSON.stringify(res.data, null, 2));

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('user_data', JSON.stringify(res.data)); 

      const data = res.data;
      const rol = data.rol ? data.rol.toLowerCase() : '';
      const usuario = data.username ? data.username.toLowerCase() : '';

      // Reglas de redirección
      if (usuario === 'master' || data.is_superuser || rol.includes('admin') || rol.includes('seguridad')) {
          navigate('/admin-panel');
      } else if (rol.includes('guardia')) {
          navigate('/caseta');
      } else {
          navigate('/dashboard');
      }

    } catch (e) {
      console.error(e);
      setError('Error al iniciar sesión. Revisa la consola.');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e3f2fd' }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          {/* CAMBIO VISIBLE: SI NO VES ESTO, NO SE ACTUALIZÓ */}
          <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
            ACCESO ADMIN V2
          </Typography>

          <Box component="div" sx={{ mt: 1, width: '100%' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField margin="normal" required fullWidth label="Usuario" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <TextField margin="normal" required fullWidth label="Contraseña" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>), }} />
            
            <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }} onClick={handleLogin}>
              PRUEBA DE CONEXIÓN
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;