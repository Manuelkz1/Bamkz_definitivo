import React from 'react';
import { toast, ToastPosition } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class ImprovedToast {
  private static defaultDuration = 4000;
  private static defaultPosition: ToastPosition = 'top-right';

  static success(message: string, options?: ToastOptions) {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">¡Éxito!</p>
                <p className="mt-1 text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          {options?.action && (
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  options.action!.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {options.action.label}
              </button>
            </div>
          )}
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || this.defaultDuration,
        position: options?.position || this.defaultPosition,
      }
    );
  }

  static error(message: string, options?: ToastOptions) {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Error</p>
                <p className="mt-1 text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          {options?.action && (
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  options.action!.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {options.action.label}
              </button>
            </div>
          )}
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || this.defaultDuration,
        position: options?.position || this.defaultPosition,
      }
    );
  }

  static warning(message: string, options?: ToastOptions) {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Advertencia</p>
                <p className="mt-1 text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          {options?.action && (
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  options.action!.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-yellow-600 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {options.action.label}
              </button>
            </div>
          )}
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || this.defaultDuration,
        position: options?.position || this.defaultPosition,
      }
    );
  }

  static info(message: string, options?: ToastOptions) {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Información</p>
                <p className="mt-1 text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          {options?.action && (
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  options.action!.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {options.action.label}
              </button>
            </div>
          )}
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ),
      {
        duration: options?.duration || this.defaultDuration,
        position: options?.position || this.defaultPosition,
      }
    );
  }

  // Toast especiales para e-commerce
  static addedToCart(productName: string, options?: { onViewCart?: () => void }) {
    return this.success(`${productName} añadido al carrito`, {
      action: options?.onViewCart ? {
        label: 'Ver carrito',
        onClick: options.onViewCart
      } : undefined
    });
  }

  static addedToFavorites(productName: string, options?: { onViewFavorites?: () => void }) {
    return this.success(`${productName} añadido a favoritos`, {
      action: options?.onViewFavorites ? {
        label: 'Ver favoritos',
        onClick: options.onViewFavorites
      } : undefined
    });
  }

  static orderPlaced(orderId: string, options?: { onViewOrder?: () => void }) {
    return this.success(`¡Orden #${orderId} creada exitosamente!`, {
      duration: 6000,
      action: options?.onViewOrder ? {
        label: 'Ver orden',
        onClick: options.onViewOrder
      } : undefined
    });
  }

  static paymentProcessing() {
    return this.info('Procesando pago...', {
      duration: 10000
    });
  }

  static stockWarning(productName: string, stockLeft: number) {
    return this.warning(`¡Solo quedan ${stockLeft} unidades de ${productName}!`, {
      duration: 6000
    });
  }
}

// CSS para las animaciones (debe añadirse al CSS global)
export const toastAnimations = `
  @keyframes enter {
    from {
      opacity: 0;
      transform: translate3d(100%, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes leave {
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
    to {
      opacity: 0;
      transform: translate3d(100%, 0, 0);
    }
  }

  .animate-enter {
    animation: enter 0.3s ease-out;
  }

  .animate-leave {
    animation: leave 0.2s ease-in;
  }
`;
