import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack'; // <--- IMPORTANTE

// Importación de Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Visitas from './pages/Visitas';
import Caseta from './pages/Caseta';
import AdminPanel from './pages/AdminPanel';
import Comunidad from './pages/Comunidad';
import Reportes from './pages/Reportes'; 
import Ayuda from './pages/Ayuda';
import Directorio from './pages/Directorio';

function App() {
  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <CssBaseline />
      <Routes>
        {/* --- RUTAS PÚBLICAS Y LOGIN --- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* --- RUTAS DE RESIDENTE (VECINO) --- */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/residente" element={<Dashboard />} /> 

        {/* --- RUTAS ADMINISTRATIVAS Y DE GUARDIA --- */}
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/caseta" element={<Caseta />} />
        
        {/* --- RUTAS COMUNES --- */}
        <Route path="/visitas" element={<Visitas />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/directorio" element={<Directorio />} />

        {/* --- RUTA COMODÍN --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SnackbarProvider>
  )
}

export default App;