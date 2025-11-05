// ✅ src/app/choose-username/page.jsx (SERVER COMPONENT)
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/utils/supabaseServerClient';
import ChooseUsernameClient from './ChooseUsernameClient';

export default async function Page() {
  const supabase = createServerSupabase();

  // ✅ Check if logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/redirect');
  }

  return <ChooseUsernameClient userId={user.id} />;
}
