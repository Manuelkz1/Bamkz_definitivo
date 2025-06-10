import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart, Eye, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  stock?: number;
}

interface ProductRecommendationsProps {
  currentProduct?: Product;
  currentCategory?: string;
  currentPrice?: number;
  userId?: string;
  viewedProducts?: string[];
  purchasedProducts?: string[];
  products?: Product[];
  maxItems?: number;
  title?: string;
  className?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export function ProductRecommendations({
  currentProduct,
  currentCategory,
  currentPrice,
  userId,
  viewedProducts = [],
  purchasedProducts = [],
  products = [],
  maxItems = 8,
  title,
  className = '',
  onProductClick,
  onAddToCart,
  onAddToWishlist
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Productos mock para demostración
  const mockProducts: Product[] = products.length > 0 ? products : [
    {
      id: '1',
      name: 'iPhone 14 Pro Max',
      price: 1299000,
      originalPrice: 1399000,
      image: '/api/placeholder/300/300',
      category: 'Smartphones',
      rating: 4.8,
      reviewCount: 245,
      discount: 7,
      isBestseller: true,
      stock: 8
    },
    {
      id: '2',
      name: 'Samsung Galaxy S23 Ultra',
      price: 1199000,
      image: '/api/placeholder/300/300',
      category: 'Smartphones',
      rating: 4.7,
      reviewCount: 189,
      stock: 12
    },
    {
      id: '3',
      name: 'MacBook Air M2',
      price: 1799000,
      originalPrice: 1899000,
      image: '/api/placeholder/300/300',
      category: 'Laptops',
      rating: 4.9,
      reviewCount: 156,
      discount: 5,
      stock: 5
    },
    {
      id: '4',
      name: 'iPad Pro 12.9"',
      price: 1599000,
      image: '/api/placeholder/300/300',
      category: 'Tablets',
      rating: 4.8,
      reviewCount: 203,
      isNew: true,
      stock: 15
    },
    {
      id: '5',
      name: 'AirPods Pro 2',
      price: 399000,
      originalPrice: 449000,
      image: '/api/placeholder/300/300',
      category: 'Auriculares',
      rating: 4.6,
      reviewCount: 324,
      discount: 11,
      isBestseller: true,
      stock: 25
    },
    {
      id: '6',
      name: 'Apple Watch Series 8',
      price: 699000,
      image: '/api/placeholder/300/300',
      category: 'Wearables',
      rating: 4.5,
      reviewCount: 145,
      stock: 18
    }
  ];

  // Algoritmo de recomendaciones
  const generateRecommendations = () => {
    setLoading(true);
    
    let candidateProducts = mockProducts.filter(p => 
      currentProduct ? p.id !== currentProduct.id : true
    );

    let scoredProducts = candidateProducts.map(product => {
      let score = 0;

      // Puntuación por categoría (peso: 40%)
      if (currentCategory && product.category === currentCategory) {
        score += 40;
      }

      // Puntuación por rango de precio (peso: 25%)
      if (currentPrice) {
        const priceDifference = Math.abs(product.price - currentPrice) / currentPrice;
        if (priceDifference <= 0.3) score += 25; // Mismo rango de precio
        else if (priceDifference <= 0.5) score += 15; // Rango similar
        else if (priceDifference <= 1) score += 5; // Rango lejano
      }

      // Puntuación por popularidad (peso: 20%)
      if (product.isBestseller) score += 15;
      if (product.rating && product.rating >= 4.5) score += 10;
      if (product.reviewCount && product.reviewCount >= 200) score += 5;

      // Puntuación por productos vistos previamente (peso: 10%)
      if (viewedProducts.includes(product.id)) score += 10;

      // Puntuación por productos comprados previamente en la misma categoría (peso: 15%)
      const purchasedInCategory = purchasedProducts.some(id => {
        const purchasedProduct = mockProducts.find(p => p.id === id);
        return purchasedProduct && purchasedProduct.category === product.category;
      });
      if (purchasedInCategory) score += 15;

      // Bonificación por ofertas
      if (product.discount) score += 8;
      
      // Bonificación por productos nuevos
      if (product.isNew) score += 5;

      // Penalización por productos sin stock
      if (product.stock === 0) score -= 20;

      return { ...product, score };
    });

    // Ordenar por puntuación y tomar los mejores
    const topRecommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    setRecommendations(topRecommendations);
    setLoading(false);
  };

  useEffect(() => {
    generateRecommendations();
  }, [currentProduct, currentCategory, currentPrice, viewedProducts, purchasedProducts]);

  const getRecommendationTitle = () => {
    if (title) return title;
    
    if (currentProduct) {
      return 'También te puede interesar';
    } else if (currentCategory) {
      return `Más productos en ${currentCategory}`;
    } else {
      return 'Productos recomendados';
    }
  };

  const itemsPerView = 4;
  const maxIndex = Math.max(0, recommendations.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">Cargando recomendaciones...</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getRecommendationTitle()}</h3>
          <p className="text-sm text-gray-500">Seleccionados especialmente para ti</p>
        </div>
        
        {recommendations.length > itemsPerView && (
          <div className="flex space-x-2">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {recommendations.map((product) => (
            <div 
              key={product.id} 
              className="flex-none w-1/2 sm:w-1/3 lg:w-1/4 px-2"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 space-y-1">
                    {product.isNew && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        Nuevo
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Bestseller
                      </span>
                    )}
                    {product.discount && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-2">
                    <button
                      onClick={() => onAddToWishlist?.(product)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                      title="Añadir a favoritos"
                    >
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                    <Link
                      to={`/product/${product.id}`}
                      className="block p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                    {product.name}
                  </h4>
                  
                  <div className="text-xs text-gray-500">
                    {product.category}
                  </div>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-indigo-600">
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Stock indicator */}
                    {product.stock !== undefined && (
                      <div className="text-xs">
                        {product.stock === 0 ? (
                          <span className="text-red-500 font-medium">Agotado</span>
                        ) : product.stock <= 5 ? (
                          <span className="text-orange-500 font-medium">
                            Solo {product.stock} disponibles
                          </span>
                        ) : (
                          <span className="text-green-500 font-medium">En stock</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add to cart button */}
                  <button
                    onClick={() => onAddToCart?.(product)}
                    disabled={product.stock === 0}
                    className="w-full mt-3 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{product.stock === 0 ? 'Agotado' : 'Añadir al carrito'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {recommendations.length > itemsPerView && (
        <div className="flex justify-center space-x-2 mt-4">
          {[...Array(Math.ceil(recommendations.length / itemsPerView))].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / itemsPerView) === i
                  ? 'bg-indigo-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Hook para usar las recomendaciones
export function useProductRecommendations(
  currentProduct?: Product,
  currentCategory?: string,
  userId?: string
) {
  const [viewedProducts, setViewedProducts] = useState<string[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<string[]>([]);

  useEffect(() => {
    // Cargar historial del localStorage
    const viewed = localStorage.getItem(`bamkz_viewed_${userId || 'guest'}`);
    const purchased = localStorage.getItem(`bamkz_purchased_${userId || 'guest'}`);
    
    if (viewed) setViewedProducts(JSON.parse(viewed));
    if (purchased) setPurchasedProducts(JSON.parse(purchased));
  }, [userId]);

  const addToViewed = (productId: string) => {
    const newViewed = [productId, ...viewedProducts.filter(id => id !== productId)].slice(0, 50);
    setViewedProducts(newViewed);
    localStorage.setItem(`bamkz_viewed_${userId || 'guest'}`, JSON.stringify(newViewed));
  };

  const addToPurchased = (productId: string) => {
    const newPurchased = [productId, ...purchasedProducts.filter(id => id !== productId)];
    setPurchasedProducts(newPurchased);
    localStorage.setItem(`bamkz_purchased_${userId || 'guest'}`, JSON.stringify(newPurchased));
  };

  return {
    viewedProducts,
    purchasedProducts,
    addToViewed,
    addToPurchased
  };
}
