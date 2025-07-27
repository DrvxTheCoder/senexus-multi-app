'use client';

import { useState, useCallback, useTransition } from 'react';
import { Plus, Upload, Building2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { createFirmWithModules } from '@/actions/firm-actions';
import { MODULE_CATEGORIES } from '@/types/modules';

interface NewFirmDialogProps {
  onFirmCreated: () => void;
}

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

export function NewFirmDialog({ onFirmCreated }: NewFirmDialogProps) {
  const [open, setOpen] = useState(false);
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
    selectedModules: [] // Start empty, will be populated when modules load
  });

  // Load available modules when dialog opens
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

      console.log('Loaded modules:', modules); // Debug log
      setAvailableModules(modules || []);
      
      // Auto-select core modules
      const coreModuleIds = (modules || [])
        .filter(m => m.is_core)
        .map(m => m.id);
      
      console.log('Core module IDs:', coreModuleIds); // Debug log
      
      setFormData(prev => {
        const newSelectedModules = Array.from(new Set([...prev.selectedModules, ...coreModuleIds]));
        console.log('Updated selected modules:', newSelectedModules); // Debug log
        return {
          ...prev, 
          selectedModules: newSelectedModules
        };
      });
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Erreur lors du chargement des modules');
    } finally {
      setLoadingModules(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: '',
      description: '',
      logo: '',
      theme_color: '#3b82f6',
      selectedModules: []
    });
    setCurrentStep(1);
  }, []);

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
      
      // Load modules first, then move to step 2
      try {
        await loadModules();
        setCurrentStep(2);
      } catch (error) {
        console.error('Failed to load modules:', error);
        toast.error('Erreur lors du chargement des modules');
      }
      return;
    }

    // Step 2 - Create firm with modules
    startTransition(async () => {
      try {
        console.log('Creating firm with modules:', formData.selectedModules); // Debug log
        
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
        resetForm();
        setOpen(false);
        onFirmCreated();

      } catch (error) {
        console.error('Erreur lors de la création de la firme:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`Erreur: ${errorMessage}`);
      }
    });
  }, [formData, user, onFirmCreated, resetForm, currentStep, loadModules]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleModuleToggle = useCallback((moduleId: string, checked: boolean) => {
    const mod = availableModules.find(m => m.id === moduleId);
    if (!mod) return;

    // Prevent disabling core modules
    if (mod.is_core && !checked) {
      toast.warning('Les modules système ne peuvent pas être désactivés');
      return;
    }

    setFormData(prev => {
      let newSelectedModules: string[];
      
      if (checked) {
        // Add the module
        newSelectedModules = [...prev.selectedModules, moduleId];
        
        // Auto-select dependencies
        if (mod.requires_modules) {
          const dependencyIds = availableModules
            .filter(m => mod.requires_modules?.includes(m.slug))
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

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isPending) {
      return; // Prevent closing during submission
    }
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  }, [isPending, resetForm]);

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Group modules by category
  const modulesByCategory = availableModules.reduce((acc, mod) => {
    const category = mod.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(mod);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <div className='flex items-center justify-center rounded-md border bg-transparent p-1'>
            <Plus className='size-3' />
          </div>
          <div className='text-muted-foreground text-xs font-medium'>
            Nouveau
          </div>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent 
        className={currentStep === 2 ? 'sm:max-w-4xl max-h-[90vh]' : 'sm:max-w-[500px]'}
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1 ? 'Créer une nouvelle firme' : 'Configurer les modules'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? 'Renseignez les informations de base de votre nouvelle firme.'
              : 'Sélectionnez les modules que vous souhaitez activer pour cette firme.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {currentStep === 1 ? (
            // Step 1: Basic Information
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nom de la firme *</Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='ex: Ma Nouvelle Entreprise'
                    required
                    disabled={isPending}
                    maxLength={100}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='type'>Type de société *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner...' />
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

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brève description de l'activité de la firme..."
                  rows={3}
                  disabled={isPending}
                  maxLength={500}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='logo'>Logo (URL)</Label>
                <div className='flex gap-2'>
                  <Input
                    id='logo'
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    placeholder='/assets/img/icons/mon-logo.png'
                    disabled={isPending}
                  />
                  <Button type='button' variant='outline' size='icon' disabled>
                    <Upload className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Couleur du thème</Label>
                <div className='grid grid-cols-4 gap-2'>
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type='button'
                      className={`relative h-10 rounded-md border-2 transition-all ${
                        formData.theme_color === color.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleInputChange('theme_color', color.value)}
                      disabled={isPending}
                    >
                      {formData.theme_color === color.value && (
                        <Check className='absolute inset-0 m-auto h-4 w-4 text-white' />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Module Selection
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Modules sélectionnés: {formData.selectedModules.length}
                  </p>
                </div>
              </div>

              {loadingModules ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Chargement des modules...</p>
                  </div>
                </div>
              ) : availableModules.length === 0 ? (
                <div className="flex items-center justify-center h-[60vh]">
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
                <ScrollArea className='h-[60vh] pr-4'>
                  <div className='space-y-6 px-4'>
                    {Object.entries(modulesByCategory).map(([category, modules]) => (
                      <div key={category} className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <h4 className='font-medium'>
                            {MODULE_CATEGORIES[category as keyof typeof MODULE_CATEGORIES]?.label || category}
                          </h4>
                          <Badge variant='outline'>
                            {modules.length} module{modules.length > 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-2'>
                          {modules.map((mod) => (
                            <Card
                              key={mod.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                formData.selectedModules.includes(mod.id)
                                  ? 'ring-2 ring-primary bg-primary/5'
                                  : ''
                              }`}
                              onClick={() => 
                                handleModuleToggle(
                                  mod.id, 
                                  !formData.selectedModules.includes(mod.id)
                                )
                              }
                            >
                              <CardHeader className='pb-2'>
                                <div className='flex items-start justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <div 
                                      className='p-1.5 rounded-md'
                                      style={{ 
                                        backgroundColor: `${mod.color}20`, 
                                        color: mod.color 
                                      }}
                                    >
                                      <Building2 className='h-3 w-3' />
                                    </div>
                                    <div>
                                      <CardTitle className='text-sm'>
                                        {mod.display_name}
                                      </CardTitle>
                                      <div className='flex items-center gap-1 mt-1'>
                                        {mod.is_core && (
                                          <Badge variant='secondary' className='text-xs'>
                                            Système
                                          </Badge>
                                        )}
                                        <Badge variant='outline' className='text-xs'>
                                          {mod.pricing_tier}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Checkbox
                                    checked={formData.selectedModules.includes(mod.id)}
                                    disabled={mod.is_core}
                                  />
                                </div>
                              </CardHeader>
                              <CardContent className='pt-0'>
                                <CardDescription className='text-xs'>
                                  {mod.description}
                                </CardDescription>
                                {mod.requires_modules && mod.requires_modules.length > 0 && (
                                  <p className='text-xs text-muted-foreground mt-2'>
                                    Dépendances: {mod.requires_modules.join(', ')}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          <DialogFooter className='gap-3'>
            {currentStep === 2 && (
              <Button type='button' variant='outline' onClick={handleBack}>
                Retour
              </Button>
            )}
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Création...' : currentStep === 1 ? 'Suivant' : 'Créer la firme'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}