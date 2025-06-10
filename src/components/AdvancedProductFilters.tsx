import React, { useState, useEffect } from 'react';
import { Filter, X, Search, Tag, DollarSign, Star, Truck, SlidersHorizontal } from 'lucide-react';

interface FilterOptions {
  searchTerm: string;
  category: string;
  priceRange: [number, number];
  minRating: number;
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

interface AdvancedProductFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  priceRange: [number, number];
  className?: string;
}

export function AdvancedProductFilters({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  className = ''
}: AdvancedProductFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      searchTerm: '',
      category: '',
      priceRange: priceRange,
      minRating: 0,
      sortBy: 'newest',
      inStock: false,
      onSale: false,
      freeShipping: false
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.searchTerm !== '' ||
      localFilters.category !== '' ||
      localFilters.priceRange[0] !== priceRange[0] ||
      localFilters.priceRange[1] !== priceRange[1] ||
      localFilters.minRating > 0 ||
      localFilters.inStock ||
      localFilters.onSale ||
      localFilters.freeShipping
    );
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${className}`}>
      {/* Búsqueda y filtros básicos */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Barra de búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={localFilters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>

        {/* Categoría */}
        <div className="sm:w-48">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenar por */}
        <div className="sm:w-48">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={localFilters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="rating">Mejor calificados</option>
            <option value="popularity">Más populares</option>
          </select>
        </div>

        {/* Botón filtros avanzados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 rounded-md border transition-colors flex items-center gap-2 ${
            showAdvanced || hasActiveFilters()
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters() && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
              {Object.values(localFilters).filter(v => v !== '' && v !== false && v !== 0).length}
            </span>
          )}
        </button>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de precios: ${localFilters.priceRange[0].toLocaleString()} - ${localFilters.priceRange[1].toLocaleString()}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={localFilters.priceRange[0]}
                onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), localFilters.priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={localFilters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [localFilters.priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* Calificación mínima */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación mínima
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('minRating', rating === localFilters.minRating ? 0 : rating)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md border transition-colors ${
                    localFilters.minRating >= rating
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Star className={`h-4 w-4 ${localFilters.minRating >= rating ? 'fill-current' : ''}`} />
                  <span>{rating}+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtros booleanos */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Solo en stock</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.onSale}
                onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">En oferta</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.freeShipping}
                onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Envío gratis</span>
            </label>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters() && (
            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
