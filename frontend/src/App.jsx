import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack'; 
import MiPerfil from './pages/MiPerfil'; 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Visitas from './pages/Visitas';
import Caseta from './pages/Caseta';
import AdminPanel from './pages/AdminPanel';
import AdminVigilancia from './pages/AdminVigilancia'; // ✅ IMPORTAR
import Comunidad from './pages/Comunidad';
import Reportes from './pages/Reportes'; 
import Ayuda from './pages/Ayuda';
import Directorio from './pages/Directorio';
import Quejas from './pages/Quejas';
import Finanzas from './pages/Finanzas';
import PersonalExterno from './pages/PersonalExterno';

function App() {
  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/residente" element={<Dashboard />} /> 
        <Route path="/personal" element={<PersonalExterno />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/admin-vigilancia" element={<AdminVigilancia />} /> {/* ✅ RUTA NUEVA */}
        <Route path="/caseta" element={<Caseta />} />
        <Route path="/finanzas" element={<Finanzas />} />
        
        <Route path="/visitas" element={<Visitas />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/ayuda" element={<Ayuda />} />
        <Route path="/directorio" element={<Directorio />} />
        <Route path="/quejas" element={<Quejas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
       
      </Routes>
    </SnackbarProvider>
  )
}

export default App;