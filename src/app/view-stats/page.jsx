// app/view-stats/page.jsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabaseServerClient';
import ViewStatsClient from './ViewStatsClient';

export default async function Page({ searchParams }) {
  const supabase = await createClient();
  const params = await searchParams;

  // ✅ 1. Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/redirect');

  // ✅ 2. Get username
  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = profile?.username;
  const currentMonth = params.month || new Date().toLocaleString('default', { month: 'long' });
  const currentYear = parseInt(params.year) || new Date().getFullYear();

  // ✅ 3. Fetch PERSONAL EXPENSES on server
  let monthTotal = 0;
  const { data: monthExpenses } = await supabase
    .from('personalexpenses')
    .select('category, amount, comments')
    .match({
      username,
      expyear: currentYear,
      expmonth: currentMonth,
    });

  // ✅ Group expenses by category ON SERVER
  const grouped = {};
  (monthExpenses || []).forEach(exp => {
    grouped[exp.category] = (grouped[exp.category] || 0) + Number(exp.amount);
    monthTotal += exp.amount;
  });
  const groupedExpenses = Object.entries(grouped).map(([category, total]) => ({
    category,
    total,
  }));


  // ✅ 4. Fetch LOAN SUMMARY on server:
  const { data: loans } = await supabase
    .from('loans')
    .select('lender, borrower, amount')
    .or(`lender.eq.${username},borrower.eq.${username}`);

  const lentMap = {};
  const borrowedMap = {};
  (loans || []).forEach(row => {
    if (row.lender === username) {
      lentMap[row.borrower] = (lentMap[row.borrower] || 0) + row.amount;
    }
    if (row.borrower === username) {
      borrowedMap[row.lender] = (borrowedMap[row.lender] || 0) + row.amount;
    }
  });

  const users = Array.from(new Set([...Object.keys(lentMap), ...Object.keys(borrowedMap)]));
  const loanSummary = users.map(user => ({
    user,
    amountLent: lentMap[user] || 0,
    amountBorrowed: borrowedMap[user] || 0,
    balance: (borrowedMap[user] || 0) - (lentMap[user] || 0),
  }));

  return (
    <ViewStatsClient
      username={username}
      monthExpenses={monthExpenses || []}
      monthTotal={monthTotal}
      groupedExpenses={groupedExpenses}
      loanSummary={loanSummary}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  );
}
