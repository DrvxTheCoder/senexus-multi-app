// File: src/lib/contexts/firm-context.tsx
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useThemeConfig } from '@/components/active-theme';

interface Firm {
  id: string;
  slug: string;
  codename: string;
  name: string;
  type: string | null;
  description: string | null;
  logo: string | null;
  theme_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  senexus_group_id: string;
}

interface FirmContextType {
  firm: Firm;
  firmSlug: string;
  firmCodename: string;
  firmName: string;
  firmLogo: string | null;
  themeColor: string | null;
}

const FirmContext = createContext<FirmContextType | undefined>(undefined);

interface FirmProviderProps {
  children: React.ReactNode;
  firm: Firm;
}

// Map theme colors to theme names for the theme system
const getThemeFromColor = (color: string | null): string => {
  const colorMap: Record<string, string> = {
    '#000000': 'default',
    '#f59e0b': 'amber',
    '#3b82f6': 'blue',
    '#10b981': 'green',
    '#ef4444': 'red',
    '#8b5cf6': 'violet',
    '#ec4899': 'pink',
    '#f97316': 'orange'
  };
  return colorMap[color || ''] || 'default';
};

export function FirmProvider({ children, firm }: FirmProviderProps) {
  const { setActiveTheme } = useThemeConfig();

  // Apply firm theme when context loads
  useEffect(() => {
    if (firm.theme_color) {
      const theme = getThemeFromColor(firm.theme_color);
      setActiveTheme(theme);
    }
  }, [firm.theme_color, setActiveTheme]);

  const value: FirmContextType = {
    firm,
    firmSlug: firm.slug,
    firmCodename: firm.codename,
    firmName: firm.name,
    firmLogo: firm.logo,
    themeColor: firm.theme_color,
  };

  return (
    <FirmContext.Provider value={value}>
      {children}
    </FirmContext.Provider>
  );
}

// Hook to use firm context
export const useFirm = () => {
  const context = useContext(FirmContext);
  if (context === undefined) {
    throw new Error('useFirm must be used within a FirmProvider');
  }
  return context;
};

// Hook to get firm-specific URLs
export const useFirmUrls = () => {
  const { firmSlug } = useFirm();

  return {
    dashboard: `/${firmSlug}/dashboard`,
    overview: `/${firmSlug}/dashboard/overview`,
    users: `/${firmSlug}/dashboard/utilisateurs`,
    settings: `/${firmSlug}/dashboard/settings`,
    hr: `/${firmSlug}/dashboard/hr`,
    finance: `/${firmSlug}/dashboard/finance`,
    // More to be added
    buildUrl: (path: string) => `/${firmSlug}${path.startsWith('/') ? path : '/' + path}`,
  };
};

// Hook to get firm codename for display
export const useFirmCodename = () => {
  const { firmCodename } = useFirm();
  return firmCodename;
};