import { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner, FullPageLoader } from '../components/LoadingSpinner';

// Wrapper para componentes lazy con loading state
export function withSuspense<T extends ComponentType<any>>(
  Component: T,
  fallback?: React.ReactNode
): T {
  const SuspenseWrapper = (props: any) => (
    <Suspense fallback={fallback || <FullPageLoader />}>
      <Component {...props} />
    </Suspense>
  );

  return SuspenseWrapper as unknown as T;
}

// Lazy loading de componentes principales
export const LazyAuth = withSuspense(
  lazy(() => import('../components/Auth').then(module => ({ default: module.Auth }))),
  <FullPageLoader text="Cargando autenticación..." />
);

export const LazyPhoneAuth = withSuspense(
  lazy(() => import('../components/PhoneAuth').then(module => ({ default: module.PhoneAuth }))),
  <FullPageLoader text="Cargando verificación..." />
);

export const LazyProductPage = withSuspense(
  lazy(() => import('../pages/ProductPage')),
  <FullPageLoader text="Cargando producto..." />
);

export const LazyMyOrdersPage = withSuspense(
  lazy(() => import('../pages/MyOrdersPage')),
  <FullPageLoader text="Cargando pedidos..." />
);

export const LazyMyFavoritesPage = withSuspense(
  lazy(() => import('../pages/MyFavoritesPage')),
  <FullPageLoader text="Cargando favoritos..." />
);

export const LazyAdminPanel = withSuspense(
  lazy(() => import('../components/AdminPanel').then(module => ({ default: module.AdminPanel }))),
  <FullPageLoader text="Cargando panel de administración..." />
);

export const LazyOrderDetails = withSuspense(
  lazy(() => import('../components/OrderDetails')),
  <FullPageLoader text="Cargando detalles del pedido..." />
);

export const LazyGuestCheckout = withSuspense(
  lazy(() => import('../components/GuestCheckout')),
  <FullPageLoader text="Cargando checkout..." />
);

export const LazyPaymentStatus = withSuspense(
  lazy(() => import('../components/PaymentStatus').then(module => ({ default: module.PaymentStatus }))),
  <FullPageLoader text="Procesando pago..." />
);

// Helper para pre-cargar componentes críticos
export const preloadCriticalComponents = () => {
  // Pre-cargar componentes que probablemente se usarán pronto
  setTimeout(() => {
    import('../components/Auth');
    import('../components/Cart');
  }, 2000);

  // Pre-cargar componentes de checkout en interacciones del carrito
  const preloadCheckout = () => {
    import('../components/GuestCheckout');
    import('../components/PaymentStatus');
  };

  // Escuchar cuando se agrega algo al carrito
  document.addEventListener('cart-item-added', preloadCheckout, { once: true });
  
  return () => {
    document.removeEventListener('cart-item-added', preloadCheckout);
  };
};

// Helper para optimizar imports dinámicos
export async function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  retries: number = 3
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Import failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return dynamicImport(importFn, retries - 1);
    }
    throw error;
  }
}

// Componente para manejar errores de lazy loading
export function LazyErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error loading component:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {fallback || (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error cargando el componente
            </h2>
            <p className="text-gray-600 mb-4">
              Hubo un problema cargando esta sección. Por favor, intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Recargar página
            </button>
          </>
        )}
      </div>
    );
  }
}
