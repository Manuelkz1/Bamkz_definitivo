import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Heart, 
  User, 
  Clock, 
  Menu, 
  X, 
  LogOut,
  Package,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useFavoritesStore } from '../stores/favoritesStore';

interface MobileNavigationProps {
  onAuthRequired: () => void;
}

export function MobileNavigation({ onAuthRequired }: MobileNavigationProps) {
  const { user, signOut } = useAuthStore();
  const cartStore = useCartStore();
  const favoritesStore = useFavoritesStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleAuthRequired = (action: () => void) => {
    if (user) {
      action();
    } else {
      onAuthRequired();
    }
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Inicio',
      action: () => navigate('/'),
      requiresAuth: false
    },
    {
      icon: Clock,
      label: 'Mis Pedidos',
      action: () => navigate('/my-orders'),
      requiresAuth: true
    },
    {
      icon: Heart,
      label: 'Favoritos',
      action: () => navigate('/my-favorites'),
      requiresAuth: true,
      badge: user ? favoritesStore.getFavoriteCount() : 0
    }
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      icon: Settings,
      label: 'Administración',
      action: () => navigate('/admin'),
      requiresAuth: true
    });
  }

  return (
    <>
      {/* Botón de menú hamburguesa - solo visible en móvil */}
      <button
        onClick={() => setShowMenu(true)}
        className="lg:hidden p-2 text-gray-700 hover:text-indigo-600 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Panel lateral del menú */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
        showMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header del menú */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Información del usuario */}
          <div className="p-4 border-b bg-gray-50">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onAuthRequired();
                }}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          {/* Items del menú */}
          <div className="flex-1 py-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setShowMenu(false);
                  if (item.requiresAuth) {
                    handleAuthRequired(item.action);
                  } else {
                    item.action();
                  }
                }}
                className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Carrito - solo si no es fulfillment */}
            {(!user || user.role !== 'fulfillment') && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  cartStore.toggleCart();
                }}
                className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              >
                <ShoppingCart className="h-6 w-6 mr-3" />
                <span className="flex-1 text-left">Carrito</span>
                {cartStore.items.length > 0 && (
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {cartStore.items.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Footer con logout */}
          {user && (
            <div className="border-t p-4">
              <button
                onClick={() => {
                  setShowMenu(false);
                  signOut();
                }}
                className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Navegación inferior para móviles (estilo app nativa)
export function BottomNavigation({ onAuthRequired }: MobileNavigationProps) {
  const { user } = useAuthStore();
  const cartStore = useCartStore();
  const favoritesStore = useFavoritesStore();
  const navigate = useNavigate();

  const handleAuthRequired = (action: () => void) => {
    if (user) {
      action();
    } else {
      onAuthRequired();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden z-40">
      <div className="flex justify-around">
        {/* Inicio */}
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Inicio</span>
        </button>

        {/* Carrito */}
        {(!user || user.role !== 'fulfillment') && (
          <button
            onClick={() => cartStore.toggleCart()}
            className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors relative"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xs mt-1">Carrito</span>
            {cartStore.items.length > 0 && (
              <span className="absolute -top-1 right-1 bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cartStore.items.length}
              </span>
            )}
          </button>
        )}

        {/* Favoritos */}
        <button
          onClick={() => handleAuthRequired(() => navigate('/my-favorites'))}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-red-600 transition-colors relative"
        >
          <Heart className="h-6 w-6" />
          <span className="text-xs mt-1">Favoritos</span>
          {user && favoritesStore.getFavoriteCount() > 0 && (
            <span className="absolute -top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {favoritesStore.getFavoriteCount()}
            </span>
          )}
        </button>

        {/* Pedidos */}
        <button
          onClick={() => handleAuthRequired(() => navigate('/my-orders'))}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs mt-1">Pedidos</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => user ? navigate('/profile') : onAuthRequired()}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </div>
  );
}
