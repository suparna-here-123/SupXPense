// app/groups/page.jsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabaseServerClient';
import GroupsClient from './GroupsClient';

export default async function Page() {
  const supabase = await createClient();

  // ✅ 1. Check if user is logged in (server-side)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/redirect');
  }

  // ✅ 2. Get username
  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  // ✅ 3. Get all group IDs for this user
  const { data: groupIDs } = await supabase
    .from('groupmembership')
    .select('groupid')
    .eq('username', profile.username);

  const ids = groupIDs?.map(row => row.groupid) || [];

  // ✅ 4. Fetch group info (groupname + admin)
  const { data: groupInfos } = await supabase
    .from('groups')
    .select('groupid, groupname, admin')
    .in('groupid', ids);

  return (
    <GroupsClient 
      username={profile.username} 
      initialGroups={groupInfos || []}
    />
  );
}
