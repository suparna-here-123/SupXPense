import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabaseServerClient'; 
import ChooseUsernameClient from './ChooseUsernameClient';

export default async function Page() {
  const supabase = await createClient();

  // ✅ Check if logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/redirect');
  }

  return <ChooseUsernameClient userId={user.id} />;
}
