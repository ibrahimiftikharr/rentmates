import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
// No global CSS - each dashboard loads its own

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

