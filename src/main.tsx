import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Configuración enterprise
const ENTERPRISE_CONFIG = {
  userId: 'user_123', // En producción vendría de autenticación
  initialView: 'dashboard' as const,
  enableAnalytics: true,
  enableAI: true,
  enableOffline: true,
};

// Inicializar aplicación enterprise
const initializeApp = () => {
  console.log('🚀 Initializing CogniBot Enterprise...');
  
  // Configurar analytics si está habilitado
  if (ENTERPRISE_CONFIG.enableAnalytics && typeof window !== 'undefined') {
    console.log('📊 Analytics enabled');
  }

  // Configurar error reporting
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
  });

  console.log('✅ CogniBot Enterprise initialized');
};

// Inicializar
initializeApp();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
