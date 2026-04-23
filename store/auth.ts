import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type Role = 'admin' | 'waiter' | 'kitchen' | 'desk' | 'display' | null;

interface AuthState {
  session: Session | null;
  role: Role;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  fetchRole: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  isLoading: true,
  setSession: async (session) => {
    set({ session });
    if (session?.user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      set({ role: data?.role || null, isLoading: false });
    } else {
      set({ role: null, isLoading: false });
    }
  },
  fetchRole: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    set({ role: data?.role || null });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, role: null });
  }
}));
