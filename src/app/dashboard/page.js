'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/utils/UserContext'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabaseClient'

export default function Dashboard() {
  const { username, setUsername } = useUser()
  const [userId, setUserId] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [persExpComments, setPersExpComments] = useState('')
  const [loanComments, setLoanComments] = useState('')
  const [loanCategory, setLoanCategory] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [borrower, setBorrower] = useState('')
  const [otherUsers, setOtherUsers] = useState([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const currentMonth = new Date().toLocaleString('default', { month: 'long' })
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/redirect')
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username)
      }

      const { data: users } = await supabase
        .from('users')
        .select('username')
        .neq('username', username)

      setOtherUsers(users || [])
    }

    fetchUserInfo()
  }, [router])

  const handlePersonalSave = async () => {
    setSuccessMsg('')
    setErrorMsg('')
    if (!category || !amount) {
      setErrorMsg('Please fill all personal expense fields')
      return
    }

    const { error } = await supabase.from('personalexpenses').insert({
      username : username,
      expyear : currentYear,
      expmonth : currentMonth, 
      category : category,
      amount: parseFloat(amount),
      comments : persExpComments,
      // expdate: new Date().toISOString().split('T')[0]
    })

    if (error) setErrorMsg('Failed to save expense')
    else {
      setSuccessMsg('Expense saved!')
      setAmount('')
      setCategory('')
    }
  }

  const handleLoanSave = async () => {
    setSuccessMsg('')
    setErrorMsg('')
    if (!loanCategory || !loanAmount || !borrower) {
      setErrorMsg('Please fill all loan fields')
      return
    }

    const { error } = await supabase.from('loans').insert({
      lender: username,
      borrower : borrower,
      category: loanCategory,
      amount: parseFloat(loanAmount),
      lenddate: new Date().toISOString().split('T')[0]
    })

    if (error) {
      setErrorMsg('Failed to save loan entry')
    }else {
      setSuccessMsg('Loan saved!')
      setLoanAmount('')
      setLoanCategory('')
      setBorrower('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <button
        className="bg-purple-600 text-white px-4 py-2 rounded mb-4 self-end"
        onClick={() => router.push('/view-stats', { state: { username } })}
      >
        View Stats
      </button>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded mb-4 self-end"
        onClick={() => router.push('/groups', { state: { username } })}
      >
        My groups
      </button>

      <h1 className="text-2xl font-bold mb-2">Welcome, {username}</h1>
      <p className="mb-6">Your transactions this <strong>{currentMonth}</strong></p>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        {/* Personal Expense */}
        <div className="flex-1 border p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Personal Expense</h2>

          <label>
            Category:
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3">
              <option value="">Select category</option>
              <option value="Food">Food</option>
              <option value="Cab">Cab</option>
              <option value="Gift">Gift</option>
              <option value="Petrol">Petrol</option>
              <option value="Misc">Misc</option>
            </select>
          </label>

          <label>
            Amount:
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" />
          </label>

          <label>
            Comments:
            <input type="text" value={persExpComments} onChange={(e) => setPersExpComments(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" maxLength={50} />
          </label>

          <button onClick={handlePersonalSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>

        {/* Loan/Debt Entry */}
        <div className="flex-1 border p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Loan / Debt</h2>

          <label>
            Borrower:
            <select value={borrower} onChange={(e) => setBorrower(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3">
              <option value="">Select user</option>
              {otherUsers.map(user => (
                <option key={user.username} value={user.username}>{user.username}</option>
              ))}
            </select>
          </label>

          <label>
            Category:
            <select value={loanCategory} onChange={(e) => setLoanCategory(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3">
              <option value="">Select category</option>
              <option value="Food">Food</option>
              <option value="Cab">Cab</option>
              <option value="Gift">Gift</option>
              <option value="Petrol">Petrol</option>
              <option value="Misc">Misc</option>
            </select>
          </label>

          <label>
            Amount:
            <input type="number" step="0.01" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" />
          </label>

          <label>
            Comments:
            <input type="text" value={loanComments} onChange={(e) => setLoanComments(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" maxLength={50} />
          </label>

          <button onClick={handleLoanSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>

      {successMsg && <p className="text-green-500 mt-4">{successMsg}</p>}
      {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
    </div>
  )
}

