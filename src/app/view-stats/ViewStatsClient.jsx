// app/view-stats/ViewStatsClient.jsx
'use client';

import { useUser } from '@/utils/UserContext';
import supabase from '@/utils/supabaseClient';

export default function ViewStatsClient({ 
  username, 
  monthExpenses, 
  groupedExpenses, 
  loanSummary, 
  currentMonth, 
  currentYear 
}) {
  const { setUsername } = useUser();
  setUsername(username);

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-6 p-6">
      {/* ===== Left: Personal Expenses ===== */}
      <div className="flex-1 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          {currentMonth} {currentYear} – Your Expenses
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Comments</th>
            </tr>
          </thead>
          <tbody>
            {monthExpenses.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-2">No expenses</td></tr>
            ) : (
              monthExpenses.map((row, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-2 py-1">{row.category}</td>
                  <td className="border px-2 py-1">{row.amount}</td>
                  <td className="border px-2 py-1">{row.comments}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Middle: Grouped Expenses ===== */}
      <div className="flex-1 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Expenses by Category</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {groupedExpenses.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-2">No data</td></tr>
            ) : (
              groupedExpenses.map((row, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-2 py-1">{row.category}</td>
                  <td className="border px-2 py-1">{row.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Right: Loan Summary ===== */}
      <div className="flex-1 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Loan Summary</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">User</th>
              <th className="border px-2 py-1">I Lent</th>
              <th className="border px-2 py-1">I Borrowed</th>
              <th className="border px-2 py-1">Balance</th>
            </tr>
          </thead>
          <tbody>
            {loanSummary.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-2">No data</td></tr>
            ) : (
              loanSummary.map((row, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-2 py-1">{row.user}</td>
                  <td className="border px-2 py-1">{row.amountLent}</td>
                  <td className="border px-2 py-1">{row.amountBorrowed}</td>
                  <td className="border px-2 py-1">{row.balance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
