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
        .select('lender, borrower, category, cost, comments, settled')
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

    // Per-person out-of-pocket
    const totals = {};

    for (const expense of groupExpenses) {
        const lender = expense.lender;
        const cost = expense.cost;
        if (!totals[lender]) {
            totals[lender] = 0;
        }
        totals[lender] += Number(cost) || 0;
    }    

    // 6. Get all the unique transactors
    if (!groupExpenses) return [];

    const transactors = [
      ...new Set(
        groupExpenses.flatMap(exp => [exp.lender, exp.borrower].filter(Boolean))
      )
    ];
  
    // 7.  Calculate loans and debts
    const balances = [];  // Final result array of { borrower, lender, balance }
    const personalSpends = []; // How much each person has spent for themselves

    for (let i = 0; i < transactors.length; i++) {
      const transactor1 = transactors[i];

      for (let j = i; j < transactors.length; j++) {
        const transactor2 = transactors[j];
        // 3) Total lent by transactor1 to transactor2
        const one_lent_two = groupExpenses
          .filter(exp => exp.lender === transactor1 && exp.borrower === transactor2 && exp.settled === false)
          .reduce((sum, exp) => sum + Number(exp.cost), 0);

        // 4) Total borrowed by transactor1 from transactor2
        if (transactor1 == transactor2){
          personalSpends.push({
            person : transactor1,
            amount : one_lent_two
          });
          continue;
        }

        const two_lent_one = groupExpenses
          .filter(exp => exp.lender === transactor2 && exp.borrower === transactor1 && exp.settled === false)
          .reduce((sum, exp) => sum + Number(exp.cost), 0);

        // 5) Net balance between them
        const balance = one_lent_two - two_lent_one;

        // 6) Add to result only if there is a non-zero balance
        if (balance > 0) {
          balances.push({
            borrower: transactor2,
            lender: transactor1,
            balance: balance
          });
        } else if (balance < 0) {
          balances.push({
            borrower: transactor1,
            lender: transactor2,
            balance: Math.abs(balance)
          });
        }
      }
  }


  return (
    <Suspense fallback={<div>Loading group info...</div>}>
      <GroupInfoClient 
        groupid={groupid}
        groupname={groupname}
        groupExpenses={groupExpenses}
        transactors={transactors}
        indivExpenses={indivContribArr}
        perPersonOOP={totals}
        groupBalances={balances}
        totalSpent={totalSpent}
        personalSpends={personalSpends}
        />
    </Suspense>
  );
}