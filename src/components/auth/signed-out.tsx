// src/components/auth/signed-out.tsx
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

interface SignedOutProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SignedOut({ children, fallback = null }: SignedOutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  return !user ? <>{children}</> : <>{fallback}</>;
}