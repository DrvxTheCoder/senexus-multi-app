'use client';

import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useThemeConfig } from '@/components/active-theme';
import { NewFirmDialog } from '@/components/new-firm-dialog';
import { TextShimmer } from 'components/motion-primitives/text-shimmer';
import { SpinnerCircular } from 'spinners-react';
import Link from 'next/link';

interface Firm {
  id: string;
  name: string;
  logo: string | null;
  theme_color: string | null;
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

// Cookie utilities
const SELECTED_FIRM_COOKIE = 'selectedFirmId';

const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + '=';
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

type Tenant = { id: string; name: string };

interface OrgSwitcherProps {
  tenants?: Tenant[];
  defaultTenant?: Tenant;
  onTenantSwitch?: (tenantId: string) => void;
}

export function OrgSwitcher({
  tenants,
  defaultTenant,
  onTenantSwitch
}: OrgSwitcherProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { state } = useSidebar();
  const [firms, setFirms] = React.useState<Firm[]>([]);
  const [selectedTenant, setSelectedTenant] = React.useState<Firm | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cookiesLoaded, setCookiesLoaded] = React.useState(false);
  const [initialLoadCompleted, setInitialLoadCompleted] = React.useState(false);

  // Add performance optimization
  const firmsCache = React.useRef<Firm[]>([]);
  const lastFetch = React.useRef<number>(0);
  const isFetching = React.useRef<boolean>(false);

  // Load saved firm ID from cookie on client-side only
  React.useEffect(() => {
    setCookiesLoaded(true);
  }, []);

  // Optimized fetch with caching and debouncing
// Replace the fetchFirms function in your org switcher with this:

const fetchFirms = React.useCallback(async (forceRefresh = false) => {
  // Prevent unnecessary fetches
  if (initialLoadCompleted && !forceRefresh) {
    return;
  }

  // Prevent concurrent fetches
  if (isFetching.current) {
    return;
  }

  // Use cache if recent (30 seconds)
  const now = Date.now();
  if (!forceRefresh && firmsCache.current.length > 0 && (now - lastFetch.current) < 30000) {
    setFirms(firmsCache.current);
    setLoading(false);
    return;
  }

  try {
    isFetching.current = true;
    setLoading(true);
    const supabase = createClient();

    // This query will now respect RLS and only return firms the user can access
    const { data, error } = await supabase
      .from('firms')
      .select('id, name, logo, theme_color')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching firms:', error);
      return;
    }

    const firmsData = data || [];
    
    // Debug: Log how many firms the user can see
    console.log(`User can access ${firmsData.length} firms:`, firmsData.map(f => f.name));
    
    // Update cache
    firmsCache.current = firmsData;
    lastFetch.current = now;
    setFirms(firmsData);

    // Set selected firm based on cookie or default to first firm
    if (cookiesLoaded && firmsData.length > 0) {
      const savedFirmId = getCookie(SELECTED_FIRM_COOKIE);
      let firmToSelect: Firm | null = null;

      if (savedFirmId) {
        firmToSelect = firmsData.find((firm) => firm.id === savedFirmId) || null;
      }

      if (!firmToSelect) {
        firmToSelect = firmsData[0];
      }

      if (firmToSelect && (!selectedTenant || selectedTenant.id !== firmToSelect.id)) {
        setSelectedTenant(firmToSelect);
        setActiveTheme(getThemeFromColor(firmToSelect.theme_color));
        setCookie(SELECTED_FIRM_COOKIE, firmToSelect.id);

        if (onTenantSwitch) {
          onTenantSwitch(firmToSelect.id);
        }
      }
    }

    if (!initialLoadCompleted) {
      setInitialLoadCompleted(true);
    }
  } catch (error) {
    console.error('Error fetching firms:', error);
  } finally {
    setLoading(false);
    isFetching.current = false;
  }
}, [cookiesLoaded, selectedTenant, setActiveTheme, onTenantSwitch, initialLoadCompleted]);

  // Load firms when cookies are loaded - only run once initially
  React.useEffect(() => {
    if (cookiesLoaded && !initialLoadCompleted && !isFetching.current) {
      fetchFirms();
    }
  }, [cookiesLoaded, initialLoadCompleted, fetchFirms]);

  const handleTenantSwitch = React.useCallback((firm: Firm) => {
    setSelectedTenant(firm);
    setActiveTheme(getThemeFromColor(firm.theme_color));
    setCookie(SELECTED_FIRM_COOKIE, firm.id);

    if (onTenantSwitch) {
      onTenantSwitch(firm.id);
    }
  }, [setActiveTheme, onTenantSwitch]);

  const handleFirmCreated = React.useCallback(() => {
    // Clear cache and force refresh
    firmsCache.current = [];
    lastFetch.current = 0;
    fetchFirms(true);
  }, [fetchFirms]);

  // Check current user in browser console
const supabase = createClient();
supabase.auth.getUser().then(({ data: { user } }) => {
  console.log('Current user ID:', user?.id);
  console.log('Expected manager ID: 844c7829-fd63-47a4-b62d-f39a1ba1dad2');
  console.log('Is this the manager?', user?.id === '844c7829-fd63-47a4-b62d-f39a1ba1dad2');
});

  // Rest of your component remains the same but with performance optimizations...
  // Show loading state
  if (loading || !cookiesLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size='lg'
            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
            disabled
          >
            <div className='bg-muted flex aspect-square size-8 items-center justify-center rounded-lg p-0'>
              <SpinnerCircular
                size={'1rem'}
                color='var(--accent-foreground)'
                secondaryColor='var(--secondary)'
                thickness={180}
              />
            </div>
            {state !== 'collapsed' && (
              <TextShimmer className='font-mono text-xs' duration={1}>
                Chargement...
              </TextShimmer>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Show empty state if no firms
  if (firms.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
              >
                <div className='bg-muted flex aspect-square size-8 items-center justify-center rounded-lg p-0'>
                  <Building2 className='size-4' />
                </div>
                {state !== 'collapsed' && (
                  <>
                    <div className='flex flex-col gap-0.5 leading-none'>
                      <span className='font-mono'>Aucune firme</span>
                    </div>
                    <ChevronsUpDown className='ml-auto' />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width]'
              align='start'
            >
              <Link href='/dashboard/firmes/nouveau'>
                <DropdownMenuItem>
                  <div className='flex items-center justify-center rounded-md border bg-transparent p-1'>
                    <Plus className='size-3' />
                  </div>
                  <div className='text-muted-foreground text-xs font-medium'>
                    Nouveau
                  </div>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!selectedTenant) {
    return null;
  }

  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
              tooltip={isCollapsed ? selectedTenant.name : undefined}
            >
              <div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg p-0'>
                {selectedTenant.logo ? (
                  <img
                    src={selectedTenant.logo}
                    alt={selectedTenant.name + ' logo'}
                    className='w-full object-contain'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-icon');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'block';
                        }
                      }
                    }}
                  />
                ) : null}
                <Building2
                  className={`fallback-icon size-4 ${selectedTenant.logo ? 'hidden' : 'block'}`}
                  style={{ color: selectedTenant.theme_color || '#3b82f6' }}
                />
              </div>
              {!isCollapsed && (
                <>
                  <div className='flex flex-col gap-0.5 leading-none'>
                    <span className='font-semibold'>{selectedTenant.name}</span>
                  </div>
                  <ChevronsUpDown className='ml-auto' />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width]'
            align='start'
          >
            {firms.map((firm) => (
              <DropdownMenuItem
                key={firm.id}
                onSelect={() => handleTenantSwitch(firm)}
              >
                <div className='flex items-center gap-2 text-xs'>
                  <div className='flex aspect-square size-4 items-center justify-center overflow-hidden rounded'>
                    {firm.logo ? (
                      <img
                        src={firm.logo}
                        alt={firm.name + ' logo'}
                        className='w-full object-contain'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-icon');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'block';
                            }
                          }
                        }}
                      />
                    ) : null}
                    <Building2
                      className={`fallback-icon size-3 ${firm.logo ? 'hidden' : 'block'}`}
                      style={{ color: firm.theme_color || '#3b82f6' }}
                    />
                  </div>
                  {firm.name}
                  {firm.id === selectedTenant.id && (
                    <Check className='ml-auto' />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
              <Link href='/dashboard/firmes/nouveau'>
                <DropdownMenuItem>
                  <div className='flex items-center justify-center rounded-md border bg-transparent p-1'>
                    <Plus className='size-3' />
                  </div>
                  <div className='text-muted-foreground text-xs font-medium'>
                    Nouveau
                  </div>
                </DropdownMenuItem>
              </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
