'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Check, Upload } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createFirmWithModules } from '@/actions/firm-actions';
import { MODULE_CATEGORIES } from '@/types/modules';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormData {
  name: string;
  type: string;
  description: string;
  logo: string;
  theme_color: string;
  selectedModules: string[];
}

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
  { name: 'Noir', value: '#000000', theme: 'default' },
  { name: 'Amber', value: '#f59e0b', theme: 'amber' },
  { name: 'Bleu', value: '#3b82f6', theme: 'blue' },
  { name: 'Vert', value: '#10b981', theme: 'green' },
  { name: 'Rouge', value: '#ef4444', theme: 'red' },
  { name: 'Violet', value: '#8b5cf6', theme: 'violet' },
  { name: 'Rose', value: '#ec4899', theme: 'pink' },
  { name: 'Orange', value: '#f97316', theme: 'orange' }
];

export default function NewFirmPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    description: '',
    logo: '',
    theme_color: '#3b82f6',
    selectedModules: []
  });

  // Load modules on component mount
  const loadModules = useCallback(async () => {
    setLoadingModules(true);
    try {
      const supabase = createClient();
      const { data: modules, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Loaded modules:', modules);
      setAvailableModules(modules || []);
      
      // Auto-select core modules
      const coreModuleIds = (modules || [])
        .filter(m => m.is_core)
        .map(m => m.id);
      
      console.log('Core module IDs:', coreModuleIds);
      
      setFormData(prev => ({
        ...prev, 
        selectedModules: Array.from(new Set([...prev.selectedModules, ...coreModuleIds]))
      }));
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Erreur lors du chargement des modules');
    } finally {
      setLoadingModules(false);
    }
  }, []);

  // Load modules when we reach step 2
  useEffect(() => {
    if (currentStep === 2 && availableModules.length === 0) {
      loadModules();
    }
  }, [currentStep, availableModules.length, loadModules]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour créer une firme');
      return;
    }

    if (currentStep === 1) {
      // Validate step 1 and move to step 2
      if (!formData.name.trim() || !formData.type) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Step 2 - Create firm with modules
    startTransition(async () => {
      try {
        console.log('Creating firm with modules:', formData.selectedModules);
        
        const result = await createFirmWithModules({
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description.trim() || null,
          logo: formData.logo.trim() || null,
          theme_color: formData.theme_color,
          selectedModules: formData.selectedModules
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success('Firme créée avec succès!');
        router.push('/dashboard');

      } catch (error) {
        console.error('Erreur lors de la création de la firme:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`Erreur: ${errorMessage}`);
      }
    });
  }, [formData, user, router, currentStep]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleModuleToggle = useCallback((moduleId: string, checked: boolean) => {
    const moduleData = availableModules.find(m => m.id === moduleId);
    if (!moduleData) return;

    // Prevent disabling core modules
    if (moduleData.is_core && !checked) {
      toast.warning('Les modules système ne peuvent pas être désactivés');
      return;
    }

    setFormData(prev => {
      let newSelectedModules: string[];
      
      if (checked) {
        // Add the module
        newSelectedModules = [...prev.selectedModules, moduleId];
        
        // Auto-select dependencies
        if (moduleData.requires_modules) {
          const dependencyIds = availableModules
            .filter(m => moduleData.requires_modules?.includes(m.slug))
            .map(m => m.id);
          
          newSelectedModules = Array.from(new Set([...newSelectedModules, ...dependencyIds]));
        }
      } else {
        // Remove the module
        newSelectedModules = prev.selectedModules.filter(id => id !== moduleId);
      }

      return {
        ...prev,
        selectedModules: newSelectedModules
      };
    });
  }, [availableModules]);

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(1);
    }
  };

  // Group modules by category
  const modulesByCategory = availableModules.reduce((acc, moduleData) => {
    const category = moduleData.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(moduleData);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {currentStep === 1 ? 'Créer une nouvelle firme' : 'Configurer les modules'}
          </h1>
          <p className="text-muted-foreground">
            {currentStep === 1 
              ? 'Renseignez les informations de base de votre nouvelle firme.'
              : 'Sélectionnez les modules que vous souhaitez activer pour cette firme.'
            }
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="text-sm font-medium">Informations</span>
        </div>
        
        <div className={`h-px flex-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="text-sm font-medium">Modules</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {currentStep === 1 ? (
          // Step 1: Basic Information
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Renseignez les détails de votre nouvelle firme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la firme *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="ex: Ma Nouvelle Entreprise"
                    required
                    disabled={isPending}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de société *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brève description de l'activité de la firme..."
                  rows={3}
                  disabled={isPending}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    placeholder="/assets/img/icons/mon-logo.png"
                    disabled={isPending}
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
                      className={`relative h-12 rounded-md border-2 transition-all ${
                        formData.theme_color === color.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleInputChange('theme_color', color.value)}
                      disabled={isPending}
                    >
                      {formData.theme_color === color.value && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Step 2: Module Selection
          <Card>
            <CardHeader>
              <CardTitle>Sélection des modules</CardTitle>
              <CardDescription>
                Choisissez les modules que vous souhaitez activer pour cette firme
              </CardDescription>
              <div className="text-sm text-muted-foreground">
                Modules sélectionnés: {formData.selectedModules.length}
              </div>
            </CardHeader>
            <CardContent>
            <ScrollArea className='h-[60vh]'>
            {loadingModules ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Chargement des modules...</p>
                  </div>
                </div>
              ) : availableModules.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Aucun module disponible</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={loadModules}
                      disabled={loadingModules}
                    >
                      Recharger
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 px-4">
                  {Object.entries(modulesByCategory).map(([category, modules]) => (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {MODULE_CATEGORIES[category as keyof typeof MODULE_CATEGORIES]?.label || category}
                        </h3>
                        <Badge variant="outline">
                          {modules.length} module{modules.length > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {modules.map((moduleData) => (
                          <Card
                            key={moduleData.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              formData.selectedModules.includes(moduleData.id)
                                ? 'ring-2 ring-primary bg-primary/5'
                                : ''
                            }`}
                            onClick={() => 
                              handleModuleToggle(
                                moduleData.id, 
                                !formData.selectedModules.includes(moduleData.id)
                              )
                            }
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg"
                                    style={{ 
                                      backgroundColor: `${moduleData.color}20`, 
                                      color: moduleData.color 
                                    }}
                                  >
                                    <Building2 className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
                                      {moduleData.display_name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1 mt-1">
                                      {moduleData.is_core && (
                                        <Badge variant="secondary" className="text-xs">
                                          Système
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {moduleData.pricing_tier}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <Checkbox
                                  checked={formData.selectedModules.includes(moduleData.id)}
                                  disabled={moduleData.is_core}
                                />
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <CardDescription className="text-sm">
                                {moduleData.description}
                              </CardDescription>
                              {moduleData.requires_modules && moduleData.requires_modules.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Dépendances: {moduleData.requires_modules.join(', ')}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* {category !== Object.keys(modulesByCategory)[Object.keys(modulesByCategory).length - 1] && (
                        <Separator />
                      )} */}
                    </div>
                  ))}
                </div>
              )}
                </ScrollArea>

            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack}
            disabled={isPending}
          >
            {currentStep === 1 ? 'Annuler' : 'Retour'}
          </Button>
          
          <Button type="submit" disabled={isPending || loadingModules}>
            {isPending ? 'Création...' : currentStep === 1 ? 'Suivant' : 'Créer la firme'}
          </Button>
        </div>
      </form>
    </div>
  );
}