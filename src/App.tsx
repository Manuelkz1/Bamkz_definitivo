import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { Auth } from './components/Auth';
import Home from './components/Home';
import { Cart } from './components/Cart';
import {
  LazyProductPage,
  LazyMyOrdersPage,
  LazyMyFavoritesPage,
  LazyAdminPanel,
  LazyOrderDetails,
  LazyGuestCheckout,
  LazyPaymentStatus,
  preloadCriticalComponents
} from './utils/lazyComponents';
import { measureWebVitals } from './utils/performance';

// Componente para manejar el callback de autenticación
const AuthCallback = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Forzar la inicialización del estado de autenticación cuando se llega al callback
    const handleCallback = async () => {
      await initialize();
    };

    handleCallback();
  }, [initialize]);

  // Este componente no renderiza nada, solo procesa el callback
  return null;
};

// Componente para rutas protegidas que requieren autenticación
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuthStore();

  // Si aún está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: window.location }} />;
  }

  // Si la ruta es solo para admin y el usuario no es admin, redirigir a la página principal
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si el usuario está autenticado y tiene los permisos necesarios, mostrar el contenido
  return children;
};

function App() {
  const { initialize } = useAuthStore();

  // Inicializar el estado de autenticación al cargar la aplicación
  useEffect(() => {
    initialize();
    
    // Inicializar mediciones de performance
    measureWebVitals();
    
    // Pre-cargar componentes críticos
    const cleanup = preloadCriticalComponents();
    
    return cleanup;
  }, [initialize]);

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<LazyProductPage />} />
        <Route path="/products/:id" element={<LazyProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<LazyGuestCheckout />} />
        <Route path="/my-orders" element={
          <ProtectedRoute>
            <LazyMyOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/my-favorites" element={
          <ProtectedRoute>
            <LazyMyFavoritesPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <LazyOrderDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly={true}>
            <LazyAdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Ruta crítica para manejar estados de pago - SOLUCIONA PROBLEMA DE PANTALLA EN BLANCO */}
        <Route path="/pago" element={<LazyPaymentStatus />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;