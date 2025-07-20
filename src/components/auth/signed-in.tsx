// src/components/auth/signed-in.tsx
'use client';
import { useAuth } from '@/lib/auth/auth-provider';

interface SignedInProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SignedIn({ children, fallback = null }: SignedInProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  return user ? <>{children}</> : <>{fallback}</>;
}