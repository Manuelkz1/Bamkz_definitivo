import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Filter, Star, Tag } from 'lucide-react';
import { useDebounce } from 'use-debounce';

interface SearchResult {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
  rating?: number;
  inStock: boolean;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'category';
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'category' | 'brand';
  count?: number;
}

interface IntelligentSearchProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  products?: any[];
}

interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean;
}

export function IntelligentSearch({
  onSearch,
  onResultSelect,
  placeholder = "Buscar productos...",
  className = "",
  showFilters = true,
  products = []
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bamkz_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función de búsqueda fuzzy simple
  const fuzzyMatch = (text: string, query: string): boolean => {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(queryLower)) return true;
    
    // Búsqueda difusa básica
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Buscar productos
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simular búsqueda en productos (en producción vendría de la API)
    const mockProducts = products.length > 0 ? products : [
      { id: '1', name: 'iPhone 14 Pro', category: 'Smartphones', price: 1200000, image: '/api/placeholder/150/150', description: 'Último modelo de Apple', rating: 4.8, stock: 5 },
      { id: '2', name: 'Samsung Galaxy S23', category: 'Smartphones', price: 900000, image: '/api/placeholder/150/150', description: 'Potente smartphone Android', rating: 4.6, stock: 8 },
      { id: '3', name: 'MacBook Air M2', category: 'Laptops', price: 1800000, image: '/api/placeholder/150/150', description: 'Laptop ultraligera', rating: 4.9, stock: 3 },
      { id: '4', name: 'AirPods Pro', category: 'Auriculares', price: 350000, image: '/api/placeholder/150/150', description: 'Auriculares inalámbricos', rating: 4.7, stock: 12 },
      { id: '5', name: 'iPad Pro 12.9"', category: 'Tablets', price: 1500000, image: '/api/placeholder/150/150', description: 'Tablet profesional', rating: 4.8, stock: 7 }
    ];

    const searchResults: SearchResult[] = mockProducts
      .map(product => {
        const nameMatch = fuzzyMatch(product.name, searchQuery);
        const categoryMatch = fuzzyMatch(product.category, searchQuery);
        const descriptionMatch = product.description ? fuzzyMatch(product.description, searchQuery) : false;

        let matchType: SearchResult['matchType'] = 'fuzzy';
        if (product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchType = 'exact';
        } else if (product.category.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchType = 'category';
        } else if (nameMatch || descriptionMatch) {
          matchType = 'partial';
        }

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          image: product.image,
          description: product.description,
          rating: product.rating,
          inStock: product.stock > 0,
          matchType
        };
      })
      .filter(result => 
        fuzzyMatch(result.name, searchQuery) || 
        fuzzyMatch(result.category, searchQuery) ||
        (result.description && fuzzyMatch(result.description, searchQuery))
      )
      .sort((a, b) => {
        // Ordenar por relevancia
        const matchOrder = { exact: 0, partial: 1, category: 2, fuzzy: 3 };
        return matchOrder[a.matchType] - matchOrder[b.matchType];
      })
      .slice(0, 8);

    // Aplicar filtros
    let filteredResults = searchResults;
    if (filters.category) {
      filteredResults = filteredResults.filter(r => r.category === filters.category);
    }
    if (filters.priceRange) {
      filteredResults = filteredResults.filter(r => 
        r.price >= filters.priceRange![0] && r.price <= filters.priceRange![1]
      );
    }
    if (filters.rating) {
      filteredResults = filteredResults.filter(r => r.rating && r.rating >= filters.rating!);
    }
    if (filters.inStock) {
      filteredResults = filteredResults.filter(r => r.inStock);
    }

    setResults(filteredResults);
    setIsLoading(false);
  }, [products, filters]);

  // Generar sugerencias
  const generateSuggestions = useCallback((searchQuery: string) => {
    const suggestions: SearchSuggestion[] = [];

    // Búsquedas recientes
    if (!searchQuery.trim()) {
      recentSearches.slice(0, 3).forEach(search => {
        suggestions.push({ text: search, type: 'recent' });
      });
    }

    // Sugerencias trending (simuladas)
    const trendingItems = ['iPhone', 'Samsung', 'Laptops', 'Auriculares'];
    if (searchQuery.length > 0) {
      trendingItems
        .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .forEach(item => {
          suggestions.push({ text: item, type: 'trending', count: Math.floor(Math.random() * 100) + 50 });
        });
    }

    // Categorías
    const categories = ['Smartphones', 'Laptops', 'Tablets', 'Auriculares', 'Accesorios'];
    categories
      .filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 2)
      .forEach(category => {
        suggestions.push({ text: category, type: 'category' });
      });

    setSuggestions(suggestions);
  }, [recentSearches]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (debouncedQuery) {
      searchProducts(debouncedQuery);
      generateSuggestions(debouncedQuery);
    } else {
      generateSuggestions('');
      setResults([]);
    }
  }, [debouncedQuery, searchProducts, generateSuggestions]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex].text);
          } else {
            const resultIndex = selectedIndex - suggestions.length;
            onResultSelect(results[resultIndex]);
            setIsOpen(false);
          }
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setIsOpen(true);
  };

  const handleSearch = () => {
    if (query.trim()) {
      // Añadir a búsquedas recientes
      const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('bamkz_recent_searches', JSON.stringify(newRecentSearches));
      
      onSearch(query, filters);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
    setTimeout(() => {
      onSearch(suggestion, filters);
      setIsOpen(false);
    }, 100);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    generateSuggestions('');
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'trending': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'category': return <Tag className="h-4 w-4 text-blue-500" />;
      default: return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              onClick={clearQuery}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 mr-1 rounded ${showAdvancedFilters ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({...filters, category: e.target.value || undefined})}
                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Laptops">Laptops</option>
                <option value="Tablets">Tablets</option>
                <option value="Auriculares">Auriculares</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calificación mín.</label>
              <select
                value={filters.rating || ''}
                onChange={(e) => setFilters({...filters, rating: e.target.value ? Number(e.target.value) : undefined})}
                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Cualquiera</option>
                <option value="4">4+ estrellas</option>
                <option value="4.5">4.5+ estrellas</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => setFilters({...filters, inStock: e.target.checked || undefined})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo productos en stock</span>
            </label>
          </div>
        </div>
      )}

      {/* Dropdown de resultados */}
      {isOpen && (suggestions.length > 0 || results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mr-2" />
              Buscando...
            </div>
          )}

          {/* Sugerencias */}
          {suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedIndex === index ? 'bg-indigo-50' : ''
                  }`}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="text-xs text-gray-500">{suggestion.count}+ búsquedas</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onResultSelect(result);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedIndex === suggestions.length + index ? 'bg-indigo-50' : ''
                  }`}
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.name}</p>
                    <p className="text-sm text-gray-500">{result.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-semibold text-indigo-600">
                        ${result.price.toLocaleString()}
                      </span>
                      {result.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{result.rating}</span>
                        </div>
                      )}
                      {!result.inStock && (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No hay resultados */}
          {!isLoading && query && suggestions.length === 0 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p>No se encontraron resultados para "{query}"</p>
              <p className="text-sm mt-1">Intenta con términos diferentes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
