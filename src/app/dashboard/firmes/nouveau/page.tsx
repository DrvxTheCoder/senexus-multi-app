'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Check, Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createFirmWithModules } from '@/actions/firm-actions';
import { MODULE_CATEGORIES } from '@/types/modules';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Module {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_core: boolean;
  pricing_tier: string;
  requires_modules?: string[];
}

const FIRM_TYPES = [
  'Holding',
  'SARL',
  'SAS', 
  'SA',
  'EURL',
  'SNC',
  'SCI',
  'Association',
  'Autre'
];

const THEME_COLORS = [
  { name: 'Noir', value: '#000000' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' }
];

export default function NewFirmPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Basic form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [themeColor, setThemeColor] = useState('#3b82f6');
  
  // Module state
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [loadingModules, setLoadingModules] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load modules on mount
  useEffect(() => {
    async function loadModules() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        
        const moduleData = data || [];
        setModules(moduleData);
        
        // Auto-select core modules
        const coreModuleIds = new Set(
          moduleData.filter(m => m.is_core).map(m => m.id)
        );
        setSelectedModules(coreModuleIds);
        
      } catch (error) {
        console.error('Error loading modules:', error);
        toast.error('Erreur lors du chargement des modules');
      } finally {
        setLoadingModules(false);
      }
    }

    loadModules();
  }, []);

  // Handle module selection
  const toggleModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Prevent disabling core modules
    if (module.is_core && selectedModules.has(moduleId)) {
      toast.warning('Les modules système ne peuvent pas être désactivés');
      return;
    }

    const newSelected = new Set(selectedModules);
    
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
      
      // Auto-select dependencies
      if (module.requires_modules) {
        module.requires_modules.forEach(requiredSlug => {
          const requiredModule = modules.find(m => m.slug === requiredSlug);
          if (requiredModule) {
            newSelected.add(requiredModule.id);
          }
        });
      }
    }
    
    setSelectedModules(newSelected);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour créer une firme');
      return;
    }

    if (!name.trim() || !type) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedModules.size === 0) {
      toast.error('Veuillez sélectionner au moins un module');
      return;
    }

    setCreating(true);
    
    try {
      const result = await createFirmWithModules({
        name: name.trim(),
        type,
        description: description.trim() || null,
        logo: logo.trim() || null,
        theme_color: themeColor,
        selectedModules: Array.from(selectedModules)
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Firme créée avec succès!');
      router.push('/dashboard');

    } catch (error) {
      console.error('Error creating firm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    const category = module.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer une nouvelle firme</h1>
          <p className="text-muted-foreground">
            Configurez votre nouvelle firme et sélectionnez les modules souhaités
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Basic Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
                <CardDescription>
                  Renseignez les détails de votre nouvelle firme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la firme *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Ma Nouvelle Entreprise"
                    required
                    disabled={creating}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de société *</Label>
                  <Select value={type} onValueChange={setType} required disabled={creating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRM_TYPES.map((firmType) => (
                        <SelectItem key={firmType} value={firmType}>
                          {firmType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brève description de l'activité..."
                    rows={3}
                    disabled={creating}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="/assets/img/icons/mon-logo.png"
                      disabled={creating}
                    />
                    <Button type="button" variant="outline" size="icon" disabled>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur du thème</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`relative h-10 rounded-md border-2 transition-all ${
                          themeColor === color.value
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setThemeColor(color.value)}
                        disabled={creating}
                      >
                        {themeColor === color.value && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Module Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sélection des modules</CardTitle>
                <CardDescription>
                  Choisissez les modules à activer ({selectedModules.size} sélectionné{selectedModules.size > 1 ? 's' : ''})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-[44vh]'>
                <div className='space-y-6 px-4'>
                {loadingModules ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Chargement des modules...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {MODULE_CATEGORIES[category as keyof typeof MODULE_CATEGORIES]?.label || category}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {categoryModules.length}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {categoryModules.map((module) => {
                            const isSelected = selectedModules.has(module.id);
                            return (
                              <Card
                                key={module.id}
                                className={`cursor-pointer transition-all border-2 ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                } ${module.is_core ? 'opacity-75' : ''}`}
                                onClick={() => toggleModule(module.id)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                      <div
                                        className="w-8 h-8 rounded-md flex items-center justify-center"
                                        style={{
                                          backgroundColor: `${module.color}20`,
                                          color: module.color
                                        }}
                                      >
                                        <Building2 className="h-4 w-4" />
                                      </div>
                                    </div>
                                    
                                    <div className="flex-grow min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-sm truncate">
                                          {module.display_name}
                                        </h5>
                                        {module.is_core && (
                                          <Badge variant="secondary" className="text-xs">
                                            Système
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {module.pricing_tier}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {module.description}
                                      </p>
                                      {module.requires_modules && module.requires_modules.length > 0 && (
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                          Dépendances: {module.requires_modules.join(', ')}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex-shrink-0">
                                      <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-primary border-primary'
                                            : 'border-border'
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 text-primary-foreground" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={creating}
          >
            Annuler
          </Button>
          
          <Button 
            type="submit" 
            disabled={creating || loadingModules || selectedModules.size === 0}
            className="min-w-[120px] cursor-pointer"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Création...
              </>
            ) : (
              'Créer la firme'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}