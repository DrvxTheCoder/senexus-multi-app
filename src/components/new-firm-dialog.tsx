'use client';

import { useState, useCallback, useTransition } from 'react';
import { Plus, Upload } from 'lucide-react';
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
import { toast } from 'sonner'; // If you have sonner, otherwise use alert

interface NewFirmDialogProps {
  onFirmCreated: () => void;
}

interface FormData {
  name: string;
  type: string;
  description: string;
  logo: string;
  theme_color: string;
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
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    description: '',
    logo: '',
    theme_color: '#3b82f6'
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: '',
      description: '',
      logo: '',
      theme_color: '#3b82f6'
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast?.error?.('Vous devez être connecté pour créer une firme') || alert('Vous devez être connecté');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Get the senexus group efficiently
        const { data: groups, error: groupError } = await supabase
          .from('senexus_groups')
          .select('id')
          .limit(1)
          .single(); // Use single() instead of limit(1) with array access

        if (groupError || !groups) {
          throw new Error('Aucun groupe Senexus trouvé');
        }

        // Create the new firm with optimized query
        const { data: newFirm, error: firmError } = await supabase
          .from('firms')
          .insert({
            senexus_group_id: groups.id,
            name: formData.name.trim(),
            type: formData.type,
            description: formData.description.trim() || null,
            logo: formData.logo.trim() || null,
            theme_color: formData.theme_color,
            is_active: true,
            created_by: user.id // Add the user who created it
          })
          .select()
          .single();

        if (firmError) {
          throw firmError;
        }

        // Success feedback
        toast?.success?.('Firme créée avec succès!') || console.log('Firme créée avec succès!');
        
        // Reset form and close dialog
        resetForm();
        setOpen(false);
        
        // Notify parent component to refresh
        onFirmCreated();

      } catch (error) {
        console.error('Erreur lors de la création de la firme:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast?.error?.(`Erreur: ${errorMessage}`) || alert(`Erreur: ${errorMessage}`);
      }
    });
  }, [formData, user, onFirmCreated, resetForm]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isPending) {
      return; // Prevent closing during submission
    }
    setOpen(newOpen);
    if (!newOpen) {
      resetForm(); // Reset form when closing
    }
  }, [isPending, resetForm]);

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
        className='sm:max-w-[500px]'
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Créer une nouvelle firme</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle firme au groupe Senexus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
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
                <Upload className='size-4' />
              </Button>
            </div>
            {formData.logo && (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <img
                  src={formData.logo}
                  alt='Aperçu du logo'
                  className='bg-muted size-6 rounded object-contain'
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span>Aperçu du logo</span>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='theme_color'>Couleur du thème</Label>
            <div className='flex flex-wrap gap-2'>
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  type='button'
                  onClick={() => handleInputChange('theme_color', color.value)}
                  disabled={isPending}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1 text-sm transition-colors ${
                    formData.theme_color === color.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  } disabled:opacity-50`}
                >
                  <div
                    className='size-4 rounded-full border'
                    style={{ backgroundColor: color.value }}
                  />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
            <Input
              type='color'
              value={formData.theme_color}
              onChange={(e) => handleInputChange('theme_color', e.target.value)}
              className='h-8 w-20'
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type='submit'
              disabled={isPending || !formData.name.trim() || !formData.type}
            >
              {isPending ? 'Création...' : 'Créer la firme'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}