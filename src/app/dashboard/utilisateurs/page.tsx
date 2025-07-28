'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  UserCheck,
  UserX,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UsersDataTable } from '@/components/users/users-data-table';

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

const ITEMS_PER_PAGE = 12;
const USER_ROLES = ['admin', 'owner', 'audit', 'manager', 'user'];
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

export default function UsersPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Extend the type of profile.role to include all roles
  type UserRole = 'admin' | 'owner' | 'audit' | 'manager' | 'user' | undefined;
  const profileRole = profile?.role as UserRole;
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  });

  // Load users with their firm assignments
  const loadUsers = async () => {
    try {
      const currentPath = window.location.pathname;
      
      const supabase = createClient();
      
      // Get users with their primary firm info
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          primary_firm:firm_id(id, name, logo, theme_color)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get firm assignments for each user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_firm_assignments_view')
        .select('*')
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Combine the data
      const enrichedUsers = (usersData || []).map(user => {
        const userAssignments = assignmentsData?.filter(assignment => 
          assignment.user_id === user.id
        ) || [];

        return {
          ...user,
          assigned_firms: userAssignments.map(assignment => ({
            id: assignment.firm_id,
            name: assignment.firm_name,
            logo: assignment.firm_logo,
            theme_color: assignment.firm_theme_color
          }))
        };
      });

      setUsers(enrichedUsers);
      
      // Ensure we stay on the current page after data load
      if (window.location.pathname !== currentPath) {
        router.replace(currentPath);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle view user
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  // Handle delete/deactivate
  const handleDelete = async (userId: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Utilisateur désactivé avec succès');
      loadUsers(); // Reload list
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Erreur lors de la désactivation');
    }
    setDeleteDialog({ open: false, userId: null });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
  const isAdmin = profileRole === 'admin' || profileRole === 'owner';
    setStatusFilter('all');
  };

  const isAdmin = (profile?.role as UserRole) === 'admin' || (profile?.role as UserRole) === 'owner';
  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';

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

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez tous les utilisateurs du groupe ({users.length} utilisateur{users.length > 1 ? 's' : ''})
          </p>
        </div>
        
        {isAdmin && (
          <Button asChild variant={'outline'}>
            <Link href="/dashboard/utilisateurs/nouveau">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Link>
          </Button>
        )}
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {USER_ROLES.map(role => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="px-3"
          >
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        )}

        {/* View Mode Toggle */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grille</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results count */}
      {filteredUsers.length !== users.length && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''} sur {users.length}
          </p>
        </div>
      )}

      {/* Content */}
      <Tabs value={viewMode} className="space-y-6">
        {/* Grid View */}
        <TabsContent value="grid" className="space-y-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre premier utilisateur'
                }
              </p>
              {isAdmin && !hasActiveFilters && (
                <Button asChild>
                  <Link href="/dashboard/utilisateurs/nouveau">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un utilisateur
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedUsers.map((user) => (
                  <Card key={user.id} className="group hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">
                              {user.full_name || user.email}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || 'outline'} 
                                className="text-xs"
                              >
                                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                              </Badge>
                              {user.is_active ? (
                                <UserCheck className="h-3 w-3 text-green-600" />
                              ) : (
                                <UserX className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/utilisateurs/${user.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Désactiver
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        {user.position && (
                          <p className="text-sm font-medium truncate">
                            {user.position}
                          </p>
                        )}
                        {user.department && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.department}
                          </p>
                        )}
                      </div>
                      
                      {/* Assigned Firms */}
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Firmes assignées:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.assigned_firms && user.assigned_firms.length > 0 ? (
                            user.assigned_firms.slice(0, 3).map((firm) => (
                              <div
                                key={firm.id}
                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
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
                                <span className="truncate max-w-[60px]">{firm.name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucune</span>
                          )}
                          {user.assigned_firms && user.assigned_firms.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{user.assigned_firms.length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                        <span>
                          Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex items-center gap-1">
                          {user.last_login_at ? (
                            <span>Vu le {new Date(user.last_login_at).toLocaleDateString('fr-FR')}</span>
                          ) : (
                            <span>Jamais connecté</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-6">
          <UsersDataTable 
            data={filteredUsers} 
            onView={handleViewUser}
            onEdit={isAdmin ? (userId) => router.push(`/dashboard/utilisateurs/${userId}/edit`) : undefined}
            onDelete={isAdmin ? (userId) => setDeleteDialog({ open: true, userId }) : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
                  </Avatar>
                  {selectedUser.full_name || selectedUser.email}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                  <Badge variant={ROLE_COLORS[selectedUser.role as keyof typeof ROLE_COLORS] || 'outline'}>
                    {ROLE_LABELS[selectedUser.role as keyof typeof ROLE_LABELS] || selectedUser.role}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <p className="text-sm">{selectedUser.phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <div className="flex items-center gap-2">
                    {selectedUser.is_active ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Actif</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Inactif</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Poste</label>
                  <p className="text-sm">{selectedUser.position || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Département</label>
                  <p className="text-sm">{selectedUser.department || 'Non renseigné'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Date d'embauche</label>
                <p className="text-sm">
                  {selectedUser.hire_date 
                    ? new Date(selectedUser.hire_date).toLocaleDateString('fr-FR')
                    : 'Non renseignée'
                  }
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Firmes assignées</label>
                <div className="mt-2">
                  {selectedUser.assigned_firms && selectedUser.assigned_firms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedUser.assigned_firms.map((firm) => (
                        <div
                          key={firm.id}
                          className="flex items-center gap-2 p-2 border rounded-lg"
                        >
                          {firm.logo ? (
                            <img 
                              src={firm.logo} 
                              alt={firm.name}
                              className="w-6 h-6 rounded object-contain"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">{firm.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune firme assignée</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                  <p className="text-sm">
                    {selectedUser.last_login_at 
                      ? new Date(selectedUser.last_login_at).toLocaleDateString('fr-FR')
                      : 'Jamais connecté'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, userId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va désactiver l'utilisateur. Il ne pourra plus se connecter mais ses données seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog.userId && handleDelete(deleteDialog.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}