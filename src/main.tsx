import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for initial load
window.onerror = (msg, url, lineNo, columnNo, error) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #ef4444; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px;">
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Error de Inicio de Aplicación</h1>
        <p style="font-size: 14px; margin-bottom: 12px;">${msg}</p>
        <pre style="font-size: 12px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">Reintentar</button>
      </div>
    `;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
