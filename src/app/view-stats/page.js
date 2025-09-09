'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabaseClient'

export default function ViewStats() {
	const [loanSummary, setLoanSummary] = useState([])
	const [username, setUsername] = useState('')
	const [userId, setUserId] = useState('')
	const [stats, setStats] = useState([])
	const [errorMsg, setErrorMsg] = useState('')
	const router = useRouter()

	useEffect(() => {
		// Try to get username from router state
		let passedUsername = ''
		try {
			if (typeof window !== 'undefined' && window.history.state && window.history.state.usr && window.history.state.usr.username) {
				passedUsername = window.history.state.usr.username
				setUsername(passedUsername)
			}
		} catch (e) {}
	}, [])

	useEffect(() => {
		const fetchLoanSummary = async () => {
			if (!username) return
			const { data: rows, error } = await supabase
				.from('loandebts')
				.select('lender, borrower, amount')
				.or(`lender.eq.${username},borrower.eq.${username}`)
			if (error) return
			const lentMap = {}
			const borrowedMap = {}
			rows.forEach(row => {
				if (row.lender === username) {
					lentMap[row.borrower] = (lentMap[row.borrower] || 0) + (row.amount || 0)
				}
				if (row.borrower === username) {
					borrowedMap[row.lender] = (borrowedMap[row.lender] || 0) + (row.amount || 0)
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
		}
		fetchLoanSummary()
	}, [username])

	useEffect(() => {
		const fetchUserStats = async () => {
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				router.push('/')
				return
			}
			setUserId(user.id)

			let effectiveUsername = username
			if (!effectiveUsername) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('username')
					.eq('id', user.id)
					.single()
				if (profile) {
					effectiveUsername = profile.username
					setUsername(profile.username)
				}
			}

			if (effectiveUsername) {
				const { data: monthlyStats, error } = await supabase
					.from('monthly_stats')
					.select('month, year, total_exp, max_cost, max_category')
					.eq('username', effectiveUsername)
					.order('year', { ascending: false })
					.order('month', { ascending: false })

				if (error) {
					setErrorMsg('Failed to fetch stats')
				}
				setStats(monthlyStats || [])
			}
		}
		fetchUserStats()
		}, [router, username]);

	return (
		<div className="min-h-screen flex flex-col md:flex-row items-center p-6">
			{/* Left side: Monthly Stats Table */}
			<div className="flex-1 border p-4 rounded shadow w-full max-w-2xl mb-6 md:mb-0 md:mr-6">
				<h2 className="text-lg font-semibold mb-4">Monthly Stats for {username}</h2>
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="border px-2 py-1">Month</th>
							<th className="border px-2 py-1">Year</th>
							<th className="border px-2 py-1">Total</th>
							<th className="border px-2 py-1">Max Expenditure</th>
							<th className="border px-2 py-1">Category</th>
						</tr>
					</thead>
					<tbody>
						{stats.length === 0 ? (
							<tr><td colSpan={5} className="text-center py-2">No stats found</td></tr>
						) : (
							stats.map((row, idx) => (
								<tr key={idx} className="text-center">
									<td className="border px-2 py-1">{row.month}</td>
									<td className="border px-2 py-1">{row.year}</td>
									<td className="border px-2 py-1">{row.total_exp}</td>
									<td className="border px-2 py-1">{row.max_cost}</td>
									<td className="border px-2 py-1">{row.max_category}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
				{errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
			</div>
					{/* Right side: Loan Summary Table */}
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
		</div>
	)
};