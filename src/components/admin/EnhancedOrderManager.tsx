import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types/index';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Download,
  Printer
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

export function EnhancedOrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price_at_time,
            selected_color,
            products (
              id,
              name,
              images
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdating(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Estado actualizado a ${getStatusLabel(newStatus)}`);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(null);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: Order['payment_status']) => {
    try {
      setUpdating(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Estado de pago actualizado a ${getPaymentStatusLabel(newStatus)}`);
      loadOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error al actualizar el estado de pago');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    return colors[status];
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    const colors = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      paid: { bg: 'bg-green-100', text: 'text-green-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    return colors[status];
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status];
  };

  const getPaymentStatusLabel = (status: Order['payment_status']) => {
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      failed: 'Fallido'
    };
    return labels[status];
  };

  const getPaymentMethodLabel = (method: Order['payment_method']) => {
    const labels = {
      cash_on_delivery: 'Pago contra entrega',
      mercadopago: 'MercadoPago'
    };
    return labels[method];
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_address.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPayment = !paymentFilter || order.payment_status === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
    pendingPayments: orders.filter(o => o.payment_status === 'pending').length
  };

  const exportOrders = () => {
    const csvData = filteredOrders.map(order => ({
      ID: order.id,
      Fecha: new Date(order.created_at).toLocaleDateString(),
      Cliente: order.customer_name || order.shipping_address.full_name,
      Email: order.customer_email,
      Teléfono: order.customer_phone || order.shipping_address.phone,
      Total: order.total,
      Estado: getStatusLabel(order.status),
      'Estado Pago': getPaymentStatusLabel(order.payment_status),
      'Método Pago': getPaymentMethodLabel(order.payment_method),
      Ciudad: order.shipping_address.city,
      Dirección: order.shipping_address.address
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner size="xl" text="Cargando pedidos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
            <p className="text-gray-600">Administra todos los pedidos y su estado</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadOrders}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </button>
            <button
              onClick={exportOrders}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-indigo-600">Procesando</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Enviados</p>
                <p className="text-2xl font-bold text-purple-900">{stats.shipped}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Entregados</p>
                <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-emerald-600">Ingresos</p>
                <p className="text-xl font-bold text-emerald-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
                placeholder="ID, cliente, email..."
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
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pago</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los pagos</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="failed">Fallido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                const paymentColor = getPaymentStatusColor(order.payment_status);
                const StatusIcon = statusColor.icon;

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getPaymentMethodLabel(order.payment_method)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name || order.shipping_address.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email || 'Sin email'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer_phone || order.shipping_address.phone}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        ${order.total.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${statusColor.text}`} />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentColor.bg} ${paymentColor.text}`}>
                        {getPaymentStatusLabel(order.payment_status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetail(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Quick Status Updates */}
                        <div className="flex items-center space-x-1">
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                              disabled={updating === order.id}
                              className="text-xs border-gray-300 rounded focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="processing">Procesando</option>
                              <option value="shipped">Enviado</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelar</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter || paymentFilter || dateFilter
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Aún no hay pedidos en el sistema'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                Pedido #{selectedOrder.id.slice(-8)}
              </h3>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Información del Pedido</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">ID:</span>
                        <span className="text-sm">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Fecha:</span>
                        <span className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-bold">${selectedOrder.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Estado:</span>
                        <span className="text-sm">{getStatusLabel(selectedOrder.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Pago:</span>
                        <span className="text-sm">{getPaymentStatusLabel(selectedOrder.payment_status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Método:</span>
                        <span className="text-sm">{getPaymentMethodLabel(selectedOrder.payment_method)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Información del Cliente</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Nombre:</span>
                        <span className="text-sm">{selectedOrder.customer_name || selectedOrder.shipping_address.full_name}</span>
                      </div>
                      {selectedOrder.customer_email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedOrder.customer_email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedOrder.customer_phone || selectedOrder.shipping_address.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Dirección de Envío</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="text-sm">
                          <div>{selectedOrder.shipping_address.address}</div>
                          <div>{selectedOrder.shipping_address.city}</div>
                          <div>{selectedOrder.shipping_address.postal_code}</div>
                          <div>{selectedOrder.shipping_address.country}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Productos</h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {item.products.images && item.products.images.length > 0 ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.products.name}</h5>
                            <div className="text-sm text-gray-500">
                              Cantidad: {item.quantity} × ${item.price_at_time.toLocaleString()}
                            </div>
                            {item.selected_color && (
                              <div className="text-sm text-gray-500">
                                Color: {item.selected_color}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ${(item.quantity * item.price_at_time).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Actualizar Estado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado del Pedido
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrder.id, e.target.value as Order['status']);
                        setSelectedOrder({
                          ...selectedOrder,
                          status: e.target.value as Order['status']
                        });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="processing">Procesando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado del Pago
                    </label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => {
                        updatePaymentStatus(selectedOrder.id, e.target.value as Order['payment_status']);
                        setSelectedOrder({
                          ...selectedOrder,
                          payment_status: e.target.value as Order['payment_status']
                        });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="failed">Fallido</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
