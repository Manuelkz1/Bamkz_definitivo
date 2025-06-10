import React, { useState, useEffect } from 'react';
import { Tag, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
  description: string;
}

interface CouponSystemProps {
  subtotal: number;
  onCouponApplied: (discount: number, coupon: Coupon | null) => void;
  className?: string;
}

export function CouponSystem({ subtotal, onCouponApplied, className = '' }: CouponSystemProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Cupones predefinidos (en producción vendría de la base de datos)
  const availableCoupons: Coupon[] = [
    {
      code: 'BIENVENIDO10',
      type: 'percentage',
      value: 10,
      minAmount: 50000,
      description: 'Descuento del 10% para nuevos clientes (mínimo $50.000)',
      isActive: true
    },
    {
      code: 'ENVIOGRATIS',
      type: 'fixed',
      value: 15000,
      minAmount: 80000,
      description: 'Envío gratis en compras superiores a $80.000',
      isActive: true
    },
    {
      code: 'FLASH20',
      type: 'percentage',
      value: 20,
      maxDiscount: 100000,
      expiryDate: '2025-12-31',
      description: 'Descuento flash del 20% (máximo $100.000)',
      isActive: true
    },
    {
      code: 'PRIMERA50',
      type: 'fixed',
      value: 50000,
      minAmount: 200000,
      description: 'Descuento de $50.000 en tu primera compra (mínimo $200.000)',
      isActive: true
    }
  ];

  const validateCoupon = (code: string): { isValid: boolean; error?: string; coupon?: Coupon } => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    
    if (!coupon) {
      return { isValid: false, error: 'Código de cupón no válido' };
    }

    if (!coupon.isActive) {
      return { isValid: false, error: 'Este cupón ha expirado' };
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return { isValid: false, error: 'Este cupón ha expirado' };
    }

    if (coupon.minAmount && subtotal < coupon.minAmount) {
      return { 
        isValid: false, 
        error: `Monto mínimo requerido: $${coupon.minAmount.toLocaleString()}` 
      };
    }

    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, error: 'Este cupón ha alcanzado su límite de uso' };
    }

    return { isValid: true, coupon };
  };

  const calculateDiscount = (coupon: Coupon): number => {
    if (coupon.type === 'percentage') {
      let discount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
      return discount;
    } else {
      return Math.min(coupon.value, subtotal);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Ingresa un código de cupón');
      return;
    }

    setLoading(true);
    setError('');

    // Simular delay de validación
    await new Promise(resolve => setTimeout(resolve, 500));

    const validation = validateCoupon(couponCode.trim());

    if (!validation.isValid || !validation.coupon) {
      setError(validation.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    const discount = calculateDiscount(validation.coupon);
    setAppliedCoupon(validation.coupon);
    onCouponApplied(discount, validation.coupon);
    setLoading(false);
    setCouponCode('');
    
    toast.success(`¡Cupón aplicado! Descuento: $${discount.toLocaleString()}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    onCouponApplied(0, null);
    toast.success('Cupón removido');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyCoupon();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input para cupón */}
      {!appliedCoupon && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Tienes un código de descuento?
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ingresa tu código"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={20}
              />
              <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <button
              onClick={applyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Cupón aplicado */}
      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Cupón aplicado: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.description}
                </p>
                <p className="text-sm font-semibold text-green-800">
                  Descuento: $
                  {appliedCoupon.type === 'percentage'
                    ? Math.min(
                        subtotal * (appliedCoupon.value / 100),
                        appliedCoupon.maxDiscount || Infinity
                      ).toLocaleString()
                    : Math.min(appliedCoupon.value, subtotal).toLocaleString()
                  }
                </p>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="text-green-600 hover:text-green-800 p-1"
              title="Remover cupón"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cupones sugeridos */}
      {!appliedCoupon && subtotal > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Cupones disponibles:
          </h4>
          <div className="space-y-2">
            {availableCoupons
              .filter(coupon => {
                if (!coupon.isActive) return false;
                if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) return false;
                return true;
              })
              .slice(0, 2)
              .map((coupon) => (
                <button
                  key={coupon.code}
                  onClick={() => {
                    setCouponCode(coupon.code);
                    applyCoupon();
                  }}
                  className="block w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-semibold text-blue-800">
                        {coupon.code}
                      </span>
                      <p className="text-xs text-blue-600">
                        {coupon.description}
                      </p>
                    </div>
                    {coupon.minAmount && subtotal >= coupon.minAmount && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ¡Elegible!
                      </span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para usar el sistema de cupones
export function useCouponSystem(subtotal: number) {
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const handleCouponApplied = (discountAmount: number, coupon: Coupon | null) => {
    setDiscount(discountAmount);
    setAppliedCoupon(coupon);
  };

  const total = subtotal - discount;

  return {
    discount,
    appliedCoupon,
    total,
    handleCouponApplied,
    CouponComponent: (props: Omit<CouponSystemProps, 'subtotal' | 'onCouponApplied'>) => (
      <CouponSystem
        {...props}
        subtotal={subtotal}
        onCouponApplied={handleCouponApplied}
      />
    )
  };
}
