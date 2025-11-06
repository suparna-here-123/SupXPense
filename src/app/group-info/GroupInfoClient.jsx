'use client';

import { useEffect, useState } from 'react';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext';
import { useRouter } from 'next/navigation';

export default function GroupInfoClient({ groupid, groupname, groupExpenses, transactors }) {
    const [ groupBalances, setGroupBalances ] = useState([]);
    const [indivContrib, setIndivContrib] = useState([]);
    const [settleUpWith, setSettleUpWith] = useState([]);
    const { username, setUsername } = useUser();

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const getIndivContrib = () => {
        const totals = {};

        for (const expense of groupExpenses) {
            const lender = expense.lender;
            const cost = expense.cost;
            if (!totals[lender]) {
                totals[lender] = 0;
            }
            totals[lender] += Number(cost) || 0;
        }
        setIndivContrib(totals);
    };

    // Calculate loans and debts
    const calculateBalances = () => {
      const balances = [];  // Final result array of { borrower, lender, balance }

      for (let i = 0; i < transactors.length; i++) {
        const transactor1 = transactors[i];

        for (let j = 1; j < transactors.length; j++) {
          const transactor2 = transactors[j];

          // 3) Total lent by transactor1 to transactor2
          const one_lent_two = groupExpenses
            .filter(exp => exp.lender === transactor1 && exp.borrower === transactor2)
            .reduce((sum, exp) => sum + Number(exp.cost), 0);

          // 4) Total borrowed by transactor1 from transactor2
          const two_lent_one = groupExpenses
            .filter(exp => exp.lender === transactor2 && exp.borrower === transactor1)
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
      setGroupBalances(balances);
    }

    const settleUp = async () => {
      // 1. Add the balance to borrower's personal expense under category 'Group'
      const { addError } = await supabase
                          .from('personalexpenses')
                          .insert({
                              username : settleUpWith.borrower,
                              expyear : currentYear,
                              expmonth : currentMonth,
                              category : 'Debt',
                              amount : settleUpWith.balance,
                              comments : groupname
     })
     if (addError) {
      alert('Error settling up.')
      setSettleUpWith([]);
      return;
     }

    // 2. Delete all transactions between this lender and borrower in this group in table 'groupexpenses'
    const { delError } = await supabase
                        .from('groupexpenses')
                        .delete()
                        .match({
                          lender : settleUpWith.lender,
                          borrower : settleUpWith.borrower,
                        })
    
    if (delError){
      alert('Error settling up.')
      setSettleUpWith([]);
      return;      
    } else alert('Debt settled!' );
  };

    useEffect(() => {
        getIndivContrib();
        calculateBalances();
        console.log('balances', groupBalances);
    }, [groupExpenses, transactors])
    
    // Show individual spendings
    return (
      <div className="flex-1 border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          Per-person out-of-pocket
        </h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Lender</th>
              <th className="border px-2 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {groupExpenses.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-2">No expenses</td></tr>
            ) : (
            Object.entries(indivContrib).map(([user, amount], idx) => (
                  <tr key={idx} className="text-center">
                    <td className="border px-2 py-1">{user}</td>
                    <td className="border px-2 py-1">{amount}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

        <h2 className="text-lg font-semibold mb-4">
          Pending Settlements
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Lender</th>
              <th className="border px-2 py-1">Borrower</th>
              <th className="border px-2 py-1">Balance</th>
              <th className="border px-2 py-1">Settle up</th>
            </tr>
          </thead>
          <tbody>
            {groupBalances.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-2">No balances</td></tr>
            ) : (
              groupBalances.map((obj, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="border px-2 py-1">{obj.lender}</td>
                    <td className="border px-2 py-1">{obj.borrower}</td>
                    <td className="border px-2 py-1">{obj.balance}</td>
                    <td className="border px-2 py-1">
                      <button
                          className="px-4 py-2 rounded border"
                          onClick={() => {
                            setSettleUpWith(obj);
                            settleUp();
                          }}
                          disabled = { !(obj.lender == username || obj.borrower == username) }
                      >Settle up</button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>

      </div>   
    )    
  };