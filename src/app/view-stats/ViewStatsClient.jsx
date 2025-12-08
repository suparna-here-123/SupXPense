// app/view-stats/ViewStatsClient.jsx
'use client';

import { useUser } from '@/utils/UserContext';
import supabase from '@/utils/supabaseClient';

export default function ViewStatsClient({ 
  username, 
  monthExpenses,
  monthTotal, 
  groupedExpenses, 
  loanSummary, 
  currentMonth, 
  currentYear 
}) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const months = monthNames.map(m => ({ label: m, value: m }));
  const years = Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }));

  const handleMonthYearChange = (newMonth, newYear) => {
    const url = `/view-stats?month=${encodeURIComponent(newMonth)}&year=${newYear}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col gap-6 p-6 bg-base-50">
      {/* Page Heading */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">{currentMonth} {currentYear} Expenditures</h1>
        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-title">Running Total</div>
            <div className="stat-value text-primary">₹{monthTotal}</div>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="flex gap-4 items-center mb-4">
        <label className="form-control">
          <div className="label">
            <span className="label-text font-semibold">Month</span>
          </div>
          <select
            value={currentMonth}
            onChange={e => handleMonthYearChange(e.target.value, currentYear)}
            className="select select-bordered"
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text font-semibold">Year</span>
          </div>
          <select
            value={currentYear}
            onChange={e => handleMonthYearChange(currentMonth, parseInt(e.target.value))}
            className="select select-bordered"
          >
            {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Individual Expenses */}
        <div className="flex-1 card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold mb-4">
              Individual Expenses
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-info text-white">
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-2">No expenses</td></tr>
                  ) : (
                    monthExpenses.map((row, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2 text-right">₹{row.amount}</td>
                        <td className="px-4 py-2">{row.comments ? <span className="text">{row.comments}</span> : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Middle: Grouped Expenses by Category */}
        <div className="flex-1 card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold mb-4">Expenses by Category</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-success text-white">
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedExpenses.length === 0 ? (
                    <tr><td colSpan={2} className="text-center py-2">No data</td></tr>
                  ) : (
                    groupedExpenses.map((row, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2 text-right">₹{row.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Loan Summary */}
        <div className="flex-1 card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold mb-4">Loan Summary</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-neutral text-white">
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-right">I Lent</th>
                    <th className="px-4 py-2 text-right">I Borrowed</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {loanSummary.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-2">No data</td></tr>
                  ) : (
                    loanSummary.map((row, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{row.user}</td>
                        <td className="px-4 py-2 text-right">₹{row.amountLent}</td>
                        <td className="px-4 py-2 text-right">₹{row.amountBorrowed}</td>
                        <td className="px-4 py-2 text-right">{row.balance >= 0 ? <span className="text-success">₹{row.balance}</span> : <span className="text-error">₹{Math.abs(row.balance)}</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
