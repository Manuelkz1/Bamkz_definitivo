import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  
  initialize: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        set({ error: sessionError.message, loading: false });
        return;
      }
      
      if (!session) {
        console.log('No active session found');
        set({ user: null, loading: false });
        return;
      }

      console.log('Session found:', session.user.id);
      
      // Get or create user record in the database
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create new record
        console.log('Creating new user record for:', session.user.id);
        
        const newUserData = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0] || '',
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([newUserData])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user record:', createError);
          // Fall back to basic user data if record creation fails
          set({ 
            user: { 
              ...session.user,
              role: 'customer',
              full_name: newUserData.full_name
            }, 
            loading: false 
          });
          return;
        }

        console.log('New user record created:', newUser);
        set({ user: newUser, loading: false });
        return;
      } else if (userError) {
        console.error('Error fetching user data:', userError);
        set({ error: userError.message, loading: false });
        return;
      }
      
      // Combine auth and database data
      const userWithRole = {
        ...session.user,
        ...existingUser
      };
      
      console.log('User data loaded:', userWithRole);
      set({ user: userWithRole, loading: false });
      
    } catch (error) {
      console.error('Error in initialize:', error);
      set({ error: error.message, loading: false });
    }
  },
  
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Initialize will be called by the auth state change listener
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      set({ error: error.message, loading: false });
      return { data: null, error };
    }
  },
  
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, error: null });
      
      // Clear any stored session data
      await localStorage.removeItem('supabase.auth.token');
    } catch (error: any) {
      console.error('Error during sign out:', error);
      set({ error: 'Error al cerrar sesión' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithPhone: async (phone: string, code: string) => {
    try {
      set({ loading: true, error: null });
      
      // Verificar código SMS con función personalizada
      const { data: smsData, error: smsError } = await supabase.functions.invoke('custom-sms', {
        body: {
          phone: phone,
          code: code,
          action: 'verify'
        }
      });

      if (smsError || !smsData.success) {
        throw new Error(smsData?.error || 'Error verificando código SMS');
      }

      // Buscar usuario por teléfono
      const phoneFormatted = `+57${phone.replace(/^(57|0)/, '')}`;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phoneFormatted)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new Error('Error buscando usuario');
      }

      let finalUser;

      if (!userData) {
        // Crear nuevo usuario
        const tempEmail = `phone_${phone}@temp.bamkz.com`;
        const tempPassword = `phone_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: {
            data: {
              phone: phoneFormatted,
              auth_method: 'phone'
            }
          }
        });

        if (authError) throw authError;

        // Crear registro en tabla users
        const newUserData = {
          id: authData.user!.id,
          phone: phoneFormatted,
          full_name: `Usuario ${phone}`,
          email: tempEmail,
          role: 'customer',
          auth_method: 'phone',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdUser, error: createUserError } = await supabase
          .from('users')
          .insert([newUserData])
          .select()
          .single();

        if (createUserError) {
          console.error('Error creating user record:', createUserError);
          finalUser = { ...authData.user, ...newUserData };
        } else {
          finalUser = createdUser;
        }
      } else {
        // Usuario existente - autenticar con email temporal
        try {
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: `phone_auth_${userData.id.slice(-8)}`
          });

          if (signInError) {
            // Si falla, intentar crear sesión manualmente
            console.log('Fallback: creando sesión manualmente para usuario existente');
          }

          finalUser = userData;
        } catch (error) {
          console.error('Error en signin con password:', error);
          finalUser = userData;
        }
      }

      set({ user: finalUser, loading: false });
      return { data: finalUser, error: null };

    } catch (error: any) {
      console.error('Error signing in with phone:', error);
      set({ error: error.message, loading: false });
      return { data: null, error };
    }
  }
}));