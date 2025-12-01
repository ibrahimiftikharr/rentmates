import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './domains/auth/styles/index.css';
import './domains/auth/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right" 
        richColors 
        duration={3000}
        toastOptions={{
          className: 'sonner-toast',
        }}
      />
    </BrowserRouter>
  </StrictMode>
);

