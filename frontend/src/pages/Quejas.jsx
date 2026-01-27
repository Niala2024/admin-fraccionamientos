import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, IconButton, 
  Button, Chip, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  Menu, MenuItem, Tooltip, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import { useNavigate } from 'react-router-dom';

// ✅ CORRECCIÓN 1: Importamos el archivo correcto
import api from '../api/axiosConfig'; 

function Quejas() {
  const navigate = useNavigate();
  const [quejas, setQuejas] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [openDialog, setOpenDialog] = useState(false);
  const [quejaSeleccionada, setQuejaSeleccionada] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuQuejaId, setMenuQuejaId] = useState(null);

  useEffect(() => {
    cargarQuejas();
  }, []);

  const cargarQuejas = async () => {
    try {
      // ✅ CORRECCIÓN 2: Agregamos '/api' a la ruta
      const res = await api.get('/api/quejas/');
      const datosRecibidos = res.data.results || res.data;
      
      if (Array.isArray(datosRecibidos)) {
          setQuejas(datosRecibidos);
      } else {
          setQuejas([]); 
      }
    } catch (error) {
      console.error("Error cargando quejas", error);
      setQuejas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta queja permanentemente?")) return;
    try {
      // ✅ CORRECCIÓN 3: Ruta con /api
      await api.delete(`/api/quejas/${id}/`);
      setQuejas(quejas.filter(q => q.id !== id));
      alert("Queja eliminada");
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const handleAbrirRespuesta = (queja) => {
    setQuejaSeleccionada(queja);
    setRespuestaTexto(queja.respuesta || '');
    setOpenDialog(true);
  };

  const handleEnviarRespuesta = async () => {
    if (!quejaSeleccionada) return;
    try {
      // ✅ CORRECCIÓN 4: Ruta con /api
      await api.patch(`/api/quejas/${quejaSeleccionada.id}/`, {
        respuesta: respuestaTexto,
        estatus: 'CONTESTADA' 
      });
      alert("Respuesta enviada correctamente");
      setOpenDialog(false);
      cargarQuejas(); 
    } catch (error) {
      alert("Error al enviar respuesta");
    }
  };

  const handleCambiarEstatus = async (nuevoEstatus) => {
    try {
      // ✅ CORRECCIÓN 5: Ruta con /api
      await api.patch(`/api/quejas/${menuQuejaId}/`, { estatus: nuevoEstatus });
      cargarQuejas();
      setAnchorEl(null);
    } catch (error) {
      alert("Error al actualizar estatus");
    }
  };

  const getStatusColor = (estatus) => {
    switch (estatus) {
      case 'RESUELTA': return 'success';
      case 'CONTESTADA': return 'warning';
      default: return 'error'; 
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#d32f2f' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin-panel')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Buzón de Quejas y Sugerencias</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 2 }}>
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
             </Box>
          ) : (
            <TableContainer>
                <Table>
                <TableHead sx={{ bgcolor: '#eee' }}>
                    <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Vecino</TableCell>
                    <TableCell>Asunto / Descripción</TableCell>
                    <TableCell>Respuesta Admin</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {!quejas || quejas.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center">No hay quejas registradas.</TableCell></TableRow>
                    ) : (
                        quejas.map((queja) => (
                        <TableRow key={queja.id}>
                            <TableCell>{new Date(queja.fecha_creacion).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                    {queja.usuario_nombre || "Anónimo"}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {queja.casa_info || "Sin Casa"}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300 }}>
                                <Typography variant="subtitle2">{queja.tipo}</Typography>
                                <Typography variant="body2" color="textSecondary">{queja.descripcion}</Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 250 }}>
                                {queja.respuesta ? (
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#1b5e20' }}>
                                        "{queja.respuesta}"
                                    </Typography>
                                ) : (
                                    <Typography variant="caption" color="text.disabled">Sin respuesta</Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={queja.estatus || 'PENDIENTE'} 
                                    color={getStatusColor(queja.estatus)} 
                                    size="small"
                                    onClick={(e) => { setAnchorEl(e.currentTarget); setMenuQuejaId(queja.id); }}
                                    sx={{ cursor: 'pointer' }}
                                />
                            </TableCell>
                            <TableCell align="center">
                                <Tooltip title="Responder">
                                    <IconButton color="primary" onClick={() => handleAbrirRespuesta(queja)}>
                                        <ReplyIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton color="error" onClick={() => handleEliminar(queja.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
                </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Responder a Queja</DialogTitle>
        <DialogContent>
            <Typography variant="body2" gutterBottom sx={{ mt: 1, bgcolor: '#f0f0f0', p: 1, borderRadius: 1 }}>
                <strong>Original:</strong> {quejaSeleccionada?.descripcion}
            </Typography>
            <TextField autoFocus margin="dense" label="Escribe tu respuesta oficial" fullWidth multiline rows={4} value={respuestaTexto} onChange={(e) => setRespuestaTexto(e.target.value)} />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleEnviarRespuesta} variant="contained" color="primary">Enviar</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleCambiarEstatus('PENDIENTE')}>Marcar Pendiente</MenuItem>
        <MenuItem onClick={() => handleCambiarEstatus('CONTESTADA')}>Marcar Contestada</MenuItem>
        <MenuItem onClick={() => handleCambiarEstatus('RESUELTA')}>Marcar Resuelta</MenuItem>
      </Menu>
    </Box>
  );
}

export default Quejas;