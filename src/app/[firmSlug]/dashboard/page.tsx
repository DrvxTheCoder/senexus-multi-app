import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { useFirm } from '@/lib/contexts/firm-context';

export default async function Dashboard() {
  const supabase = createServerComponentClient();
  const firmSlug = useFirm();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect('/auth/sign-in');
  } else {
    redirect(`/${firmSlug}/dashboard/overview`);
  }
}
