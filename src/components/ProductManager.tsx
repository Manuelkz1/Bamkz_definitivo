import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/index';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, Plus, X, Truck, Upload, Image as ImageIcon, FileText, Download } from 'lucide-react';

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productManual, setProductManual] = useState<string | null>(null);
  const [uploadingManual, setUploadingManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle shipping_days as text to allow ranges like "10-15"
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (productImages.length + files.length > 10) {
      toast.error('Máximo 10 imágenes permitidas');
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande. Máximo 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setProductImages([...productImages, ...newImages]);
            setUploadingImages(false);
            toast.success(`${newImages.length} imagen(es) agregada(s)`);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    setProductImages(newImages);
    toast.success('Imagen eliminada');
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...productImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setProductImages(newImages);
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Use PDF, DOC, DOCX o TXT');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 10MB');
      return;
    }

    setUploadingManual(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProductManual(event.target.result as string);
        setUploadingManual(false);
        toast.success('Manual subido correctamente');
      }
    };

    reader.onerror = () => {
      setUploadingManual(false);
      toast.error('Error al leer el archivo');
    };

    reader.readAsDataURL(file);

    // Reset input
    if (manualInputRef.current) {
      manualInputRef.current.value = '';
    }
  };

  const removeManual = () => {
    setProductManual(null);
    toast.success('Manual eliminado');
  };

  const downloadManual = () => {
    if (!productManual) return;
    
    try {
      const link = document.createElement('a');
      link.href = productManual;
      link.download = `manual-${currentProduct.name || 'producto'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Error al descargar el manual');
    }
  };

  const getFileInfo = (base64String: string) => {
    try {
      // Extraer información del tipo de archivo del base64
      const mimeType = base64String.substring(base64String.indexOf(':') + 1, base64String.indexOf(';'));
      const extension = mimeType.includes('pdf') ? 'PDF' : 
                      mimeType.includes('word') ? 'DOC' : 
                      mimeType.includes('document') ? 'DOCX' : 'DOC';
      
      // Calcular tamaño aproximado
      const sizeInKB = Math.round((base64String.length * 0.75) / 1024);
      
      return { extension, sizeInKB };
    } catch {
      return { extension: 'DOC', sizeInKB: 0 };
    }
  };

  const handleAddProduct = () => {
    setFormMode('add');
    setCurrentProduct({});
    setProductImages([]);
    setProductManual(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormMode('edit');
    setCurrentProduct(product);
    setProductImages(product.images || []);
    setProductManual(product.instructions_file || null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProduct.name || !currentProduct.price) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const productData = {
        ...currentProduct,
        images: productImages.length > 0 ? productImages : null,
        instructions_file: productManual,
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
      setProductImages([]);
      setProductManual(null);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Productos</h2>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Añadir Producto
        </button>
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {formMode === 'add' ? 'Añadir Producto' : 'Editar Producto'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentProduct.name || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={currentProduct.price || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={currentProduct.stock || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={currentProduct.category || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="shipping_days" className="block text-sm font-medium text-gray-700 mb-1">
                  Días Hábiles de Envío
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="shipping_days"
                    name="shipping_days"
                    value={currentProduct.shipping_days || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ej: 10, 10-15, 5-7"
                  />
                  <Truck className="h-5 w-5 ml-2 text-indigo-600" />
                </div>
                <p className="mt-1 text-xs text-gray-500">Tiempo estimado de entrega en días hábiles (puedes usar rangos como "10-15")</p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={currentProduct.description || ''}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Sección de imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del producto
              </label>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages || productImages.length >= 10}
                      className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
                    >
                      {uploadingImages ? 'Subiendo...' : 'Haz clic para subir imágenes'}
                    </button>
                    <span className="text-gray-500"> o arrastra aquí</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, JPEG hasta 5MB cada una
                  </p>
                  <p className="text-xs text-gray-400">
                    {productImages.length}/10 imágenes
                  </p>
                </div>
              </div>

              {/* Image Preview Grid */}
              {productImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {productImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Producto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Order Buttons */}
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
                            className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded hover:bg-opacity-80"
                          >
                            ←
                          </button>
                        )}
                        
                        <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                          {index + 1}
                        </span>
                        
                        {index < productImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded hover:bg-opacity-80"
                          >
                            →
                          </button>
                        )}
                      </div>

                      {/* Primary Image Indicator */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Info */}
              {productImages.length === 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>• La primera imagen será la imagen principal del producto</p>
                  <p>• Puedes reordenar las imágenes arrastrando</p>
                  <p>• Máximo 10 imágenes por producto</p>
                </div>
              )}
            </div>

            {/* Sección de manual del producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual del producto (opcional)
              </label>
              
              {!productManual ? (
                /* Upload Area para manual */
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={manualInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleManualUpload}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-12 w-12 text-gray-400" />
                    <div>
                      <button
                        type="button"
                        onClick={() => manualInputRef.current?.click()}
                        disabled={uploadingManual}
                        className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
                      >
                        {uploadingManual ? 'Subiendo...' : 'Haz clic para subir manual'}
                      </button>
                      <span className="text-gray-500"> o arrastra aquí</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, TXT hasta 10MB
                    </p>
                    <p className="text-xs text-gray-400">
                      Manual de usuario, instrucciones o documentación del producto
                    </p>
                  </div>
                </div>
              ) : (
                /* Preview del manual subido */
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Manual del producto
                        </p>
                        <p className="text-xs text-gray-500">
                          {getFileInfo(productManual).extension} • ~{getFileInfo(productManual).sizeInKB}KB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={downloadManual}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Descargar manual"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={removeManual}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar manual"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón para reemplazar manual si ya existe */}
              {productManual && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => manualInputRef.current?.click()}
                    disabled={uploadingManual}
                    className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                  >
                    {uploadingManual ? 'Subiendo...' : 'Reemplazar manual'}
                  </button>
                  <input
                    ref={manualInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleManualUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Info sobre el manual */}
              <div className="mt-2 text-sm text-gray-500">
                <p>• Los clientes podrán descargar este manual desde la página del producto</p>
                <p>• Formatos soportados: PDF, DOC, DOCX, TXT</p>
                <p>• Tamaño máximo: 10MB</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
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
                {formMode === 'add' ? 'Añadir' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días de Envío
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images && product.images.length > 0 && (
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover\" src={product.images[0]} alt="" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.shipping_days ? `${product.shipping_days} días hábiles` : 'No especificado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductManager;