'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Building2, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Grid3X3,
  List,
  X
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { deleteFirm } from '@/actions/firm-actions';
import { FirmsDataTable } from '@/components/firms-datatable';
import { TextShimmer } from 'components/motion-primitives/text-shimmer';

interface Firm {
  id: string;
  name: string;
  type: string;
  description: string | null;
  logo: string | null;
  theme_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  senexus_group_id: string;
}

const ITEMS_PER_PAGE = 12;

export default function FirmsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  // State
  const [firms, setFirms] = useState<Firm[]>([]);
  const [filteredFirms, setFilteredFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; firmId: string | null }>({
    open: false,
    firmId: null
  });

  // Load firms with navigation state management
  const loadFirms = async () => {
    try {
      // Prevent auth provider redirects during data loading
      const currentPath = window.location.pathname;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFirms(data || []);
      
      // Ensure we stay on the current page after data load
      if (window.location.pathname !== currentPath) {
        router.replace(currentPath);
      }
    } catch (error) {
      console.error('Error loading firms:', error);
      toast.error('Erreur lors du chargement des firmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirms();
  }, []);

  // Filter firms
  useEffect(() => {
    let filtered = firms;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(firm => 
        firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firm.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firm.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(firm => firm.type === typeFilter);
    }

    setFilteredFirms(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [firms, searchQuery, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredFirms.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFirms = filteredFirms.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Get unique firm types for filter
  const firmTypes = Array.from(new Set(firms.map(firm => firm.type)));

  // Handle view firm
  const handleViewFirm = (firm: Firm) => {
    setSelectedFirm(firm);
    setViewDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (firmId: string) => {
    try {
      setLoading(true);
      const result = await deleteFirm(firmId);
      if (result.success) {
        toast.success('Firme supprimée avec succès');
        loadFirms(); // Reload list
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
    setDeleteDialog({ open: false, firmId: null });
    setLoading(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
  };

  const isAdmin = profile?.role === 'admin';
  const hasActiveFilters = searchQuery || typeFilter !== 'all';

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
    <div className="container max-w-7xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Firmes</h1>
          <p className="text-muted-foreground hidden md:block">
            Gérez toutes les firmes du groupe ({firms.length} firme{firms.length > 1 ? 's' : ''})
          </p>
        </div>
        
        {isAdmin && (
          <Button asChild variant={'outline'}>
            <Link href="/dashboard/firmes/nouveau">
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
            placeholder="Rechercher une firme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type de société" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {firmTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
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
      {filteredFirms.length !== firms.length && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredFirms.length} résultat{filteredFirms.length > 1 ? 's' : ''} sur {firms.length}
          </p>
        </div>
      )}

      {/* Content */}
      <Tabs value={viewMode} className="space-y-6">
        {/* Grid View */}
        <TabsContent value="grid" className="space-y-6">
          {filteredFirms.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? 'Aucune firme trouvée' : 'Aucune firme'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par créer votre première firme'
                }
              </p>
              {isAdmin && !hasActiveFilters && (
                <Button asChild>
                  <Link href="/dashboard/firmes/nouveau">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une firme
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedFirms.map((firm) => (
                  <Card key={firm.id} className="group hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                            style={{ 
                              backgroundColor: firm.theme_color ? `${firm.theme_color}20` : '#f1f5f9',
                              color: firm.theme_color || '#64748b'
                            }}
                          >
                            {firm.logo ? (
                              <img 
                                src={firm.logo} 
                                alt={`${firm.name} logo`}
                                className="w-full h-full object-contain"
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
                            <Building2 className={`fallback-icon h-5 w-5 ${firm.logo ? 'hidden' : 'block'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{firm.name}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {firm.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewFirm(firm)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/firmes/${firm.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, firmId: firm.id })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-3">
                        {firm.description || 'Aucune description disponible'}
                      </CardDescription>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Créée le {new Date(firm.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: firm.theme_color || '#64748b' }}
                        />
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
          <FirmsDataTable 
            data={filteredFirms} 
            onView={handleViewFirm}
            onEdit={isAdmin ? (firmId) => router.push(`/dashboard/firmes/${firmId}/edit`) : undefined}
            onDelete={isAdmin ? (firmId) => setDeleteDialog({ open: true, firmId }) : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* View Firm Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFirm && (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ 
                      backgroundColor: selectedFirm.theme_color ? `${selectedFirm.theme_color}20` : '#f1f5f9',
                      color: selectedFirm.theme_color || '#64748b'
                    }}
                  >
                    {selectedFirm.logo ? (
                      <img 
                        src={selectedFirm.logo} 
                        alt={`${selectedFirm.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  {selectedFirm.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails de la firme
            </DialogDescription>
          </DialogHeader>
          
          {selectedFirm && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">{selectedFirm.type}</p>
                </div>
                <div className='flex flex-col gap-1'>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <Badge variant="outline" className="text-xs">
                    {selectedFirm.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{selectedFirm.description || 'Aucune description disponible'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Créée le</label>
                  <p className="text-sm">{new Date(selectedFirm.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mise à jour le</label>
                  <p className="text-sm">{new Date(selectedFirm.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              {/* <div>
                <label className="text-sm font-medium text-muted-foreground">Couleur de thème</label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: selectedFirm.theme_color || '#64748b' }}
                  />
                  <span className="text-sm">{selectedFirm.theme_color || '#64748b'}</span>
                </div>
              </div> */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, firmId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La firme sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog.firmId && handleDelete(deleteDialog.firmId)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={!deleteDialog.firmId || loading}
            >

              {loading ? (
                <TextShimmer className='font-mono text-xs' duration={1}>
                   Suppression...
                </TextShimmer>) : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}