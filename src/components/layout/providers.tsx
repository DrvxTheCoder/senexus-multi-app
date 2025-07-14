'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { frFR } from '@clerk/localizations';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  // we need the resolvedTheme value to set the baseTheme for clerk based on the dark or light theme
  const { resolvedTheme } = useTheme();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  // console.log('ClerkProvider publishableKey:', publishableKey);

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <ClerkProvider
          appearance={{
            baseTheme: resolvedTheme === 'dark' ? dark : undefined
          }}
          publishableKey={
            publishableKey ||
            'pk_test_cG9zaXRpdmUtc2FpbGZpc2gtNC5jbGVyay5hY2NvdW50cy5kZXYk'
          }
        >
          {children}
        </ClerkProvider>
      </ActiveThemeProvider>
    </>
  );
}
