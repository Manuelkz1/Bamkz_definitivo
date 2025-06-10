import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, Clock } from 'lucide-react';

interface StockCounterProps {
  stock: number;
  lowStockThreshold?: number;
  criticalStockThreshold?: number;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StockCounter({
  stock,
  lowStockThreshold = 10,
  criticalStockThreshold = 3,
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}: StockCounterProps) {
  const [currentStock, setCurrentStock] = useState(stock);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (stock !== currentStock) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStock(stock);
        setIsAnimating(false);
      }, 300);
    }
  }, [stock, currentStock]);

  const getStockStatus = () => {
    if (currentStock <= 0) {
      return {
        status: 'out',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        message: 'Agotado',
        urgency: 'critical'
      };
    } else if (currentStock <= criticalStockThreshold) {
      return {
        status: 'critical',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle,
        message: `¡Solo ${currentStock} ${currentStock === 1 ? 'unidad' : 'unidades'}!`,
        urgency: 'critical'
      };
    } else if (currentStock <= lowStockThreshold) {
      return {
        status: 'low',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: TrendingDown,
        message: `Pocas unidades (${currentStock})`,
        urgency: 'warning'
      };
    } else {
      return {
        status: 'normal',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: Package,
        message: `${currentStock} disponibles`,
        urgency: 'normal'
      };
    }
  };

  const stockInfo = getStockStatus();
  const Icon = stockInfo.icon;

  const sizeClasses = {
    sm: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      padding: 'px-2 py-1'
    },
    md: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      padding: 'px-3 py-1.5'
    },
    lg: {
      text: 'text-base',
      icon: 'h-5 w-5',
      padding: 'px-4 py-2'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`
      inline-flex items-center space-x-2 rounded-full border
      ${stockInfo.color} ${stockInfo.bgColor} ${stockInfo.borderColor}
      ${classes.padding} ${classes.text}
      transition-all duration-300
      ${isAnimating ? 'scale-105' : 'scale-100'}
      ${className}
    `}>
      {showIcon && (
        <Icon className={`${classes.icon} ${stockInfo.color}`} />
      )}
      
      {showText && (
        <span className={`font-medium ${stockInfo.color}`}>
          {stockInfo.message}
        </span>
      )}

      {/* Animación de urgencia para stock crítico */}
      {stockInfo.urgency === 'critical' && currentStock > 0 && (
        <div className="relative">
          <div className={`absolute inset-0 rounded-full ${stockInfo.bgColor} animate-ping opacity-75`} />
        </div>
      )}
    </div>
  );
}

// Componente para mostrar stock en tarjetas de producto
export function ProductStockBadge({ 
  stock, 
  className = '' 
}: { 
  stock: number; 
  className?: string; 
}) {
  if (stock <= 0) {
    return (
      <div className={`absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full ${className}`}>
        Agotado
      </div>
    );
  }

  if (stock <= 3) {
    return (
      <div className={`absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full animate-pulse ${className}`}>
        ¡Solo {stock}!
      </div>
    );
  }

  if (stock <= 10) {
    return (
      <div className={`absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full ${className}`}>
        Pocas unidades
      </div>
    );
  }

  // No mostrar badge si hay stock normal
  return null;
}

// Componente para mostrar progreso de stock
export function StockProgress({ 
  current, 
  max, 
  className = '' 
}: { 
  current: number; 
  max: number; 
  className?: string; 
}) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const getColor = () => {
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">Stock disponible</span>
        <span className="text-xs text-gray-500">{current} de {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Hook para manejar alertas de stock
export function useStockAlerts(stock: number, productName: string) {
  const [hasShownAlert, setHasShownAlert] = useState(false);

  useEffect(() => {
    if (stock <= 3 && stock > 0 && !hasShownAlert) {
      // Aquí podrías mostrar una notificación toast
      console.log(`⚠️ Stock crítico: ${productName} (${stock} unidades)`);
      setHasShownAlert(true);
    }

    if (stock > 3) {
      setHasShownAlert(false);
    }
  }, [stock, productName, hasShownAlert]);

  return {
    shouldShowCriticalAlert: stock <= 3 && stock > 0,
    shouldShowOutOfStockAlert: stock <= 0,
    shouldShowLowStockAlert: stock <= 10 && stock > 3
  };
}

// Componente específico para carrito
export function CartStockAlert({ 
  stock, 
  quantity, 
  productName 
}: { 
  stock: number; 
  quantity: number; 
  productName: string; 
}) {
  if (stock <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">
            Producto agotado
          </span>
        </div>
        <p className="text-xs text-red-600 mt-1">
          Este producto ya no está disponible
        </p>
      </div>
    );
  }

  if (quantity > stock) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 font-medium">
            Cantidad no disponible
          </span>
        </div>
        <p className="text-xs text-orange-600 mt-1">
          Solo hay {stock} unidades disponibles. Reduce la cantidad.
        </p>
      </div>
    );
  }

  if (stock <= 3) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">
            ¡Últimas unidades!
          </span>
        </div>
        <p className="text-xs text-yellow-600 mt-1">
          Solo quedan {stock} unidades de {productName}
        </p>
      </div>
    );
  }

  return null;
}
