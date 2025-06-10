import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/index';
import { toast } from 'react-hot-toast';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Search, 
  Filter, 
  Eye, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { DocumentUploader } from './DocumentUploader';
import { ColorManager } from './ColorManager';
import { LoadingSpinner } from '../LoadingSpinner';

export function EnhancedProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form state
  const [images, setImages] = useState<string[]>([]);
  const [document, setDocument] = useState<string | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [colorImages, setColorImages] = useState<{ color: string; image: string }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState({
    cash_on_delivery: true,
    card: true,
    payment_url: ''
  });

  useEffect(() => {
    loadProducts();
  }, [sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentProduct({});
    setImages([]);
    setDocument(null);
    setAvailableColors([]);
    setColorImages([]);
    setPaymentMethods({
      cash_on_delivery: true,
      card: true,
      payment_url: ''
    });
  };

  const handleAddProduct = () => {
    setFormMode('add');
    resetForm();
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormMode('edit');
    setCurrentProduct(product);
    setImages(product.images || []);
    setDocument(product.instructions_file || null);
    setAvailableColors(product.available_colors || []);
    setColorImages(product.color_images || []);
    setPaymentMethods(product.allowed_payment_methods || {
      cash_on_delivery: true,
      card: true,
      payment_url: ''
    });
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Producto eliminado correctamente');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProduct.name || !currentProduct.price) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (images.length === 0) {
      toast.error('Por favor agrega al menos una imagen');
      return;
    }

    try {
      const productData = {
        ...currentProduct,
        images,
        instructions_file: document,
        available_colors: availableColors.length > 0 ? availableColors : null,
        color_images: colorImages.length > 0 ? colorImages : null,
        allowed_payment_methods: paymentMethods,
        updated_at: new Date().toISOString()
      };

      if (formMode === 'add') {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Producto añadido correctamente');
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);

        if (error) throw error;
        toast.success('Producto actualizado correctamente');
      }

      setShowForm(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    }
  };

  // Filter and search logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    const matchesStock = !stockFilter || 
      (stockFilter === 'in_stock' && product.stock > 0) ||
      (stockFilter === 'low_stock' && product.stock <= 5 && product.stock > 0) ||
      (stockFilter === 'out_of_stock' && product.stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Statistics
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    lowStock: products.filter(p => p.stock <= 5 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', text: 'Sin stock' };
    if (stock <= 5) return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Stock bajo' };
    return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'En stock' };
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="Cargando productos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
            <p className="text-gray-600">Administra tu catálogo de productos</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Producto
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">En Stock</p>
                <p className="text-2xl font-bold text-green-900">{stats.inStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Sin Stock</p>
                <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Valor Total</p>
                <p className="text-lg font-bold text-purple-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los stocks</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock bajo</option>
              <option value="out_of_stock">Sin stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="created_at-desc">Más recientes</option>
              <option value="created_at-asc">Más antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
              <option value="stock-asc">Stock menor</option>
              <option value="stock-desc">Stock mayor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || categoryFilter || stockFilter
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza agregando tu primer producto'
            }
          </p>
          {!searchTerm && !categoryFilter && !stockFilter && (
            <button
              onClick={handleAddProduct}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            
            return (
              <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-square bg-gray-200 relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Stock Status Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full ${stockStatus.bg}`}>
                    <div className="flex items-center space-x-1">
                      <stockStatus.icon className={`h-3 w-3 ${stockStatus.color}`} />
                      <span className={`text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-indigo-600">
                      ${product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Category and Colors */}
                  <div className="flex items-center justify-between mb-3">
                    {product.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {product.category}
                      </span>
                    )}
                    {product.available_colors && product.available_colors.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {product.available_colors.length} colores
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {formMode === 'add' ? 'Agregar Producto' : 'Editar Producto'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={currentProduct.name || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={currentProduct.price || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={currentProduct.stock || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={currentProduct.category || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de envío
                    </label>
                    <input
                      type="text"
                      name="shipping_days"
                      value={currentProduct.shipping_days || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: 10, 10-15, 5-7"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={currentProduct.description || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes del producto *
                  </label>
                  <ImageUploader
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                  />
                </div>

                {/* Colors */}
                <ColorManager
                  availableColors={availableColors}
                  colorImages={colorImages}
                  onColorsChange={setAvailableColors}
                  onColorImagesChange={setColorImages}
                />

                {/* Document */}
                <DocumentUploader
                  document={document}
                  onDocumentChange={setDocument}
                />

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Métodos de pago permitidos
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="cash_on_delivery"
                        checked={paymentMethods.cash_on_delivery}
                        onChange={(e) => setPaymentMethods({
                          ...paymentMethods,
                          cash_on_delivery: e.target.checked
                        })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="cash_on_delivery" className="ml-2 text-sm text-gray-700">
                        Pago contra entrega
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="card"
                        checked={paymentMethods.card}
                        onChange={(e) => setPaymentMethods({
                          ...paymentMethods,
                          card: e.target.checked
                        })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="card" className="ml-2 text-sm text-gray-700">
                        Tarjeta de crédito/débito (MercadoPago)
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL de pago personalizada (opcional)
                      </label>
                      <input
                        type="url"
                        value={paymentMethods.payment_url || ''}
                        onChange={(e) => setPaymentMethods({
                          ...paymentMethods,
                          payment_url: e.target.value
                        })}
                        placeholder="https://..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {formMode === 'add' ? 'Crear Producto' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
