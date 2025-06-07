import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { Product } from '../types/index';
import { toast } from 'react-hot-toast';

interface FavoriteItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  loading: boolean;
  isInitialized: boolean;
  
  // Actions
  loadFavorites: (userId: string) => Promise<void>;
  addToFavorites: (userId: string, product: Product) => Promise<void>;
  removeFromFavorites: (userId: string, productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  getFavoriteCount: () => number;
  clearFavorites: () => void;
  checkForDiscounts: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      loading: false,
      isInitialized: false,

      loadFavorites: async (userId: string) => {
        if (!userId) return;
        
        // Evitar múltiples llamadas simultáneas
        const state = get();
        if (state.loading || state.isInitialized) return;
        
        try {
          set({ loading: true });
          
          const { data, error } = await supabase
            .from('favorites')
            .select(`
              *,
              products (
                id,
                name,
                images,
                price,
                description,
                promotion,
                shipping_days,
                stock,
                category
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          // Si la tabla no existe, simplemente inicializar vacío SIN mostrar error
          if (error && (error.code === '42P01' || error.message?.includes('relation "favorites" does not exist'))) {
            set({ 
              favorites: [],
              loading: false,
              isInitialized: true 
            });
            return;
          }

          if (error) throw error;

          const favoritesWithProducts = data?.map(fav => ({
            ...fav,
            product: fav.products
          })) || [];

          set({ 
            favorites: favoritesWithProducts,
            loading: false,
            isInitialized: true 
          });
        } catch (error) {
          console.error('Favoritos system not ready yet:', error);
          set({ 
            favorites: [],
            loading: false, 
            isInitialized: true 
          });
          // NO mostrar toast de error para evitar spam en pantalla
        }
      },

      addToFavorites: async (userId: string, product: Product) => {
        if (!userId) {
          toast.error('Debes iniciar sesión para agregar favoritos');
          return;
        }

        try {
          // Check if already exists (manejo silencioso si tabla no existe)
          const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', product.id)
            .maybeSingle();

          if (existing) {
            toast.info('Este producto ya está en tus favoritos');
            return;
          }

          const { data, error } = await supabase
            .from('favorites')
            .insert({
              user_id: userId,
              product_id: product.id
            })
            .select()
            .single();

          if (error) throw error;

          const newFavorite = {
            ...data,
            product: product
          };

          set(state => ({
            favorites: [newFavorite, ...state.favorites]
          }));

          toast.success('Producto agregado a favoritos ❤️');
        } catch (error) {
          console.error('Favorites table not ready:', error);
          // Si la tabla no existe, agregar a favoritos localmente por ahora
          if (error.code === '42P01' || error.message?.includes('relation "favorites" does not exist')) {
            toast.info('Favoritos no disponible temporalmente');
          } else {
            toast.error('Error al agregar a favoritos');
          }
        }
      },

      removeFromFavorites: async (userId: string, productId: string) => {
        try {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

          if (error) throw error;

          set(state => ({
            favorites: state.favorites.filter(fav => fav.product_id !== productId)
          }));

          toast.success('Producto eliminado de favoritos');
        } catch (error) {
          console.error('Favorites table not ready:', error);
          // Manejo silencioso si la tabla no existe
          if (error.code === '42P01' || error.message?.includes('relation "favorites" does not exist')) {
            // Remover localmente sin mostrar error
            set(state => ({
              favorites: state.favorites.filter(fav => fav.product_id !== productId)
            }));
            toast.success('Producto eliminado de favoritos');
          } else {
            toast.error('Error al eliminar de favoritos');
          }
        }
      },

      isFavorite: (productId: string) => {
        const { favorites } = get();
        return favorites.some(fav => fav.product_id === productId);
      },

      getFavoriteCount: () => {
        const { favorites } = get();
        return favorites.length;
      },

      clearFavorites: () => {
        set({ favorites: [], isInitialized: false });
      },

      checkForDiscounts: () => {
        const { favorites, isInitialized } = get();
        
        // Solo verificar si hay favoritos inicializados
        if (!isInitialized || favorites.length === 0) return;
        
        const discountedFavorites = favorites.filter(fav => 
          fav.product?.promotion && fav.product.promotion.active
        );

        if (discountedFavorites.length > 0) {
          toast.success(
            `¡${discountedFavorites.length} de tus favoritos tiene${discountedFavorites.length > 1 ? 'n' : ''} descuento! 🎉`,
            { duration: 5000 }
          );
        }
      }
    }),
    {
      name: 'bamkz-favorites-store',
      partialize: (state) => ({
        favorites: state.favorites,
        isInitialized: state.isInitialized
      }),
    }
  )
);
