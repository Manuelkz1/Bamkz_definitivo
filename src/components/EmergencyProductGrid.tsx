import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Search, Filter, X, Tag, Star, Truck, Heart, RefreshCw } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useAuthStore } from '../stores/authStore';
import { emergencyProductService, type Product } from '../services/emergencyProductService';
import { useDebounce } from 'use-debounce';

interface ProductWithRating extends Product {
  averageRating?: number;
  reviewCount?: number;
}

export function EmergencyProductGrid() {
  const navigate = useNavigate();
  const cartStore = useCartStore();
  const favoritesStore = useFavoritesStore();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm] = useDebounce(searchInput, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    if (user && !favoritesStore.isInitialized) {
      favoritesStore.loadFavorites(user.id);
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚨 EMERGENCY: Cargando productos con servicio de emergencia...');

      const { data, error: fetchError } = await emergencyProductService.getProducts();

      if (fetchError) {
        console.warn('⚠️ Error en servicio emergencia:', fetchError);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No hay productos en la respuesta');
        setError('No se encontraron productos');
        setProducts([]);
        setCategories([]);
        return;
      }

      // Filtrar productos según término de búsqueda
      let filteredProducts = data;
      
      if (searchTerm) {
        filteredProducts = data.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtrar por categoría
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
      }

      // Ordenar productos
      switch (sortBy) {
        case 'price_asc':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filteredProducts.sort((a, b) => {
            const dateA = new Date(a.created_at || '').getTime();
            const dateB = new Date(b.created_at || '').getTime();
            return dateB - dateA;
          });
          break;
      }

      // Agregar datos por defecto para compatibilidad
      const productsWithData = filteredProducts.map(product => ({
        ...product,
        averageRating: 0,
        reviewCount: 0
      }));

      setProducts(productsWithData);
      
      // Extraer categorías únicas
      const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(uniqueCategories);

      console.log(`✅ PRODUCTOS CARGADOS EXITOSAMENTE: ${productsWithData.length} productos`);
      
      if (fetchError) {
        toast.success('Productos cargados (modo respaldo)');
      } else {
        toast.success(`${productsWithData.length} productos cargados correctamente`);
      }

    } catch (error: any) {
      console.error('❌ Error crítico cargando productos:', error);
      setError('Error al cargar los productos');
      toast.error('Error al cargar los productos. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    cartStore.addItem(product, 1);
    toast.success('Producto agregado al carrito');
  };

  const handleBuyNow = (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    navigate(`/product/${product.id}`);
  };

  const handleRetry = () => {
    loadProducts();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">🚨 Cargando productos con servicio de emergencia...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar productos</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header de emergencia */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-800">
                ✅ Tienda funcionando - Modo emergencia activo
              </h2>
              <p className="text-green-600 text-sm">
                Productos cargados con servicio de respaldo confiable
              </p>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados'
                : 'No hay productos disponibles en este momento'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-48 w-full object-cover object-center hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.stock > 0 ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          En stock ({product.stock})
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock === 0}
                        className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-4 w-4 inline mr-1" />
                        Agregar
                      </button>
                      
                      <button
                        onClick={(e) => handleBuyNow(product, e)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>✅ {products.length} productos cargados exitosamente</p>
          <p>🚨 Servicio de emergencia activo - Funcionamiento garantizado</p>
        </div>
      </div>
    </div>
  );
}
