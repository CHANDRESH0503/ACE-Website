"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { Loader } from '@/components/ui/loader';

interface AuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
  /** True when the signed-in user is flagged in userAdmins. UI hint only; pages re-check on the server. */
  isAdmin: boolean;
  /** Signs in with Google and returns to `next` (default: the current page). */
  login: (next?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  useEffect(() => {
    let isMounted = true;   
    const getInitialSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
          if (isMounted) {
          if (error) {
            // This is expected for anonymous users or expired sessions
            console.warn("AuthContext: No authenticated user found:", error.message);
          }
          setUser(user ?? null);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("AuthContext: Failed to get initial user:", error);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (active) setIsAdmin(!error && data === true);
    });
    return () => {
      active = false;
    };
  }, [supabase, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (next?: string) => {
    setLoading(true);
    const back = next ?? `${window.location.pathname}${window.location.search}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(back)}`,
      },
    });
    if (error) {
      console.error("AuthContext: Login error:", error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthContext: Logout error:", error.message);
      setLoading(false); 
    }
    setUser(null);
    setLoading(false);
  };
  return (
    <AuthContext.Provider value={{ supabase, user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
