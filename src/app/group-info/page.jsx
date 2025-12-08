import { Suspense } from "react";
import { createClient } from '@/utils/supabaseServerClient'; 
import GroupInfoClient from "./GroupInfoClient";
import { redirect } from 'next/navigation';

export default async function Page({ searchParams }) {
    const supabase = await createClient();
    const params = await searchParams
    const groupid = params.groupid;
    const groupname = params.groupname;

    // 1. Check if user is logged in (server-side)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/redirect');
    }

    // 2. Get username
    const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

    // 3. Get each spending in this group
    const { data: groupExpenses } = await supabase
        .from('groupexpenses')
        .select('lender, borrower, category, cost, comments')
        .eq('groupid', groupid);

    // 5. Group expenses by lender, category, and comments, summing up cost
    let totalSpent = 0;
    const indivContrib = {};
    if (groupExpenses) {
      groupExpenses.forEach(exp => {
        const key = `${exp.lender}|${exp.category}|${exp.comments || ''}`;
        if (!indivContrib[key]) {
          indivContrib[key] = {
            lender: exp.lender,
            category: exp.category,
            comments: exp.comments,
            cost: 0
          };
        }
        indivContrib[key].cost += Number(exp.cost) || 0;
        totalSpent += exp.cost;
      });
    }
    const indivContribArr = Object.values(indivContrib);

    // 6. Get all the unique transactors
    if (!groupExpenses) return [];

    const transactors = [
      ...new Set(
        groupExpenses.flatMap(exp => [exp.lender, exp.borrower].filter(Boolean))
      )
    ];


  return (
    <Suspense fallback={<div>Loading group info...</div>}>
      <GroupInfoClient 
        groupid={groupid}
        groupname={groupname}
        groupExpenses={groupExpenses}
        transactors={transactors}
        indivExpenses={indivContribArr}
        totalSpent={totalSpent}
        />
    </Suspense>
  );
}