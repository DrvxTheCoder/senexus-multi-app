'use client';

import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
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
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { useThemeConfig } from '@/components/active-theme';

const ORGS = [
  { id: 'senexus', name: 'Senexus Group', theme: 'default' },
  { id: 'connectinterim', name: "Connect'Interim", theme: 'amber' },
  { id: 'synergiepro', name: 'SynergiePro', theme: 'blue' },
  { id: 'ipm-tawfeikh', name: 'IPM Tawfeikh', theme: 'green' }
];

export function OrgSwitcher({
  onTenantSwitch
}: {
  onTenantSwitch?: (tenantId: string) => void;
}) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [selectedTenant, setSelectedTenant] = React.useState(ORGS[0]);

  const handleTenantSwitch = (tenant: typeof ORGS[0]) => {
    setSelectedTenant(tenant);
    setActiveTheme(tenant.theme);
    if (onTenantSwitch) {
      onTenantSwitch(tenant.id);
    }
  };

  if (!selectedTenant) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <GalleryVerticalEnd className='size-4' />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold'>{selectedTenant.name}</span>

              </div>
              <ChevronsUpDown className='ml-auto' />
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
                {tenant.name}{' '}
                {tenant.id === selectedTenant.id && (
                  <Check className='ml-auto' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
