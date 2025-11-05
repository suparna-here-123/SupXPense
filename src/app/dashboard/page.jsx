import DashboardClient from './DashboardClient';
import { createClient } from '@/utils/supabaseServerClient'; 
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  // ✅ Check user on server
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/redirect');
  }

  // ✅ Fetch username from DB
  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  // ✅ Fetch other users (exclude current user)
  const { data: otherUsers } = await supabase
    .from('users')
    .select('username')
    .neq('username', profile?.username || '');

  return (
    <DashboardClient
      username={profile?.username || ''}
      userId={user.id}
      otherUsers={otherUsers || []}
    />
  );
}
