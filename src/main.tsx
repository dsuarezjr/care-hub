import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { router } from './app/router';
import { AuthProvider } from './features/auth/AuthProvider';
import './styles/tokens.css';
import './styles/app.css';

registerSW({
  onNeedRefresh() {
    console.info('New content available. Refresh to update Ramon Care Hub.');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
