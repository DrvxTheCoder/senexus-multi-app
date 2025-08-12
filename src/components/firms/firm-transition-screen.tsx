// File: src/components/firm/firm-transition-screen.tsx
'use client';

import { useEffect, useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { SpinnerCircular } from 'spinners-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Firm {
  id: string;
  slug: string;
  codename: string;
  name: string;
  logo: string | null;
  theme_color: string | null;
}

interface FirmTransitionScreenProps {
  show: boolean;
  targetFirm: Firm;
  onComplete: () => void;
}

const transitionSteps = [
  { id: 1, label: 'Sauvegarde de la session...', duration: 1000 },
  { id: 2, label: 'Chargement du contexte firme...', duration: 1500 },
  { id: 3, label: 'Application du thème...', duration: 1000 },
  { id: 4, label: 'Préparation de l\'interface...', duration: 1000 },
  { id: 5, label: 'Finalisation...', duration: 500 }
];

export function FirmTransitionScreen({ show, targetFirm, onComplete }: FirmTransitionScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!show) {
      setCurrentStep(0);
      setProgress(0);
      setCompletedSteps([]);
      return;
    }

    let totalTime = 0;
    let currentTime = 0;

    // Calculate total duration
    transitionSteps.forEach(step => {
      totalTime += step.duration;
    });

    // Execute steps sequentially
    const executeSteps = async () => {
      for (let i = 0; i < transitionSteps.length; i++) {
        setCurrentStep(i + 1);
        
        const step = transitionSteps[i];
        const stepProgress = (currentTime / totalTime) * 100;
        setProgress(stepProgress);

        // Animate progress during step
        const startTime = currentTime;
        const endTime = currentTime + step.duration;
        
        const animateProgress = () => {
          const elapsed = performance.now() - startTime;
          const stepProgress = Math.min(elapsed / step.duration, 1);
          const overallProgress = ((startTime + (elapsed)) / totalTime) * 100;
          setProgress(Math.min(overallProgress, 100));
          
          if (stepProgress < 1) {
            requestAnimationFrame(animateProgress);
          }
        };
        
        requestAnimationFrame(animateProgress);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setCompletedSteps(prev => [...prev, i + 1]);
        currentTime += step.duration;
      }

      // Final progress
      setProgress(100);
      
      // Wait a bit before completing
      setTimeout(() => {
        onComplete();
      }, 500);
    };

    executeSteps();
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-8 text-center max-w-md mx-auto p-8">
        {/* Logo and firm info */}
        <div className="relative">
          {/* Animated background ring */}
          <div 
            className="absolute -inset-4 rounded-full animate-pulse"
            style={{ 
              background: targetFirm.theme_color ? 
                `linear-gradient(45deg, ${targetFirm.theme_color}20, ${targetFirm.theme_color}40)` : 
                'linear-gradient(45deg, #3b82f620, #3b82f640)'
            }}
          />
          
          {/* Logo container */}
          <div 
            className="relative flex aspect-square size-24 items-center justify-center overflow-hidden rounded-full border-4 bg-background p-4"
            style={{ borderColor: targetFirm.theme_color || '#3b82f6' }}
          >
            {targetFirm.logo ? (
              <img
                src={targetFirm.logo}
                alt={targetFirm.name + ' logo'}
                className="w-16 object-contain rounded-lg"
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
              className={`fallback-icon size-12 ${targetFirm.logo ? 'hidden' : 'block'}`}
              style={{ color: targetFirm.theme_color || '#3b82f6' }}
            />
          </div>
        </div>

        {/* Firm details */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{targetFirm.name}</h2>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          <Progress 
            value={progress} 
            className="h-2"
            style={{
              '--progress-background': targetFirm.theme_color || '#3b82f6'
            } as React.CSSProperties}
          />
          <div className="text-sm text-muted-foreground">
            {Math.round(progress)}% terminé
          </div>
        </div>

        {/* Current step */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <SpinnerCircular
              size={20}
              color={targetFirm.theme_color || '#3b82f6'}
              secondaryColor="transparent"
              thickness={180}
            />
            <span className="text-sm font-medium">
              {currentStep > 0 && currentStep <= transitionSteps.length 
                ? transitionSteps[currentStep - 1].label 
                : 'Initialisation...'}
            </span>
          </div>

          {/* Steps list */}
          <div className="space-y-2">
            {transitionSteps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-2 text-xs transition-colors ${
                  completedSteps.includes(step.id) 
                    ? 'text-green-600' 
                    : currentStep === step.id 
                      ? 'text-foreground' 
                      : 'text-muted-foreground/50'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className="size-3" />
                ) : currentStep === step.id ? (
                  <div 
                    className="size-3 rounded-full animate-pulse"
                    style={{ backgroundColor: targetFirm.theme_color || '#3b82f6' }}
                  />
                ) : (
                  <div className="size-3 rounded-full bg-muted" />
                )}
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-xs text-muted-foreground max-w-xs">
          Nous préparons votre espace de travail pour {targetFirm.name}. 
          Merci de patienter quelques instants...
        </div>
      </div>
    </div>
  );
}