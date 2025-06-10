import React from 'react';
import { Loader2, Package, ShoppingBag } from 'lucide-react';

interface ImprovedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  type?: 'default' | 'products' | 'cart' | 'payment';
  className?: string;
}

export function ImprovedLoadingSpinner({ 
  size = 'md', 
  message,
  type = 'default',
  className = ''
}: ImprovedLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getIcon = () => {
    switch (type) {
      case 'products':
        return <Package className={`${sizeClasses[size]} animate-pulse text-indigo-600`} />;
      case 'cart':
        return <ShoppingBag className={`${sizeClasses[size]} animate-pulse text-indigo-600`} />;
      case 'payment':
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-green-600`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'products':
        return 'Cargando productos...';
      case 'cart':
        return 'Actualizando carrito...';
      case 'payment':
        return 'Procesando pago...';
      default:
        return 'Cargando...';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${containerClasses[size]} ${className}`}>
      <div className="relative">
        {getIcon()}
        
        {/* Círculo de progreso animado */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-300 animate-spin" />
      </div>
      
      {(message || type !== 'default') && (
        <div className="text-center">
          <p className="text-gray-600 font-medium">
            {message || getDefaultMessage()}
          </p>
          
          {type === 'payment' && (
            <p className="text-sm text-gray-500 mt-1">
              No cierres esta ventana
            </p>
          )}
          
          {type === 'products' && (
            <p className="text-sm text-gray-500 mt-1">
              Preparando la mejor selección para ti
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para loading de página completa
export function FullPageLoading({ 
  message,
  type = 'default'
}: Pick<ImprovedLoadingSpinnerProps, 'message' | 'type'>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ImprovedLoadingSpinner 
          size="lg" 
          message={message}
          type={type}
        />
      </div>
    </div>
  );
}

// Hook para loading state mejorado
export function useImprovedLoading() {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string>('');
  const [type, setType] = React.useState<ImprovedLoadingSpinnerProps['type']>('default');

  const startLoading = (
    loadingMessage?: string, 
    loadingType: ImprovedLoadingSpinnerProps['type'] = 'default'
  ) => {
    setMessage(loadingMessage || '');
    setType(loadingType);
    setLoading(true);
  };

  const stopLoading = () => {
    setLoading(false);
    setMessage('');
    setType('default');
  };

  return {
    loading,
    message,
    type,
    startLoading,
    stopLoading,
    LoadingComponent: loading ? (
      <ImprovedLoadingSpinner message={message} type={type} />
    ) : null
  };
}
