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
  const [borrower, setBorrower] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const handlePersonalSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!category || !amount) {
      setErrorMsg('Please fill all personal expense fields');
      return;
    }

    const { error } = await supabase.from('personalexpenses').insert({
      username,
      expyear: currentYear,
      expmonth: currentMonth,
      category,
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

    if (!loanCategory || !loanAmount || !borrower) {
      setErrorMsg('Please fill all loan fields');
      return;
    }

    const { error } = await supabase.from('loans').insert({
      loanYear: currentYear,
      loanMonth: currentMonth,
      lender: username,
      borrower,
      category: loanCategory,
      amount: parseFloat(loanAmount),
    });

    if (error) setErrorMsg('Failed to save loan entry');
    else {
      setSuccessMsg('Loan saved!');
      setLoanAmount('');
      setLoanCategory('');
      setBorrower('');
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
          onClick={() => router.push('/view-stats')}
        >
          View Stats
        </button>
        <button
          className="btn btn-accent"
          onClick={() => router.push('/groups')}
        >
          My groups
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Welcome, {username}</h1>
      <p className="mb-6">Your transactions this <strong>{currentMonth}</strong></p>

      {/* ----- UI for Personal & Loan sections (same as before) ------ */}
      
      {/* ✅ (Paste your existing forms here — unchanged) */}

      {successMsg && <p className="text-success mt-4">{successMsg}</p>}
      {errorMsg && <p className="text-error mt-2">{errorMsg}</p>}
    </div>
  );
}
