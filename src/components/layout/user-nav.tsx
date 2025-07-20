// src/components/layout/user-nav.tsx
'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useAuth, useUser } from '@/lib/auth/auth-provider';
import { IconBell, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  if (!isSignedIn || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <UserAvatarProfile user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56 min-w-56 rounded-lg'
        side='bottom'
        align='end'
        sideOffset={4}
      >
        <DropdownMenuLabel className='p-0 font-normal'>
          <div className='px-1 py-1.5'>
            <UserAvatarProfile
              className='h-8 w-8 rounded-lg'
              showInfo
              user={user}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push('/dashboard/profile')}
          >
            <IconUserCircle className='mr-2 h-4 w-4' />
            Profil
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
  );
}