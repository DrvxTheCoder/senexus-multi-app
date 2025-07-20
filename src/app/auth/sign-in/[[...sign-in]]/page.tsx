import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Authentification | Connexion',
  description: 'Page de connexion'
};

export default async function Page() {
  return <SignInViewPage />;
}
