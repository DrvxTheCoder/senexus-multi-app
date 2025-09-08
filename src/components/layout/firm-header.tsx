// File: src/components/layout/firm-header.tsx
'use client';

import { useFirm } from '@/lib/contexts/firm-context';
import { Badge } from '@/components/ui/badge';
import { Building2, Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth/auth-provider';

export default function FirmHeader() {
  const { firmName, firmCodename, firmLogo, themeColor } = useFirm();
  const { user, profile } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 flex-1">
        {/* Firm Logo and Info */}
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
            {firmLogo ? (
              <img
                src={firmLogo}
                alt={`${firmName} logo`}
                className="w-full object-contain"
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
              className={`fallback-icon size-4 ${firmLogo ? 'hidden' : 'block'}`}
              style={{ color: themeColor || '#3b82f6' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold leading-tight">{firmName}</h1>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-mono"
                  style={{ 
                    backgroundColor: themeColor ? `${themeColor}20` : undefined,
                    color: themeColor || undefined,
                    borderColor: themeColor ? `${themeColor}40` : undefined
                  }}
                >
                  {firmCodename}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Nouveau utilisateur ajouté</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Rapport mensuel prêt</p>
                  <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-muted-foreground">
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem>
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}