"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SuperAdminContextType {
  bypassMode: boolean;
  setBypassMode: (mode: boolean) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [bypassMode, setBypassModeState] = useState<boolean>(false);

  useEffect(() => {
    // Initialize bypassMode from cookie on mount
    const bypassCookie = document.cookie.split('; ').find(row => row.startsWith('super_admin_bypass_mode='));
    setBypassModeState(bypassCookie ? bypassCookie.split('=')[1] === 'true' : false);
  }, []);

  const setBypassMode = (mode: boolean) => {
    setBypassModeState(mode);
    // Set cookie that is accessible by client-side JS (httpOnly: false)
    document.cookie = `super_admin_bypass_mode=${mode}; path=/; max-age=${mode ? 15 * 60 : 0}; SameSite=Lax`;
  };

  return (
    <SuperAdminContext.Provider value={{ bypassMode, setBypassMode }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdminContext() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdminContext must be used within a SuperAdminProvider');
  }
  return context;
}