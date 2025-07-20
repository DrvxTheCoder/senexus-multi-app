import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Authentification | Inscription',
  description: 'Page d\'inscription pour l\'authentification.'
};

export default async function Page() {
  return <SignUpViewPage />;
}
