// File: src/components/firm/firm-switch-dialog.tsx
'use client';

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
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight } from 'lucide-react';

interface Firm {
  id: string;
  slug: string;
  codename: string;
  name: string;
  logo: string | null;
  theme_color: string | null;
}

interface FirmSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFirm: Firm | null;
  targetFirm: Firm | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FirmSwitchDialog({
  open,
  onOpenChange,
  currentFirm,
  targetFirm,
  onConfirm,
  onCancel
}: FirmSwitchDialogProps) {
  if (!targetFirm) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            ATTENTION
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Vous êtes sur le point de basculer vers une autre firme. 
                Cela changera votre contexte de travail actuel.
              </p>
              
              {/* Firm transition visual */}
              <div className="flex items-center justify-center gap-4 py-4">
                {/* Current firm */}
                {currentFirm && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex aspect-square size-12 items-center justify-center overflow-hidden rounded-lg border-2 dark:border-muted">
                      {currentFirm.logo ? (
                        <img
                          src={currentFirm.logo}
                          alt={currentFirm.name + ' logo'}
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
                        className={`fallback-icon size-6 ${currentFirm.logo ? 'hidden' : 'block'}`}
                        style={{ color: currentFirm.theme_color || '#3b82f6' }}
                      />
                    </div>
                    {/* <div className="text-center">
                      <div className="text-xs font-medium">{currentFirm.name}</div>
                      <Badge variant="outline" className="text-xs font-mono mt-1">
                        {currentFirm.codename}
                      </Badge>
                    </div> */}
                  </div>
                )}

                {/* Arrow */}
                <div className="rounded-full p-2 border border-muted-foreground">
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>

                {/* Target firm */}
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="flex aspect-square size-12 items-center justify-center overflow-hidden rounded-lg border-2 dark:border-muted"
                  >
                    {targetFirm.logo ? (
                      <img
                        src={targetFirm.logo}
                        alt={targetFirm.name + ' logo'}
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
                      className={`fallback-icon size-6 ${targetFirm.logo ? 'hidden' : 'block'}`}
                      style={{ color: targetFirm.theme_color || '#3b82f6' }}
                    />
                  </div>
                  {/* <div className="text-center">
                    <div className="text-xs font-medium">{targetFirm.name}</div>
                    <Badge 
                      variant="outline" 
                      className="text-xs font-mono mt-1"
                      style={{ 
                        backgroundColor: targetFirm.theme_color ? `${targetFirm.theme_color}20` : undefined,
                        color: targetFirm.theme_color || undefined,
                        borderColor: targetFirm.theme_color || undefined
                      }}
                    >
                      {targetFirm.codename}
                    </Badge>
                  </div> */}
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                Vos données et préférences seront automatiquement adaptées au contexte de{' '}
                <span className="font-bold">{targetFirm.name}</span>.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            style={{ backgroundColor: targetFirm.theme_color || undefined }}
            className="cursor-pointer"
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

