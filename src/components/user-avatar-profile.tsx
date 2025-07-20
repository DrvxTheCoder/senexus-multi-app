// src/components/user-avatar-profile.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: {
    avatar_url?: string | null;
    full_name?: string | null;
    email?: string;
  } | null;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user
}: UserAvatarProfileProps) {
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
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || ''} />
        <AvatarFallback className='rounded-lg'>
          {initials}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>
            {user?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
          </span>
          <span className='truncate text-xs'>
            {user?.email || ''}
          </span>
        </div>
      )}
    </div>
  );
}