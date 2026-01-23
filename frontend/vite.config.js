import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Esto asegura que los archivos empiecen con /static/
  base: '/static/',
  
  build: {
    // Esto limpia la carpeta dist antes de crear la nueva
    emptyOutDir: true,
    
    rollupOptions: {
      output: {
        // 🔴 AQUÍ ESTÁ EL TRUCO: Forzamos el nombre exacto sin códigos raros
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})