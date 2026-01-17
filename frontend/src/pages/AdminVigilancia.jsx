import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Card, CardContent, IconButton, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';

// Iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NoteIcon from '@mui/icons-material/Note';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

function AdminVigilancia() {
  const navigate = useNavigate();
  
  // Reloj
  const [currentTime, setCurrentTime] = useState(new Date());

  // Datos
  const [actividadCombinada, setActividadCombinada] = useState([]); 
  const [bitacoraDia, setBitacoraDia] = useState([]);
  const [reportesDiarios, setReportesDiarios] = useState([]);

  // 1. Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Long Polling (Recarga automática cada 5s)
  useEffect(() => {
      cargarDatosVigilancia(); 
      const intervalo = setInterval(cargarDatosVigilancia, 5000); 
      return () => clearInterval(intervalo);
  }, []);

  const cargarDatosVigilancia = async () => {
      try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const [resVisitas, resTrabajadores, resBitacora, resReportes] = await Promise.all([
              api.get('/api/visitas/activas/', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/accesos-trabajadores/activos/', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/bitacora/?dia=hoy', { headers: { Authorization: `Token ${token}` } }),
              api.get('/api/reportes-diarios/', { headers: { Authorization: `Token ${token}` } })
          ]);

          const combinados = [
              ...resVisitas.data.map(v => ({
                  id: `v-${v.id}`, tipo: 'Visita', nombre: v.nombre_visitante, 
                  destino: `Casa ${v.casa_nombre || v.casa}`, entrada: v.fecha_llegada_real, color: '#2979ff'
              })),
              ...resTrabajadores.data.map(t => ({
                  id: `t-${t.id}`, tipo: 'Trabajador', nombre: t.trabajador_nombre, 
                  destino: `Casa ${t.casa_datos}`, entrada: t.fecha_entrada, color: '#00e676'
              }))
          ].sort((a,b) => new Date(b.entrada) - new Date(a.entrada));

          setActividadCombinada(combinados);
          setBitacoraDia(resBitacora.data.results || resBitacora.data);
          setReportesDiarios(resReportes.data.results || resReportes.data);

      } catch (e) { console.error("Error sincronizando:", e); }
  };

  const darkTheme = { bg: '#0f172a', card: '#1e293b', text: '#f8fafc', textSec: '#94a3b8', border: '#334155' };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: darkTheme.bg, color: darkTheme.text, overflow: 'hidden' }}>
        
        {/* HEADER */}
        <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0b1120', borderBottom: `1px solid ${darkTheme.border}` }}>
            <Box display="flex" alignItems="center" gap={2}>
                <IconButton onClick={() => navigate('/admin-panel')} sx={{color: '#fff', border:'1px solid #334155'}}><ArrowBackIcon /></IconButton>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{color: '#c084fc', lineHeight: 1}}>MONITOREO C5</Typography>
                    <Typography variant="caption" sx={{color: darkTheme.textSec}}>Vista de Supervisión (Solo Lectura)</Typography>
                </Box>
            </Box>
            
            <Box sx={{ display:'flex', gap: 4 }}>
                <Box sx={{textAlign:'center'}}><Typography variant="h4" fontWeight="bold" lineHeight={1}>{actividadCombinada.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>EN SITIO</Typography></Box>
                <Box sx={{textAlign:'center'}}><Typography variant="h4" fontWeight="bold" lineHeight={1} color="#facc15">{bitacoraDia.length}</Typography><Typography variant="caption" color={darkTheme.textSec}>INCIDENTES</Typography></Box>
            </Box>

            <Box textAlign="right">
                <Typography variant="h5" fontWeight="bold" sx={{fontFamily: 'monospace', color: '#fff', lineHeight: 1}}>{currentTime.toLocaleTimeString()}</Typography>
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    <VisibilityIcon fontSize="small" sx={{color:'#22c55e'}} />
                    <Typography variant="caption" sx={{color: '#22c55e', fontWeight:'bold'}}>EN VIVO</Typography>
                </Box>
            </Box>
        </Box>

        {/* CONTENIDO PRINCIPAL */}
        <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
                
                {/* COL 1: NOVEDADES */}
                <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                    <Paper sx={{ height: '100%', bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 1.5, bgcolor: '#1e293b', borderBottom: `1px solid ${darkTheme.border}`, display:'flex', alignItems:'center' }}>
                            <NoteIcon sx={{mr:1, color:'#38bdf8'}}/>
                            <Typography variant="subtitle2" fontWeight="bold" color="white">NOVEDADES / CHAT</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
                            {reportesDiarios.map(r => (
                                <Box key={r.id} sx={{ mb: 1.5, p: 1.5, bgcolor: '#334155', borderRadius: 2, borderLeft: '4px solid #38bdf8' }}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="#60a5fa" fontWeight="bold">{r.guardia_nombre || 'Guardia'}</Typography>
                                        <Typography variant="caption" color="#cbd5e1">{new Date(r.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{color:'white', wordBreak:'break-word'}}>{r.mensaje}</Typography>
                                </Box>
                            ))}
                            {reportesDiarios.length === 0 && <Typography variant="caption" align="center" display="block" sx={{mt:5, color:'#64748b'}}>Sin novedades.</Typography>}
                        </Box>
                    </Paper>
                </Grid>

                {/* COL 2: MONITOR */}
                <Grid item xs={12} md={5} sx={{ height: '100%' }}>
                    <Paper sx={{ height: '100%', bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 1.5, bgcolor: '#1e293b', borderBottom: `1px solid ${darkTheme.border}` }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="#38bdf8">📡 PERSONAS DENTRO</Typography>
                        </Box>
                        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Table stickyHeader size="small">
                                <TableHead><TableRow><TableCell sx={{bgcolor:'#0f172a', color:'#94a3b8'}}>Quién</TableCell><TableCell sx={{bgcolor:'#0f172a', color:'#94a3b8'}}>Destino</TableCell><TableCell sx={{bgcolor:'#0f172a', color:'#94a3b8'}}>Entrada</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {actividadCombinada.map((row) => (
                                        <TableRow key={row.id} hover sx={{'&:hover':{bgcolor:'rgba(255,255,255,0.05) !important'}}}>
                                            <TableCell sx={{color:'white', borderBottom:'1px solid #334155'}}>{row.nombre} <br/><Typography variant="caption" color="#64748b">{row.tipo}</Typography></TableCell>
                                            <TableCell sx={{color:'#cbd5e1', borderBottom:'1px solid #334155'}}>{row.destino}</TableCell>
                                            <TableCell sx={{color:'#cbd5e1', borderBottom:'1px solid #334155'}}>{new Date(row.entrada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</TableCell>
                                        </TableRow>
                                    ))}
                                    {actividadCombinada.length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{py: 10, color: '#64748b'}}>Sin actividad.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* COL 3: BITÁCORA */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper sx={{ height: '100%', bgcolor: darkTheme.card, borderRadius: 2, border: `1px solid ${darkTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 1.5, bgcolor: '#1e293b', borderBottom: `1px solid ${darkTheme.border}` }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="#f87171" display="flex" alignItems="center"><WarningIcon sx={{mr:1}}/> BITÁCORA (24H)</Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                            {bitacoraDia.map(b => (
                                <Card key={b.id} sx={{ mb: 2, bgcolor: '#0f172a', border: '1px solid #334155' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Chip label={b.tipo} size="small" sx={{bgcolor: b.tipo === 'RUTINA' ? '#334155' : '#7f1d1d', color:'white', fontSize:'0.7rem'}} />
                                            <Typography variant="caption" color="#94a3b8">{new Date(b.fecha).toLocaleTimeString()}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="white" fontWeight="bold">{b.titulo}</Typography>
                                        <Typography variant="body2" sx={{color:'#cbd5e1', mt:0.5}}>{b.descripcion}</Typography>
                                        {b.placas && <Typography variant="caption" display="block" color="#fbbf24">Placas: {b.placas}</Typography>}
                                    </CardContent>
                                </Card>
                            ))}
                            {bitacoraDia.length === 0 && <Typography variant="caption" align="center" display="block" sx={{mt:5, color:'#64748b'}}>Sin incidentes.</Typography>}
                        </Box>
                    </Paper>
                </Grid>

            </Grid>
        </Container>
    </Box>
  );
}

export default AdminVigilancia;