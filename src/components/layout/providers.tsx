'use client';
import { useTheme } from 'next-themes';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { AuthProvider } from '@/lib/auth/auth-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ActiveThemeProvider>
  );
}