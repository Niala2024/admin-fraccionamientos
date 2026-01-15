import React from 'react';
import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box sx={{ p: 3, mt: 'auto', textAlign: 'center', bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0', width: '100%' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Sistema de Administración de Fraccionamientos.
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 'bold', color: '#1976d2' }}>
        Diseñado por Alain Ciceña
      </Typography>
    </Box>
  );
}
export default Footer;