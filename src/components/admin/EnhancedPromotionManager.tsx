import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Promotion, Product } from '../../types/index';
import { toast } from 'react-hot-toast';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Calendar, 
  Percent, 
  Gift,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Search,
  Filter
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

export function EnhancedPromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentPromotion, setCurrentPromotion] = useState<Partial<Promotion>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadPromotions();
    loadProducts();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const resetForm = () => {
    setCurrentPromotion({
      type: 'percentage',
      active: true,
      is_active: true
    });
  };

  const handleAddPromotion = () => {
    setFormMode('add');
    resetForm();
    setShowForm(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setFormMode('edit');
    setCurrentPromotion(promotion);
    setShowForm(true);
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta promoción?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promoción eliminada correctamente');
      loadPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Error al eliminar la promoción');
    }
  };

  const togglePromotionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ 
          active: !currentStatus,
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Promoción ${!currentStatus ? 'activada' : 'desactivada'}`);
      loadPromotions();
    } catch (error) {
      console.error('Error updating promotion status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentPromotion({ 
        ...currentPromotion, 
        [name]: checked,
        ...(name === 'active' ? { is_active: checked } : {})
      });
    } else {
      setCurrentPromotion({ ...currentPromotion, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPromotion.name || !currentPromotion.type) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const promotionData = {
        ...currentPromotion,
        updated_at: new Date().toISOString()
      };

      if (formMode === 'add') {
        const { error } = await supabase
          .from('promotions')
          .insert([promotionData]);

        if (error) throw error;
        toast.success('Promoción creada correctamente');
      } else {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', currentPromotion.id);

        if (error) throw error;
        toast.success('Promoción actualizada correctamente');
      }

      setShowForm(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Error al guardar la promoción');
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    const labels = {
      '2x1': '2x1',
      '3x1': '3x1',
      '3x2': '3x2',
      'discount': 'Descuento Fijo',
      'percentage': 'Porcentaje',
      'fixed': 'Precio Fijo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPromotionIcon = (type: string) => {
    const icons = {
      '2x1': Gift,
      '3x1': Gift,
      '3x2': Gift,
      'discount': DollarSign,
      'percentage': Percent,
      'fixed': Tag
    };
    return icons[type as keyof typeof icons] || Tag;
  };

  const isPromotionActive = (promotion: Promotion) => {
    if (!promotion.active && !promotion.is_active) return false;
    
    const now = new Date();
    if (promotion.start_date && new Date(promotion.start_date) > now) return false;
    if (promotion.end_date && new Date(promotion.end_date) < now) return false;
    
    return true;
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    
    if (!promotion.active && !promotion.is_active) {
      return { status: 'inactive', label: 'Inactiva', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
    
    if (promotion.start_date && new Date(promotion.start_date) > now) {
      return { status: 'scheduled', label: 'Programada', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    
    if (promotion.end_date && new Date(promotion.end_date) < now) {
      return { status: 'expired', label: 'Expirada', color: 'text-red-600', bg: 'bg-red-100' };
    }
    
    return { status: 'active', label: 'Activa', color: 'text-green-600', bg: 'bg-green-100' };
  };

  // Filter logic
  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && isPromotionActive(promotion)) ||
      (statusFilter === 'inactive' && !isPromotionActive(promotion)) ||
      (statusFilter === getPromotionStatus(promotion).status);
    
    const matchesType = !typeFilter || promotion.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics
  const stats = {
    total: promotions.length,
    active: promotions.filter(p => isPromotionActive(p)).length,
    scheduled: promotions.filter(p => {
      const status = getPromotionStatus(p);
      return status.status === 'scheduled';
    }).length,
    expired: promotions.filter(p => {
      const status = getPromotionStatus(p);
      return status.status === 'expired';
    }).length
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="Cargando promociones..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Promociones</h2>
            <p className="text-gray-600">Crea y administra promociones para tus productos</p>
          </div>
          <button
            onClick={handleAddPromotion}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Promoción
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-blue-600" />
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
                <p className="text-sm font-medium text-green-600">Activas</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Programadas</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.scheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Expiradas</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar promociones..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="scheduled">Programadas</option>
              <option value="expired">Expiradas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los tipos</option>
              <option value="2x1">2x1</option>
              <option value="3x1">3x1</option>
              <option value="3x2">3x2</option>
              <option value="percentage">Porcentaje</option>
              <option value="discount">Descuento Fijo</option>
              <option value="fixed">Precio Fijo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      {filteredPromotions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter || typeFilter
              ? 'No se encontraron promociones con los filtros aplicados'
              : 'Comienza creando tu primera promoción'
            }
          </p>
          {!searchTerm && !statusFilter && !typeFilter && (
            <button
              onClick={handleAddPromotion}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Promoción
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            const PromotionIcon = getPromotionIcon(promotion.type);
            
            return (
              <div key={promotion.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <PromotionIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{promotion.name}</h3>
                        <p className="text-sm text-gray-500">{getPromotionTypeLabel(promotion.type)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Description */}
                  {promotion.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {promotion.description}
                    </p>
                  )}

                  {/* Value */}
                  <div className="mb-4">
                    {promotion.type === 'percentage' && promotion.discount_percent && (
                      <div className="text-2xl font-bold text-green-600">
                        {promotion.discount_percent}% OFF
                      </div>
                    )}
                    {promotion.type === 'discount' && promotion.value && (
                      <div className="text-2xl font-bold text-green-600">
                        ${promotion.value.toLocaleString()} OFF
                      </div>
                    )}
                    {promotion.type === 'fixed' && promotion.total_price && (
                      <div className="text-2xl font-bold text-green-600">
                        ${promotion.total_price.toLocaleString()}
                      </div>
                    )}
                    {['2x1', '3x1', '3x2'].includes(promotion.type) && (
                      <div className="text-2xl font-bold text-green-600">
                        {getPromotionTypeLabel(promotion.type)}
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  {(promotion.start_date || promotion.end_date) && (
                    <div className="text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {promotion.start_date && new Date(promotion.start_date).toLocaleDateString()}
                          {promotion.start_date && promotion.end_date && ' - '}
                          {promotion.end_date && new Date(promotion.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      onClick={() => togglePromotionStatus(promotion.id!, promotion.active || promotion.is_active || false)}
                      className={`text-sm font-medium ${
                        promotion.active || promotion.is_active
                          ? 'text-red-600 hover:text-red-700'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {promotion.active || promotion.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPromotion(promotion)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePromotion(promotion.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {formMode === 'add' ? 'Crear Promoción' : 'Editar Promoción'}
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la promoción *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={currentPromotion.name || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={currentPromotion.description || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de promoción *
                    </label>
                    <select
                      name="type"
                      value={currentPromotion.type || ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="2x1">2x1 (Lleva 2, paga 1)</option>
                      <option value="3x1">3x1 (Lleva 3, paga 1)</option>
                      <option value="3x2">3x2 (Lleva 3, paga 2)</option>
                      <option value="percentage">Descuento porcentual</option>
                      <option value="discount">Descuento fijo</option>
                      <option value="fixed">Precio fijo total</option>
                    </select>
                  </div>

                  {/* Value based on type */}
                  {currentPromotion.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje de descuento (%)
                      </label>
                      <input
                        type="number"
                        name="discount_percent"
                        value={currentPromotion.discount_percent || ''}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {currentPromotion.type === 'discount' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto del descuento ($)
                      </label>
                      <input
                        type="number"
                        name="value"
                        value={currentPromotion.value || ''}
                        onChange={handleInputChange}
                        min="0"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {currentPromotion.type === 'fixed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio total fijo ($)
                      </label>
                      <input
                        type="number"
                        name="total_price"
                        value={currentPromotion.total_price || ''}
                        onChange={handleInputChange}
                        min="0"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {['2x1', '3x1', '3x2'].includes(currentPromotion.type || '') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad a comprar
                        </label>
                        <input
                          type="number"
                          name="buy_quantity"
                          value={currentPromotion.buy_quantity || ''}
                          onChange={handleInputChange}
                          min="1"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad que se lleva
                        </label>
                        <input
                          type="number"
                          name="get_quantity"
                          value={currentPromotion.get_quantity || ''}
                          onChange={handleInputChange}
                          min="1"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de inicio (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={currentPromotion.start_date ? new Date(currentPromotion.start_date).toISOString().slice(0, 16) : ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de fin (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      value={currentPromotion.end_date ? new Date(currentPromotion.end_date).toISOString().slice(0, 16) : ''}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={currentPromotion.active || currentPromotion.is_active || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Promoción activa
                  </label>
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
                  {formMode === 'add' ? 'Crear Promoción' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
