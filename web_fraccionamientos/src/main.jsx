// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <--- IMPORTANTE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos la App para activar la navegación */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)