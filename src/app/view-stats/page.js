'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext';

export default function ViewStats() {
	const [loanSummary, setLoanSummary] = useState([])
	const { username, setUsername } = useUser();
	const [monthExpenses, setMonthExpenses] = useState([]);
	const [groupedExpenses, setGroupedExpenses] = useState([]);
	const [errorMsg, setErrorMsg] = useState('')
	const router = useRouter()
	
	const currentMonth = new Date().toLocaleString('default', { month: 'long' })
  	const currentYear = new Date().getFullYear();

	const thisMonthExpenses = async () => {
		const { data: monthExpenses, error } = await supabase.from('personalexpenses')
												.select('category, amount, comments')
												.match({
													'username' : username,
													'expyear' : currentYear,
													'expmonth' : currentMonth
												});
		setMonthExpenses(monthExpenses || []);

		// Group by category and sum amount
		if (monthExpenses) {
			const grouped = {};
			monthExpenses.forEach(row => {
				if (!grouped[row.category]) grouped[row.category] = 0;
				grouped[row.category] += Number(row.amount) || 0;
			});
			// Convert to array of { category, total }
			const groupedArr = Object.entries(grouped).map(([category, total]) => ({ category, total }));
			setGroupedExpenses(groupedArr);
		} else {
			setGroupedExpenses([]);
		}

	}
	
	const fetchLoanSummary = async () => {
		if (!username) return
		const { data: rows, error } = await supabase
			.from('loans')
			.select('lender, borrower, amount, comments')
			.or(`lender.eq.${username},borrower.eq.${username}`)
		if (error) return

		const lentMap = {}
		const borrowedMap = {}
		rows.forEach(row => {
			if (row.lender === username) {
				lentMap[row.borrower] = (lentMap[row.borrower] || 0) + row.amount
			}
			if (row.borrower === username) {
				borrowedMap[row.lender] = (borrowedMap[row.lender] || 0) + row.amount
			}
		})
		const users = Array.from(new Set([...Object.keys(lentMap), ...Object.keys(borrowedMap)]))
		const summary = users.map(user => ({
			user,
			amountLent: lentMap[user] || 0,
			amountBorrowed: borrowedMap[user] || 0,
			balance: -(lentMap[user] || 0) + (borrowedMap[user] || 0)
		}))
		setLoanSummary(summary)
	};
		
	useEffect(() => {
		thisMonthExpenses();
		fetchLoanSummary();
	}, [username]);


	return (
		<div className="min-h-screen flex flex-col md:flex-row items-center p-6">
			<h2 className="text-lg font-semibold mb-4">{currentMonth} {currentYear}</h2>
			{/* Left side: Monthly monthExpenses Table */}
			<div className="flex-1 border p-4 rounded shadow w-full max-w-2xl mb-6 md:mb-0 md:mr-6">
				<h2 className="text-lg font-semibold mb-4">Individual expenses</h2>
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="border px-2 py-1">Category</th>
							<th className="border px-2 py-1">Expense</th>
							<th className="border px-2 py-1">Comments</th>
						</tr>
					</thead>
					<tbody>
						{monthExpenses.length === 0 ? (
							<tr><td colSpan={3} className="text-center py-2">No expenses yet</td></tr>
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
				{errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
			</div>

			{/* Right side: Loan Sumary Table */}
			<div className="flex-1 border p-4 rounded shadow w-full max-w-2xl">
				<h2 className="text-lg font-semibold mb-4">Loan Summary</h2>
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="border px-2 py-1">User</th>
							<th className="border px-2 py-1">I lent</th>
							<th className="border px-2 py-1">I borrowed</th>
							<th className="border px-2 py-1">Balance</th>
						</tr>
					</thead>
					<tbody>
						{loanSummary.length === 0 ? (
							<tr><td colSpan={4} className="text-center py-2">No loan data</td></tr>
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

			{/* Expenses grouped by category */}
			<div className="flex-1 border p-4 rounded shadow w-full max-w-2xl mb-6 md:mb-0 md:mr-6">
				<h2 className="text-lg font-semibold mb-4">Grouped expenses</h2>
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="border px-2 py-1">Category</th>
							<th className="border px-2 py-1">Total</th>
						</tr>
					</thead>
					<tbody>
						{groupedExpenses.length === 0 ? (
							<tr><td colSpan={2} className="text-center py-2">No expenses yet</td></tr>
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
				{errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
			</div>
		</div>
	)
};