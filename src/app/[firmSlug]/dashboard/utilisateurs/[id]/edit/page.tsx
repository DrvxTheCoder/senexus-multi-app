'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Building2, X, User } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  created_at: string;
  updated_at: string;
  firm_id: string | null;
}

interface FormData {
  full_name: string;
  phone: string;
  position: string;
  department: string;
  role: string;
  hire_date: string;
  is_active: boolean;
  assigned_firms: string[];
}

interface Firm {
  id: string;
  name: string;
  logo: string | null;
  theme_color: string | null;
  type: string;
}

const USER_ROLES = [
  { value: 'user', label: 'Utilisateur', description: 'Accès limité aux fonctionnalités de base' },
  { value: 'manager', label: 'Manager', description: 'Gestion d\'équipe et accès étendu' },
  { value: 'audit', label: 'Auditeur', description: 'Accès en lecture à toutes les firmes' },
  { value: 'admin', label: 'Administrateur', description: 'Accès complet à la gestion' },
  { value: 'owner', label: 'PDG/Propriétaire', description: 'Contrôle total du groupe' }
];

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, profile } = useAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone: '',
    position: '',
    department: '',
    role: 'user',
    hire_date: '',
    is_active: true,
    assigned_firms: []
  });

  type UserRole = 'admin' | 'owner' | 'audit' | 'manager' | 'user' | undefined;

  // Check if user is admin
  const isAdmin = (profile?.role as UserRole) === 'admin' || (profile?.role as UserRole) === 'owner';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/utilisateurs');
      return;
    }
    loadUser();
    loadFirms();
  }, [userId, isAdmin]);

  const loadUser = async () => {
    try {
      const supabase = createClient();
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userData) {
        toast.error('Utilisateur introuvable');
        router.push('/dashboard/utilisateurs');
        return;
      }

      setUser(userData);
      
      // Get user's firm assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_firm_assignments')
        .select('firm_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      const assignedFirmIds = assignmentsData?.map(assignment => assignment.firm_id) || [];

      setFormData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        position: userData.position || '',
        department: userData.department || '',
        role: userData.role || 'user',
        hire_date: userData.hire_date || '',
        is_active: userData.is_active ?? true,
        assigned_firms: assignedFirmIds
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Erreur lors du chargement de l\'utilisateur');
      router.push('/dashboard/utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadFirms = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('firms')
        .select('id, name, logo, theme_color, type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFirms(data || []);
    } catch (error) {
      console.error('Error loading firms:', error);
      toast.error('Erreur lors du chargement des firmes');
    } finally {
      setLoadingFirms(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFirmToggle = (firmId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_firms: prev.assigned_firms.includes(firmId)
        ? prev.assigned_firms.filter(id => id !== firmId)
        : [...prev.assigned_firms, firmId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !isAdmin || !user) {
      toast.error('Non autorisé');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // Step 1: Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null,
          phone: formData.phone.trim() || null,
          position: formData.position.trim() || null,
          department: formData.department.trim() || null,
          role: formData.role,
          hire_date: formData.hire_date || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Step 2: Update firm assignments
      // First, deactivate all current assignments
      const { error: deactivateError } = await supabase
        .from('user_firm_assignments')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) throw deactivateError;

      // Then, create/reactivate assignments for selected firms
      if (formData.assigned_firms.length > 0) {
        // Check which assignments already exist
        const { data: existingAssignments, error: existingError } = await supabase
          .from('user_firm_assignments')
          .select('firm_id')
          .eq('user_id', userId)
          .in('firm_id', formData.assigned_firms);

        if (existingError) throw existingError;

        const existingFirmIds = existingAssignments?.map(a => a.firm_id) || [];
        const newFirmIds = formData.assigned_firms.filter(firmId => !existingFirmIds.includes(firmId));

        // Reactivate existing assignments
        if (existingFirmIds.length > 0) {
          const { error: reactivateError } = await supabase
            .from('user_firm_assignments')
            .update({ is_active: true })
            .eq('user_id', userId)
            .in('firm_id', existingFirmIds);

          if (reactivateError) throw reactivateError;
        }

        // Create new assignments
        if (newFirmIds.length > 0) {
          const newAssignments = newFirmIds.map(firmId => ({
            user_id: userId,
            firm_id: firmId,
            assigned_by: currentUser.id
          }));

          const { error: insertError } = await supabase
            .from('user_firm_assignments')
            .insert(newAssignments);

          if (insertError) throw insertError;
        }
      }

      toast.success('Utilisateur mis à jour avec succès');
      router.push('/dashboard/utilisateurs');
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Auto-assign all firms for super users
  useEffect(() => {
    if (['admin', 'owner', 'audit'].includes(formData.role)) {
      setFormData(prev => ({
        ...prev,
        assigned_firms: firms.map(firm => firm.id)
      }));
    }
  }, [formData.role, firms]);

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

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedRole = USER_ROLES.find(role => role.value === formData.role);
  const isSuperUser = ['admin', 'owner', 'audit'].includes(formData.role);

  return (
    <ScrollArea className="container h-[100vh] max-w-4xl mx-auto py-4 px-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <Button variant="outline" size="icon" asChild className="flex-shrink-0">
          <Link href="/dashboard/utilisateurs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Modifier l&apos;utilisateur</h1>
          <p className="text-muted-foreground text-sm sm:text-base truncate">
            Modifiez les informations de {user.full_name || user.email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Modifiez les informations de base de l&apos;utilisateur
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L&apos;email ne peut pas être modifié
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Prénom Nom"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Date d&apos;embauche</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations professionnelles</CardTitle>
            <CardDescription>
              Modifiez le rôle et les responsabilités de l&apos;utilisateur
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Directeur Marketing"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Marketing & Communication"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-sm text-muted-foreground">
                  {selectedRole.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                disabled={saving}
              />
              <Label htmlFor="is_active">Compte actif</Label>
            </div>
          </CardContent>
        </Card>

        {/* Firm Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Assignation aux firmes
            </CardTitle>
            <CardDescription>
              {isSuperUser 
                ? 'Les utilisateurs avec ce rôle ont automatiquement accès à toutes les firmes.'
                : 'Modifiez les firmes auxquelles cet utilisateur a accès.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {loadingFirms ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Chargement des firmes...</p>
              </div>
            ) : (
              <>
                {isSuperUser && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Accès automatique :</strong> Ce rôle donne accès à toutes les firmes du groupe, 
                      y compris celles créées dans le futur.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Label>Firmes sélectionnées ({formData.assigned_firms.length})</Label>
                    {!isSuperUser && (
                      <div className="flex flex-col xs:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('assigned_firms', firms.map(f => f.id))}
                          disabled={saving}
                          className="text-xs"
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('assigned_firms', [])}
                          disabled={saving}
                          className="text-xs"
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    )}
                  </div>

                  {firms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                      {firms.map((firm) => {
                        const isSelected = formData.assigned_firms.includes(firm.id);
                        return (
                          <div
                            key={firm.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            } ${isSuperUser ? 'opacity-75' : ''}`}
                            onClick={() => !isSuperUser && handleFirmToggle(firm.id)}
                          >
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
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
                                />
                              ) : (
                                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-sm sm:text-base">{firm.name}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {firm.type}
                              </Badge>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2" />
                      <p>Aucune firme disponible</p>
                    </div>
                  )}
                </div>

                {/* Selected firms summary */}
                {formData.assigned_firms.length > 0 && (
                  <div className="space-y-2">
                    <Label>Firmes sélectionnées</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.assigned_firms.map((firmId) => {
                        const firm = firms.find(f => f.id === firmId);
                        if (!firm) return null;
                        
                        return (
                          <Badge 
                            key={firmId} 
                            variant="secondary" 
                            className="flex items-center gap-1"
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
                            {firm.name}
                            {!isSuperUser && (
                              <X 
                                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleFirmToggle(firmId)}
                              />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Informations de création et dernière activité
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créé le</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Dernière mise à jour</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">ID Utilisateur</span>
              </div>
              <code className="text-xs text-muted-foreground break-all">{user.id}</code>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="order-1 sm:order-2">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </ScrollArea>
  );
}