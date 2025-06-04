import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Plus,
  X,
  Edit,
  Trash2,
  Save,
  Search,
  Truck
} from 'lucide-react';
import type { Product } from '../types/index';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    shipping_days: '', // Campo para días de envío
    images: [] as string[],
    available_colors: [] as string[],
    color_images: [] as {color: string, image: string}[],
    allowed_payment_methods: {
      cash_on_delivery: true,
      card: true,
      payment_url: ''
    }
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Cargando productos...");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en la consulta de productos:', error);
        throw error;
      }
      
      console.log(`Productos cargados: ${data?.length || 0}`);
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      setError(error.message || "Error al cargar los productos");
      toast.error('Error al cargar los productos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || '',
      stock: product.stock.toString(),
      shipping_days: product.shipping_days?.toString() || '', // Inicializar campo de días de envío
      images: product.images || [],
      available_colors: product.available_colors || [],
      color_images: product.color_images || [],
      allowed_payment_methods: {
        cash_on_delivery: product.allowed_payment_methods?.cash_on_delivery ?? true,
        card: product.allowed_payment_methods?.card ?? true,
        payment_url: product.allowed_payment_methods?.payment_url || ''
      }
    });
    setShowProductModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validación de campos obligatorios
      if (!productForm.name.trim()) {
        toast.error('El nombre del producto es obligatorio');
        return;
      }
      
      if (!productForm.description.trim()) {
        toast.error('La descripción del producto es obligatoria');
        return;
      }
      
      if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
        toast.error('El precio debe ser un número válido mayor que cero');
        return;
      }
      
      if (!productForm.stock || isNaN(parseInt(productForm.stock)) || parseInt(productForm.stock) < 0) {
        toast.error('El stock debe ser un número válido no negativo');
        return;
      }
      
      // Validar días de envío (opcional pero debe ser un número positivo si se proporciona)
      let shippingDays = undefined;
      if (productForm.shipping_days) {
        const days = parseInt(productForm.shipping_days);
        if (isNaN(days) || days < 0) {
          toast.error('Los días de envío deben ser un número válido no negativo');
          return;
        }
        shippingDays = days;
      }
      
      // Filtrar imágenes vacías
      const filteredImages = productForm.images.filter(img => img.trim() !== '');
      
      // Validar que haya al menos una imagen
      if (filteredImages.length === 0) {
        toast.error('Debe agregar al menos una imagen del producto');
        return;
      }
      
      // Filtrar colores vacíos y asegurar que no haya duplicados
      const filteredColors = [...new Set(productForm.available_colors.filter(color => color.trim() !== ''))];
      
      // Validar y limpiar color_images
      let validColorImages = [];
      if (filteredColors.length > 0) {
        // Solo incluir color_images para colores que existen en available_colors
        validColorImages = productForm.color_images
          .filter(item => 
            item.color && 
            item.image && 
            item.color.trim() !== '' && 
            item.image.trim() !== '' &&
            filteredColors.includes(item.color)
          );
      }
      
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        category: productForm.category.trim(),
        stock: parseInt(productForm.stock),
        shipping_days: shippingDays, // Incluir días de envío en los datos
        images: filteredImages,
        available_colors: filteredColors,
        color_images: validColorImages,
        allowed_payment_methods: {
          ...productForm.allowed_payment_methods,
          payment_url: productForm.allowed_payment_methods.card ? 
            productForm.allowed_payment_methods.payment_url.trim() : 
            ''
        }
      };

      console.log('Guardando producto con datos:', JSON.stringify(productData, null, 2));

      if (editingProduct) {
        // Primero actualizamos el producto
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...productData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (updateError) {
          console.error('Error al actualizar el producto:', updateError);
          throw new Error(`Error al actualizar el producto: ${updateError.message}`);
        }
        
        // Luego obtenemos el producto actualizado en una consulta separada
        const { data: updatedProduct, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', editingProduct.id)
          .single();
        
        if (fetchError) {
          console.error('Error al obtener el producto actualizado:', fetchError);
          throw new Error('Error al obtener el producto actualizado');
        }
        
        if (!updatedProduct) {
          throw new Error('No se pudo encontrar el producto actualizado');
        }
        
        // Actualizamos el producto en el estado local
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === editingProduct.id ? updatedProduct : p
          )
        );
        
        toast.success('Producto actualizado exitosamente');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error al crear el producto:', error);
          throw new Error(`Error al crear el producto: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('No se pudo crear el producto. Por favor, intente nuevamente.');
        }
        
        // Añadimos el nuevo producto al estado local
        setProducts(prevProducts => [data, ...prevProducts]);
        
        toast.success('Producto creado exitosamente');
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        shipping_days: '',
        images: [],
        available_colors: [],
        color_images: [],
        allowed_payment_methods: {
          cash_on_delivery: true,
          card: true,
          payment_url: ''
        }
      });
      
      // Recargamos los productos para asegurar que tenemos los datos más actualizados
      await loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Error al guardar el producto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      // Actualizamos el estado local para reflejar los cambios inmediatamente
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      
      toast.success('Producto eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleImageUrlAdd = () => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImages = [...productForm.images];
    newImages[index] = value;
    setProductForm(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleImageUrlRemove = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleColorAdd = () => {
    setProductForm(prev => ({
      ...prev,
      available_colors: [...prev.available_colors, ''],
      color_images: [...prev.color_images]
    }));
  };

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...productForm.available_colors];
    newColors[index] = value;
    
    // Actualizar también el color en color_images si existe
    const newColorImages = [...productForm.color_images];
    const existingColorImageIndex = newColorImages.findIndex(ci => ci.color === productForm.available_colors[index]);
    if (existingColorImageIndex >= 0) {
      newColorImages[existingColorImageIndex].color = value;
    }
    
    setProductForm(prev => ({
      ...prev,
      available_colors: newColors,
      color_images: newColorImages
    }));
  };

  const handleColorRemove = (index: number) => {
    const colorToRemove = productForm.available_colors[index];
    
    // Eliminar también las imágenes asociadas a este color
    const newColorImages = productForm.color_images.filter(ci => ci.color !== colorToRemove);
    
    setProductForm(prev => ({
      ...prev,
      available_colors: prev.available_colors.filter((_, i) => i !== index),
      color_images: newColorImages
    }));
  };

  const handleColorImageAdd = (color: string) => {
    setProductForm(prev => ({
      ...prev,
      color_images: [...prev.color_images, { color, image: '' }]
    }));
  };

  const handleColorImageChange = (index: number, value: string) => {
    const newColorImages = [...productForm.color_images];
    newColorImages[index].image = value;
    setProductForm(prev => ({
      ...prev,
      color_images: newColorImages
    }));
  };

  const handleColorImageRemove = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      color_images: prev.color_images.filter((_, i) => i !== index)
    }));
  };

  const handlePaymentMethodChange = (method: 'cash_on_delivery' | 'card', checked: boolean) => {
    setProductForm(prev => ({
      ...prev,
      allowed_payment_methods: {
        ...prev.allowed_payment_methods,
        [method]: checked
      }
    }));
  };

  const handlePaymentUrlChange = (url: string) => {
    setProductForm(prev => ({
      ...prev,
      allowed_payment_methods: {
        ...prev.allowed_payment_methods,
        payment_url: url
      }
    }));
  };

  // Función para actualizar rápidamente los días de envío sin abrir el modal completo
  const handleQuickShippingDaysUpdate = async (productId: string, currentDays: number | undefined) => {
    const newDays = prompt('Ingrese los días de envío para este producto:', currentDays?.toString() || '');
    
    if (newDays === null) return; // Usuario canceló
    
    const days = parseInt(newDays);
    if (isNaN(days) || days < 0) {
      toast.error('Los días de envío deben ser un número válido no negativo');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          shipping_days: days,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Actualizar el estado local
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId ? { ...p, shipping_days: days } : p
        )
      );
      
      toast.success('Días de envío actualizados exitosamente');
    } catch (error: any) {
      console.error('Error updating shipping days:', error);
      toast.error('Error al actualizar los días de envío');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              name: '',
              description: '',
              price: '',
              category: '',
              stock: '',
              shipping_days: '',
              images: [''],
              available_colors: [],
              color_images: [],
              allowed_payment_methods: {
                cash_on_delivery: true,
                card: true,
                payment_url: ''
              }
            });
            setShowProductModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar productos..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-8 rounded text-center">
          {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay productos disponibles. Crea tu primer producto con el botón "Nuevo Producto".'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días de Envío</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-md object-cover"
                          src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      {product.shipping_days !== undefined ? `${product.shipping_days} días` : 'No definido'}
                      <button
                        onClick={() => handleQuickShippingDaysUpdate(product.id, product.shipping_days)}
                        className="ml-2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-full"
                        title="Editar días de envío"
                      >
                        <Truck className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category || 'Sin categoría'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <input
                    type="text"
                    id="category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Precio *
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Stock *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="shipping_days" className="block text-sm font-medium text-gray-700">
                    Días de Envío
                  </label>
                  <input
                    type="number"
                    id="shipping_days"
                    value={productForm.shipping_days}
                    onChange={(e) => setProductForm({ ...productForm, shipping_days: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    placeholder="Ej: 3"
                  />
                  <p className="mt-1 text-xs text-gray-500">Tiempo estimado de entrega en días</p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes del Producto *
                </label>
                <div className="space-y-3">
                  {productForm.images.map((image, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder="URL de la imagen"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUrlRemove(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleImageUrlAdd}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Imagen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colores Disponibles
                </label>
                <div className="space-y-3">
                  {productForm.available_colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        placeholder="Nombre del color (ej: Rojo, Azul, etc.)"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleColorImageAdd(color)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                        title="Añadir imagen para este color"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleColorRemove(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleColorAdd}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Color
                  </button>
                </div>
              </div>

              {productForm.available_colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes por Color
                  </label>
                  <div className="space-y-3">
                    {productForm.color_images.map((colorImage, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1/4">
                          <span className="text-sm text-gray-500">{colorImage.color}</span>
                        </div>
                        <input
                          type="text"
                          value={colorImage.image}
                          onChange={(e) => handleColorImageChange(index, e.target.value)}
                          placeholder="URL de la imagen para este color"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleColorImageRemove(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métodos de Pago Permitidos
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="cash_on_delivery"
                      type="checkbox"
                      checked={productForm.allowed_payment_methods.cash_on_delivery}
                      onChange={(e) => handlePaymentMethodChange('cash_on_delivery', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cash_on_delivery" className="ml-2 block text-sm text-gray-900">
                      Pago contra entrega
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="card"
                      type="checkbox"
                      checked={productForm.allowed_payment_methods.card}
                      onChange={(e) => handlePaymentMethodChange('card', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="card" className="ml-2 block text-sm text-gray-900">
                      Tarjeta / Pago en línea
                    </label>
                  </div>
                  {productForm.allowed_payment_methods.card && (
                    <div className="ml-6 mt-2">
                      <label htmlFor="payment_url" className="block text-sm text-gray-700">
                        URL de pago (opcional)
                      </label>
                      <input
                        type="text"
                        id="payment_url"
                        value={productForm.allowed_payment_methods.payment_url || ''}
                        onChange={(e) => handlePaymentUrlChange(e.target.value)}
                        placeholder="https://..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-5 border-t">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
