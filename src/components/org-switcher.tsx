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
import { TextShimmer } from 'components/motion-primitives/text-shimmer';
import { SpinnerCircular } from 'spinners-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUserSession, isUserAdmin } from '@/lib/auth/session-cookies';
import { useAuth } from '@/lib/auth/auth-provider';
import { FirmSwitchDialog } from '@/components/firms/firm-switch-dialog';
import { FirmTransitionScreen } from '@/components/firms/firm-transition-screen';

interface Firm {
  id: string;
  slug: string;
  codename: string;
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

// Cookie utilities for selected firm
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

interface OrgSwitcherProps {
  currentFirmSlug?: string; // Current firm from URL params
  onTenantSwitch?: (tenantId: string) => void;
}

export function OrgSwitcher({
  currentFirmSlug,
  onTenantSwitch
}: OrgSwitcherProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { state } = useSidebar();
  const { userSession, user, refreshUserSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [firms, setFirms] = React.useState<Firm[]>([]);
  const [selectedTenant, setSelectedTenant] = React.useState<Firm | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cookiesLoaded, setCookiesLoaded] = React.useState(false);
  const [initialLoadCompleted, setInitialLoadCompleted] = React.useState(false);

  // Transition states
  const [showSwitchDialog, setShowSwitchDialog] = React.useState(false);
  const [showTransitionScreen, setShowTransitionScreen] = React.useState(false);
  const [targetFirm, setTargetFirm] = React.useState<Firm | null>(null);

  // Add performance optimization
  const firmsCache = React.useRef<Firm[]>([]);
  const lastFetch = React.useRef<number>(0);
  const isFetching = React.useRef<boolean>(false);

  // Load saved firm ID from cookie on client-side only
  React.useEffect(() => {
    setCookiesLoaded(true);
  }, []);

  // Optimized fetch with user session filtering
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

      // Get user session data from cookie or auth context
      const sessionData = userSession || getUserSession();
      
      if (!sessionData && user?.id) {
        // If no session data but user exists, refresh it
        console.log('No session data found, refreshing...');
        await refreshUserSession();
        return; // This will trigger a re-render with updated session data
      }

      let firmsData: Firm[] = [];
      
      if (sessionData && sessionData.assignedFirmIds.length > 0) {
        // User has session data - fetch only assigned firms
        console.log(`Fetching ${sessionData.assignedFirmIds.length} assigned firms for user`);
        
        const { data, error } = await supabase
          .from('firms')
          .select('id, slug, codename, name, logo, theme_color')
          .in('id', sessionData.assignedFirmIds)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching assigned firms:', error);
          return;
        }

        firmsData = data || [];
        console.log(`Successfully fetched ${firmsData.length} assigned firms:`, firmsData.map(f => f.name));
      } else if (isUserAdmin()) {
        // Admin users can see all firms
        console.log('Admin user - fetching all firms');
        
        const { data, error } = await supabase
          .from('firms')
          .select('id, slug, codename, name, logo, theme_color')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching all firms for admin:', error);
          return;
        }

        firmsData = data || [];
        console.log(`Admin can access ${firmsData.length} firms`);
      } else {
        // No session data and not admin - might be a new user or session expired
        console.log('No session data available and not admin - no firms to display');
        firmsData = [];
      }
    
      // Update cache
      firmsCache.current = firmsData;
      lastFetch.current = now;
      setFirms(firmsData);

      // Set selected firm based on current URL or cookie
      if (cookiesLoaded && firmsData.length > 0) {
        let firmToSelect: Firm | null = null;

        // First, try to match current URL firm slug
        if (currentFirmSlug) {
          firmToSelect = firmsData.find((firm) => firm.slug === currentFirmSlug) || null;
        }

        // If no URL match, try cookie
        if (!firmToSelect) {
          const savedFirmId = getCookie(SELECTED_FIRM_COOKIE);
          if (savedFirmId) {
            firmToSelect = firmsData.find((firm) => firm.id === savedFirmId) || null;
          }
        }

        // If still no match, default to primary firm or first firm
        if (!firmToSelect) {
          if (sessionData?.primaryFirmId) {
            firmToSelect = firmsData.find(f => f.id === sessionData.primaryFirmId) || firmsData[0];
          } else {
            firmToSelect = firmsData[0];
          }
        }

        if (firmToSelect) {
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
  }, [cookiesLoaded, currentFirmSlug, setActiveTheme, onTenantSwitch, initialLoadCompleted, userSession, user?.id, refreshUserSession]);

  // Load firms when cookies are loaded or user session changes
  React.useEffect(() => {
    if (cookiesLoaded && !initialLoadCompleted && !isFetching.current) {
      fetchFirms();
    }
  }, [cookiesLoaded, initialLoadCompleted, fetchFirms]);

  // Refetch when user session changes
  React.useEffect(() => {
    if (initialLoadCompleted && userSession && !isFetching.current) {
      console.log('User session updated, refreshing firms...');
      firmsCache.current = []; // Clear cache
      lastFetch.current = 0;
      fetchFirms(true);
    }
  }, [userSession, fetchFirms, initialLoadCompleted]);

  const handleFirmClick = React.useCallback((firm: Firm) => {
    // Check if user has access to this firm
    const sessionData = userSession || getUserSession();
    if (sessionData && !sessionData.assignedFirmIds.includes(firm.id) && !isUserAdmin()) {
      console.warn('User attempted to switch to unauthorized firm:', firm.id);
      return;
    }

    // If clicking the same firm, do nothing
    if (selectedTenant && firm.id === selectedTenant.id) {
      return;
    }

    // Set target firm and show confirmation dialog
    setTargetFirm(firm);
    setShowSwitchDialog(true);
  }, [userSession, selectedTenant]);

  const handleSwitchConfirm = React.useCallback(() => {
    if (!targetFirm) return;

    setShowSwitchDialog(false);
    setShowTransitionScreen(true);
  }, [targetFirm]);

  const handleSwitchCancel = React.useCallback(() => {
    setShowSwitchDialog(false);
    setTargetFirm(null);
  }, []);

  const handleTransitionComplete = React.useCallback(() => {
    if (!targetFirm) return;

    // Actually perform the switch
    setSelectedTenant(targetFirm);
    setActiveTheme(getThemeFromColor(targetFirm.theme_color));
    setCookie(SELECTED_FIRM_COOKIE, targetFirm.id);

    // Navigate to the firm's dashboard
    const currentPath = pathname;
    let newPath = `/${targetFirm.slug}/dashboard`;
    
    // Try to preserve the current page if it's a dashboard route
    if (currentPath.includes('/dashboard/')) {
      const pathParts = currentPath.split('/dashboard/');
      if (pathParts[1]) {
        newPath = `/${targetFirm.slug}/dashboard/${pathParts[1]}`;
      }
    } else if (currentPath === '/dashboard') {
      newPath = `/${targetFirm.slug}/dashboard/overview`;
    }

    console.log(`Switching to firm ${targetFirm.name} (${targetFirm.slug}), navigating to:`, newPath);
    
    // Hide transition screen and navigate
    setShowTransitionScreen(false);
    router.push(newPath);

    if (onTenantSwitch) {
      onTenantSwitch(targetFirm.id);
    }

    // Clear target firm
    setTargetFirm(null);
  }, [targetFirm, setActiveTheme, pathname, router, onTenantSwitch]);

  const handleFirmCreated = React.useCallback(() => {
    // Clear cache and force refresh
    firmsCache.current = [];
    lastFetch.current = 0;
    fetchFirms(true);
  }, [fetchFirms]);

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
    const sessionData = userSession || getUserSession();
    const isAdmin = isUserAdmin();
    
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
                      <span className='font-mono text-xs'>
                        {sessionData ? 'Aucune firme assignée' : 'Aucune firme'}
                      </span>
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
              {isAdmin && (
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
              )}
              {!sessionData && (
                <DropdownMenuItem disabled>
                  <div className='text-muted-foreground text-xs'>
                    Session expirée - reconnectez-vous
                  </div>
                </DropdownMenuItem>
              )}
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
  const isAdmin = isUserAdmin();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
                tooltip={isCollapsed ? `${selectedTenant.name}` : undefined}
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
                      <span className='text-xs text-muted-foreground font-mono'>
                        {selectedTenant.codename}
                      </span>
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
                  onSelect={() => handleFirmClick(firm)}
                  className={firm.id === selectedTenant.id ? 'bg-accent/50' : ''}
                >
                  <div className='flex items-center gap-2 text-xs w-full'>
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
                    <div className='flex flex-col flex-1 min-w-0'>
                      <span className='font-medium truncate'>{firm.name}</span>
                    </div>
                    {firm.id === selectedTenant.id && (
                      <Check className='ml-auto size-4' />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {isAdmin && (
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
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Confirmation Dialog */}
      <FirmSwitchDialog
        open={showSwitchDialog}
        onOpenChange={setShowSwitchDialog}
        currentFirm={selectedTenant}
        targetFirm={targetFirm}
        onConfirm={handleSwitchConfirm}
        onCancel={handleSwitchCancel}
      />

      {/* Transition Screen */}
      {targetFirm && (
        <FirmTransitionScreen
          show={showTransitionScreen}
          targetFirm={targetFirm}
          onComplete={handleTransitionComplete}
        />
      )}
    </>
  );
}