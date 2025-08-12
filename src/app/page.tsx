import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = createServerComponentClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/senexus/dashboard/overview');
  }
}