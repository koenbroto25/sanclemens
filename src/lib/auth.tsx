"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useSuperAdminContext } from '@/lib/super-admin-context';
import { createClient } from './supabase/client'; // Assuming Supabase client is available
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Define the shape of the auth context
interface AuthContextType {
  user: any | null; // Replace 'any' with your actual user type
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: any) => Promise<any>; // Replace 'any'
  signOut: () => Promise<void>;
  superAdminAuth: boolean; // Indicates if a super admin is logged in
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [superAdminAuth, setSuperAdminAuth] = useState(false); // Local state for super admin auth

  const supabase = createClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    // Initial check for super admin cookie
    const checkSuperAdminAuth = () => {
      const superAdminCookie = document.cookie.split('; ').find(row => row.startsWith('super_admin_auth='));
      if (superAdminCookie) {
        setSuperAdminAuth(superAdminCookie.split('=')[1] === 'true');
      } else {
        setSuperAdminAuth(false);
      }
    };

    // Check on mount and listen for changes (though cookie changes are harder to track directly in React)
    checkSuperAdminAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Mock sign-in for Super Admin
  const signIn = async (credentials: any) => {
    // In a real app, this would involve API call to verify credentials
    if (credentials.password === 'Klemens2026!') { // Use the actual super admin password
      // Simulate setting super_admin_auth cookie
      document.cookie = `super_admin_auth=true; path=/; max-age=${60 * 60}; SameSite=Lax`;
      setSuperAdminAuth(true);
      return { user: { id: 'super-admin-id', role: 'super_admin' }, session: {} }; // Mock user/session
    }
    // Fallback to regular Supabase sign-in for other users
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    // Clear super_admin_auth cookie
    document.cookie = `super_admin_auth=; path=/; max-age=0; SameSite=Lax`;
    setSuperAdminAuth(false);

    // Clear simulate_role cookie (if present)
    document.cookie = `simulate_role=; path=/; max-age=0; SameSite=Lax`;

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signOut, superAdminAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}