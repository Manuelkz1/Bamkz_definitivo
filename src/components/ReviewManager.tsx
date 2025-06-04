import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Review } from '../types/index';
import { toast } from 'react-hot-toast';
import { Star, Search, RefreshCw, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewManager() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [newReview, setNewReview] = useState({
    product_id: '',
    name: '',
    rating: 5,
    comment: '',
    approved: true
  });

  useEffect(() => {
    loadReviews();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
      
      if (data && data.length > 0) {
        setNewReview(prev => ({ ...prev, product_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId ? { ...review, approved: true } : review
        )
      );
      
      toast.success('Reseña aprobada');
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Error al aprobar la reseña');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: false })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId ? { ...review, approved: false } : review
        )
      );
      
      toast.success('Reseña rechazada');
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Error al rechazar la reseña');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Reseña eliminada');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Error al eliminar la reseña');
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes estar autenticado para crear reseñas');
      return;
    }

    if (!newReview.product_id) {
      toast.error('Debes seleccionar un producto');
      return;
    }

    if (!newReview.name) {
      toast.error('Debes ingresar un nombre de usuario');
      return;
    }

    if (!newReview.comment) {
      toast.error('Debes ingresar un comentario');
      return;
    }

    try {
      const reviewData = {
        product_id: newReview.product_id,
        user_id: user.id,
        name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        approved: newReview.approved,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (insertError) throw insertError;
      
      toast.success('Reseña creada con éxito');
      
      // Reset form
      setNewReview({
        product_id: products[0]?.id || '',
        name: '',
        rating: 5,
        comment: '',
        approved: true
      });
      
      setShowCreateForm(false);
      
      // Reload reviews to show the new one
      await loadReviews();
      
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast.error(`Error al crear la reseña: ${error.message || 'Intente nuevamente'}`);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !review.approved) ||
      (filter === 'approved' && review.approved);

    const matchesSearch =
      searchTerm === '' ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review as any).products?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Reseñas</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear Reseña
          </button>
          <button
            onClick={loadReviews}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Reseña</h3>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Producto
              </label>
              <select
                id="product"
                value={newReview.product_id}
                onChange={(e) => setNewReview(prev => ({ ...prev, product_id: e.target.value }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Seleccionar producto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                value={newReview.name}
                onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ej: María López"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Calificación
              </label>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newReview.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Comentario
              </label>
              <textarea
                id="comment"
                rows={3}
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Escribe un comentario realista sobre el producto..."
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="approved"
                type="checkbox"
                checked={newReview.approved}
                onChange={(e) => setNewReview(prev => ({ ...prev, approved: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="approved" className="ml-2 block text-sm text-gray-900">
                Aprobar automáticamente
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Crear Reseña
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex space-x-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar reseñas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="all">Todas</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {filteredReviews.map((review) => (
            <li key={review.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {(review as any).products?.name || 'Producto no encontrado'}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        review.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.approved ? 'Aprobada' : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                      <p className="ml-2 text-sm text-gray-500">
                        por {review.name || 'Usuario anónimo'}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{review.comment}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(new Date(review.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="ml-6 flex-shrink-0 flex items-center space-x-2">
                  {!review.approved && (
                    <button
                      onClick={() => handleApproveReview(review.id)}
                      className="p-1 rounded-full text-green-600 hover:bg-green-100"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  )}
                  {review.approved && (
                    <button
                      onClick={() => handleRejectReview(review.id)}
                      className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1 rounded-full text-red-600 hover:bg-red-100"
                  >
                    <Star className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {filteredReviews.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No se encontraron reseñas
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}