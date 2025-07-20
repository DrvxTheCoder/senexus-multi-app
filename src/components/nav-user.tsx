// src/components/nav-user.tsx
'use client';

import {
  IconCircleCheck,
  IconBell,
  IconChevronsDown,
  IconLogout,
} from '@tabler/icons-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useAuth, useUser } from '@/lib/auth/auth-provider';
import { useRouter } from 'next/navigation';

export function NavUser() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const { isMobile } = useSidebar();
  const router = useRouter();

  if (!isSignedIn || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/sign-in');
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
        ?.split('@')[0]
        .slice(0, 2)
        .toUpperCase() || 'UN';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {user.full_name || user.email?.split('@')[0] || 'Utilisateur'}
                </span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
              <IconChevronsDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-56 min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                  <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {user.full_name || user.email?.split('@')[0] || 'Utilisateur'}
                  </span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <IconCircleCheck className='mr-2 h-4 w-4' />
                Compte
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconBell className='mr-2 h-4 w-4' />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <IconLogout className='mr-2 h-4 w-4' />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
