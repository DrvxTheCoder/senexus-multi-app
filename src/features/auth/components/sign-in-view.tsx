// src/features/auth/components/sign-in-view.tsx
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IconStar } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignInViewPage() {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-up'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 md:top-8 md:right-8'
        )}
      >
        Inscription
      </Link>
      <div
        className='relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'
        style={{ 
          backgroundImage: "url('/assets/img/site-bg-cover.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className='absolute inset-0 bg-black/20' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <img
            src='/assets/img/icons/senexus-logotype-white.png'
            alt='Senexus Group Logo'
            className='mr-2 h-8 w-auto block'
          />
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              <i>&ldquo;L&apos;intégrité c&apos;est faire ce qui est juste, même quand personne ne regarde.&rdquo;</i>
            </p>
            <footer className='text-sm'>C.S Lewis</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>

          <LoginForm />

          <p className='text-muted-foreground px-8 text-center text-sm'>
            En cliquant sur continuer, vous acceptez nos{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Conditions d&apos;utilisation
            </Link>{' '}
            et{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}