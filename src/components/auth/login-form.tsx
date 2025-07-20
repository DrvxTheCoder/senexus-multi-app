// src/components/auth/login-form.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          <img
            src="/assets/img/icons/senexus-icon.png"
            alt="Senexus Group Logo"
            className="mx-auto mb-2 h-10 w-auto rounded"
          />
          Connexion
        </CardTitle>
        <CardDescription className="text-center">
          Connexion à la plateforme <b className='font-extrabold'>Senexus Multi-App</b>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Pas encore de compte ? </span>
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}