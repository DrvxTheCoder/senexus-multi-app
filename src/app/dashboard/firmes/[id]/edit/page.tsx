'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, Building2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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

interface FormData {
  name: string;
  type: string;
  description: string;
  logo: string;
  theme_color: string;
  is_active: boolean;
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

export default function FirmEditPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const firmId = params.id as string;

  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    description: '',
    logo: '',
    theme_color: '#3b82f6',
    is_active: true
  });

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/firmes');
      return;
    }
    loadFirm();
  }, [firmId, isAdmin]);

  const loadFirm = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .eq('id', firmId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Firme introuvable');
        router.push('/dashboard/firmes');
        return;
      }

      setFirm(data);
      setFormData({
        name: data.name,
        type: data.type,
        description: data.description || '',
        logo: data.logo || '',
        theme_color: data.theme_color || '#3b82f6',
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error loading firm:', error);
      toast.error('Erreur lors du chargement de la firme');
      router.push('/dashboard/firmes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast.error('Non autorisé');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('firms')
        .update({
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description.trim() || null,
          logo: formData.logo.trim() || null,
          theme_color: formData.theme_color,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', firmId);

      if (error) throw error;

      toast.success('Firme mise à jour avec succès');
      router.push('/dashboard/firmes');
    } catch (error) {
      console.error('Error updating firm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
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
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/firmes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Modifier la firme</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de {firm?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ 
                  backgroundColor: formData.theme_color ? `${formData.theme_color}20` : '#f1f5f9',
                  color: formData.theme_color || '#64748b'
                }}
              >
                {formData.logo ? (
                  <img 
                    src={formData.logo} 
                    alt="Logo preview"
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
                <Building2 className={`fallback-icon h-4 w-4 ${formData.logo ? 'hidden' : 'block'}`} />
              </div>
              Informations de la firme
            </CardTitle>
            <CardDescription>
              Modifiez les détails de votre firme
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la firme *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ex: Ma Nouvelle Entreprise"
                  required
                  disabled={saving}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de société *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  required
                  disabled={saving}
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
                disabled={saving}
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
                  disabled={saving}
                />
                <Button type="button" variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme_color">Couleur du thème</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.theme_color}
                  onValueChange={(value) => handleInputChange('theme_color', value)}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) => handleInputChange('theme_color', e.target.value)}
                  className="w-16 h-10 p-1 border"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                disabled={saving}
              />
              <Label htmlFor="is_active">Firme active</Label>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
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
    </div>
  );
}