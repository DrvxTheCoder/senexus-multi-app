'use client';

import { useState } from 'react';
import {
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  UserCheck,
  UserX,
  Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { IconCancel, IconCircleCheckFilled } from '@tabler/icons-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  firm_id: string | null;
  primary_firm?: {
    id: string;
    name: string;
    logo: string | null;
    theme_color: string | null;
  } | null;
  assigned_firms?: {
    id: string;
    name: string;
    logo: string | null;
    theme_color: string | null;
  }[];
}

interface UsersDataTableProps {
  data: User[];
  onView: (user: User) => void;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
}

type SortField = 'full_name' | 'email' | 'role' | 'created_at' | 'last_login_at';
type SortDirection = 'asc' | 'desc';

const ROLE_LABELS = {
  admin: 'Administrateur',
  owner: 'PDG/Propriétaire', 
  audit: 'Auditeur',
  manager: 'Manager',
  user: 'Utilisateur'
};

const ROLE_COLORS = {
  admin: 'destructive',
  owner: 'default',
  audit: 'secondary',
  manager: 'outline',
  user: 'outline'
} as const;

export function UsersDataTable({ data, onView, onEdit, onDelete }: UsersDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: string | number | null;
    let bValue: string | number | null;

    switch (sortField) {
      case 'full_name':
        aValue = a.full_name?.toLowerCase() || a.email.toLowerCase();
        bValue = b.full_name?.toLowerCase() || b.email.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role.toLowerCase();
        bValue = b.role.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'last_login_at':
        aValue = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
        bValue = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === null) return sortDirection === 'asc' ? -1 : 1;
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto font-medium hover:bg-transparent w-fit p-1 px-2"
    >
      <span className="flex items-center gap-2">
        {children}
        <ArrowUpDown className={cn(
          "h-4 w-4 transition-all",
          sortField === field ? "opacity-100" : "opacity-50"
        )} />
      </span>
    </Button>
  );

  // User initials helper
  const getUserInitials = (user: User) => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
        <p className="text-muted-foreground">
          Aucun utilisateur ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <SortButton field="full_name">Utilisateur</SortButton>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortButton field="email">Email</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="role">Rôle</SortButton>
            </TableHead>
            <TableHead className="hidden lg:table-cell">Firmes</TableHead>
            {/* <TableHead className="hidden lg:table-cell">
              <SortButton field="last_login_at">Dernière connexion</SortButton>
            </TableHead> */}
            <TableHead className="hidden xl:table-cell">
              <SortButton field="created_at">Créé le</SortButton>
            </TableHead>
            <TableHead className="w-12">Statut</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((user) => (
            <TableRow key={user.id} className="group">
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {user.full_name || user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.department && (
                      <span>{user.department}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground md:hidden">
                    {user.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm">{user.email}</div>
              </TableCell>
              <TableCell>
                <Badge variant={'outline'} className='text-[0.6rem]'>
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-1 max-w-[200px]">
                  {user.assigned_firms && user.assigned_firms.length > 0 ? (
                    <>
                      {user.assigned_firms.slice(0, 4).map((firm, index) => (
                        <div
                          key={firm.id}
                          className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                          title={firm.name}
                        >
                          {firm.logo ? (
                            <img 
                              src={firm.logo} 
                              alt={firm.name}
                              className="w-3 h-3 rounded-sm object-contain"
                            />
                          ) : (
                            <Building2 className="w-3 h-3" />
                          )}
                          
                        </div>
                      ))}
                      {user.assigned_firms.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{user.assigned_firms.length - 4}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Aucune</span>
                  )}
                </div>
              </TableCell>
              {/* <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {user.last_login_at ? (
                  <div>
                    <div>{new Date(user.last_login_at).toLocaleDateString('fr-FR')}</div>
                    <div className="text-xs">{new Date(user.last_login_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ) : (
                  'Jamais'
                )}
              </TableCell> */}
              <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell>
                {user.is_active ? (
                  <Badge variant={'outline'} className="flex items-center gap-1 text-xs">
                    <IconCircleCheckFilled className="h-2 w-2 text-green-600" />
                    <small className="text-xs text-green-600">Actif</small>
                  </Badge>
                ) : (
                  <Badge variant={'outline'} className="flex items-center gap-1 text-xs">
                    <IconCancel className="h-2 w-2 text-red-600" />
                    <span className="text-xs text-red-600">Inactif</span>
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(user)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    {onEdit && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(user.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Désactiver
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}