// File: src/app/[firmSlug]/layout.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import { FirmProvider } from '@/lib/contexts/firm-context';
import type { Metadata } from 'next';

interface FirmLayoutProps {
  children: React.ReactNode;
  params: Promise<{ firmSlug: string }>;
}

// Fetch firm data server-side
async function getFirmBySlug(slug: string) {
  const supabase = createServerComponentClient();
  
  const { data: firm, error } = await supabase
    .from('firms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !firm) {
    return null;
  }

  return firm;
}

// Check if user has access to firm
async function checkUserFirmAccess(userId: string, firmId: string) {
  const supabase = createServerComponentClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', userId)
    .single();

  // Admin users can access all firms
  if (profile?.role === 'admin' || profile?.role === 'owner') {
    return true;
  }

  // Check if user is assigned to this firm
  const { data: assignment } = await supabase
    .from('user_firm_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .single();

  return !!assignment;
}

export async function generateMetadata({ params }: FirmLayoutProps): Promise<Metadata> {
  const { firmSlug } = await params;
  const firm = await getFirmBySlug(firmSlug);
  
  return {
    title: firm ? `${firm.name} - Tableau de bord` : 'Tableau de bord de la firme',
    description: firm?.description || 'Tableau de bord de gestion de la firme',
  };
}

export default async function FirmLayout({ children, params }: FirmLayoutProps) {
  const { firmSlug } = await params;
  
  // Get current user
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get firm data
  const firm = await getFirmBySlug(firmSlug);
  
  if (!firm) {
    redirect('/dashboard');
  }

  // Check if user has access to this firm
  const hasAccess = await checkUserFirmAccess(user.id, firm.id);
  
  if (!hasAccess) {
    redirect('/dashboard');
  }

  return (
    <FirmProvider firm={firm}>
      {children}
    </FirmProvider>
  );
}