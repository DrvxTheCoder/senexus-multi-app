// File: src/app/auth/no-access/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NoAccessPage() {
  const supabase = createServerComponentClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect('/auth/sign-in');
  }

  // Get user profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <img src="/assets/img/icons/senexus-icon.png" className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted" />
          <CardTitle className="text-2xl">Accès en attente</CardTitle>
          <CardDescription>
            Votre compte a été créé avec succès, mais vous n'avez pas encore été assigné à une firme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Informations du compte</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Nom:</strong> {profile?.full_name || 'Non défini'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Rôle:</strong> {profile?.role || 'user'}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Pour accéder aux fonctionnalités de la plateforme, un administrateur 
                doit vous assigner à au moins une firme. Une fois cette étape terminée, 
                vous pourrez accéder à votre dashboard personnalisé.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 text-sm">Que faire maintenant ?</h4>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0"></span>
                  Contactez votre administrateur pour demander l&apos;accès
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0"></span>
                  Vérifiez que vous avez utilisé la bonne adresse email
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0"></span>
                  Essayez de vous reconnecter dans quelques minutes
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <a 
                href={`mailto:admin@senexusgroup.sn?subject=Demande d'accès pour ${user?.email}&body=Bonjour,%0A%0AJe souhaiterais avoir accès à la plateforme Senexus Multi-App.%0A%0AEmail: ${user?.email}%0ANom: ${profile?.full_name || 'Non défini'}%0A%0AMerci.`}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contacter l&apos;administrateur
              </a>
            </Button>

            <Button 
              asChild 
              variant="ghost" 
              className="w-full"
            >
              <Link href="/auth/sign-in" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez le support technique.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}