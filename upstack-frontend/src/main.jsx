import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '14px',
              background: '#0f172a',
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 18px',
              boxShadow: '0 8px 30px rgba(15,23,42,0.18)',
            },
            success: {
              iconTheme: { primary: '#22d3ee', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
              style: {
                background: '#1a0a0e',
                color: '#fda4af',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
