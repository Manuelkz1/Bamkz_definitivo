import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isSupported: boolean;
  isOnline: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  install: () => Promise<void>;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isSupported: 'serviceWorker' in navigator,
    isOnline: navigator.onLine,
    swRegistration: null
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Registrar service worker
    if (state.isSupported) {
      registerServiceWorker();
    }

    // Detectar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState(prev => ({ ...prev, isInstalled: true }));
    }

    // Escuchar eventos de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false 
      }));
      setDeferredPrompt(null);
    };

    // Escuchar cambios de conexión
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isSupported]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setState(prev => ({ ...prev, swRegistration: registration }));

      // Escuchar actualizaciones del service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              if (confirm('¡Nueva versión disponible! ¿Quieres actualizar la aplicación?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      console.log('Service Worker registrado exitosamente');
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  };

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('La instalación no está disponible');
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          isInstallable: false 
        }));
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error durante la instalación:', error);
      throw error;
    }
  };

  const updateApp = async (): Promise<void> => {
    if (!state.swRegistration) {
      throw new Error('Service Worker no está registrado');
    }

    try {
      await state.swRegistration.update();
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando la aplicación:', error);
      throw error;
    }
  };

  const clearCache = async (): Promise<void> => {
    if (!state.swRegistration) {
      throw new Error('Service Worker no está registrado');
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error('Error limpiando el cache'));
          }
        };

        state.swRegistration.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Error limpiando cache:', error);
      throw error;
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Las notificaciones no están soportadas');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Las notificaciones están bloqueadas');
    }

    const permission = await Notification.requestPermission();
    return permission;
  };

  return {
    ...state,
    install,
    updateApp,
    clearCache,
    requestNotificationPermission
  };
}

// Hook para detectar el tipo de dispositivo
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);

    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}

// Hook para detectar si la app está en modo standalone (PWA instalada)
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => mediaQuery.removeEventListener('change', checkStandalone);
  }, []);

  return isStandalone;
}

// Hook para manejar la conectividad
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
