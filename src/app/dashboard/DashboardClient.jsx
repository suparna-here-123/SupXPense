'use client';

import { useEffect, useState } from 'react';
import supabase from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/UserContext';

export default function DashboardClient({ username, userId, otherUsers }) {
  const router = useRouter();
  const { setUsername } = useUser();

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [persExpComments, setPersExpComments] = useState('');
  const [loanComments, setLoanComments] = useState('');
  const [loanCategory, setLoanCategory] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [transactor, setTransactor] = useState('');
  const [myRole, setMyRole] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const defaultCats = ['Food', 'Cab', 'Fuel', 'Groceries', 'Misc'];

  const handlePersonalSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!category || !amount) {
      setErrorMsg('Please fill all personal expense fields');
      return;
    }

    const { error } = await supabase.from('personalexpenses').insert({
      username: username,
      expyear: currentYear,
      expmonth: currentMonth,
      category: category,
      amount: parseFloat(amount),
      comments: persExpComments,
    });

    if (error) setErrorMsg('Failed to save expense');
    else {
      setSuccessMsg('Expense saved!');
      setAmount('');
      setCategory('');
      setPersExpComments('');
    }
  };

  const handleLoanSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!loanCategory || !loanAmount || !transactor) {
      setErrorMsg('Please fill all loan fields');
      return;
    }

    const { error } = await supabase.from('loans').insert({
      loanYear: currentYear,
      loanMonth: currentMonth,
      lender: myRole == 'lent' ? username : transactor,
      borrower : myRole == 'borrowed' ? username : transactor,
      category: loanCategory,
      comments : loanComments,
      amount: parseFloat(loanAmount),
    });

    if (error) setErrorMsg('Failed to save loan entry');
    else {
      setSuccessMsg('Loan saved!');
      setLoanAmount('');
      setLoanCategory('');
      setTransactor('');
      setLoanComments('');
    }
  };


  useEffect(() => {
      // ✅ Sync username from server into global context
      if (username) setUsername(username);
  }, [username]);

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="flex gap-2 mb-4 self-end">
        <button
          className="btn btn-secondary"
          onClick={() => router.push('/view-stats', { state: { username } })}
        >
          View Stats
        </button>
        <button
          className="btn btn-accent"
          onClick={() => router.push('/groups', { state: { username } })}
        >
          My groups
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Welcome, {username}</h1>
      <p className="mb-6">Transactions this <strong>{currentMonth}</strong></p>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        {/* Personal Expense */}
        <div className="flex-1 card bg-base-100 shadow-xl p-4">
          <h2 className="card-title mb-2">Personal Expense</h2>

          <label className="form-control w-full mb-3">
            <span className="label-text">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="select select-bordered w-full mt-1">
                {defaultCats.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="form-control w-full mb-3">
            <span className="label-text">Amount</span>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input input-bordered w-full mt-1" />
          </label>

          <label className="form-control w-full mb-3">
            <span className="label-text">Comments</span>
            <input type="text" value={persExpComments} onChange={(e) => setPersExpComments(e.target.value)} className="input input-bordered w-full mt-1" maxLength={50} />
          </label>

          <button onClick={handlePersonalSave} className="btn btn-primary w-full">Save</button>
        </div>

        {/* Loan/Debt Entry */}
        <div className="flex-1 card bg-base-100 shadow-xl p-4">
          <h2 className="card-title mb-2">Loan / Debt</h2>

          <label className="form-control w-full mb-3">
            <span className="label-text">Transactor</span>
            <select value={transactor} onChange={(e) => setTransactor(e.target.value)} className="select select-bordered w-full mt-1">
              <option value="">Select user</option>
              {otherUsers.map(user => (
                <option key={user.username} value={user.username}>{user.username}</option>
              ))}
            </select>
          </label>

          <label className="form-control w-full mb-3">
            <span className="label-text">My role</span>
            <select value={myRole} onChange={(e) => setMyRole(e.target.value)} className="select select-bordered w-full mt-1">
              <option value="">Select user</option>
              <option value="lent">I lent money</option>
              <option value="borrowed">I borrowed money</option>              
            </select>
          </label>


          <label className="form-control w-full mb-3">
            <span className="label-text">Category</span>
            <select value={loanCategory} onChange={(e) => setLoanCategory(e.target.value)} className="select select-bordered w-full mt-1">
                {defaultCats.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="form-control w-full mb-3">
            <span className="label-text">Amount</span>
            <input type="number" step="0.01" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="input input-bordered w-full mt-1" />
          </label>

          <label className="form-control w-full mb-3">
            <span className="label-text">Comments</span>
            <input type="text" value={loanComments} onChange={(e) => setLoanComments(e.target.value)} className="input input-bordered w-full mt-1" maxLength={50} />
          </label>

          <button onClick={handleLoanSave} className="btn btn-primary w-full">Save</button>
        </div>
      </div>

      {successMsg && <p className="text-success mt-4">{successMsg}</p>}
      {errorMsg && <p className="text-error mt-2">{errorMsg}</p>}
    </div>
  )
}
