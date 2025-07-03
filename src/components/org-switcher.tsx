'use client';

import { Check, ChevronsUpDown } from 'lucide-react';

import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useThemeConfig } from '@/components/active-theme';

const ORGS = [
  { id: 'senexus', name: 'Senexus Group', theme: 'default', logo: '/assets/img/icons/senexus-icon.png' },
  { id: 'connectinterim', name: "Connect'Interim", theme: 'amber', logo: '/assets/img/icons/connectinterim-icon.png' },
  { id: 'synergiepro', name: 'SynergiePro', theme: 'blue', logo: '/assets/img/icons/synergie-icon.png' },
  { id: 'ipm-tawfeikh', name: 'IPM Tawfeikh', theme: 'green', logo: '/assets/img/icons/ipmtawfeikh-icon.png' }
];

type Tenant = { id: string; name: string };

interface OrgSwitcherProps {
  tenants: Tenant[];
  defaultTenant: Tenant;
  onTenantSwitch: (tenantId: string) => void;
}

export function OrgSwitcher({
  tenants,
  defaultTenant,
  onTenantSwitch
}: OrgSwitcherProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { state } = useSidebar();
  const [selectedTenant, setSelectedTenant] = React.useState(ORGS[0]);

  const handleTenantSwitch = (tenant: (typeof ORGS)[0]) => {
    setSelectedTenant(tenant);
    setActiveTheme(tenant.theme);
    if (onTenantSwitch) {
      onTenantSwitch(tenant.id);
    }
  };

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
              <div className='p-0 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden'>
                <img
                  src={selectedTenant.logo}
                  alt={selectedTenant.name + ' logo'}
                  className='object-contain w-full'
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
            {ORGS.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onSelect={() => handleTenantSwitch(tenant)}
              >
                <div className='flex items-center gap-2'>
                  <div className='flex aspect-square size-4 items-center justify-center rounded overflow-hidden'>
                    <img
                      src={tenant.logo}
                      alt={tenant.name + ' logo'}
                      className='object-contain w-full'
                    />
                  </div>
                  {tenant.name}
                  {tenant.id === selectedTenant.id && (
                    <Check className='ml-auto' />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}