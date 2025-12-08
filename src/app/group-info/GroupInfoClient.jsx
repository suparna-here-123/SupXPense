'use client';

import { useEffect, useState } from 'react';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext';
import { useRouter } from 'next/navigation';

export default function GroupInfoClient({ groupid, groupname, groupExpenses, transactors, indivExpenses, totalSpent }) {
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
      const row = {
                    username : settleUpWith.borrower,
                    expyear : currentYear,
                    expmonth : currentMonth,
                    category : 'Debt',
                    amount : settleUpWith.balance,
                    comments : groupname
     };
      const { addError } = await supabase
                          .from('personalexpenses')
                          .insert(row);
     console.log(row);
     console.log(addError);
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
    
                        console.log(delError);
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
    
    // Show individual spendings (DaisyUI-styled, colored)
    return (
      <div className="flex-1">
        <div className="card bg-base-100 shadow p-4 border border-base-200">
          <div className="card-body">
            <div className="stats stats-vertical lg:stats-horizontal shadow mb-4 bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-md">
              <div className="stat">
                <div className="stat-title text-3xl">{groupname}</div>
                <div className="stat-value text-4xl text-primary ">₹{totalSpent}</div>
                <div className="stat-title">Running total</div>
                
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Per-person out-of-pocket</h3>
            <div className="overflow-x-auto mb-4">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-info text-white">
                    <th className="px-4 py-2 text-left">Lender</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupExpenses.length === 0 ? (
                    <tr><td colSpan={2} className="text-center">No expenses</td></tr>
                  ) : (
                    Object.entries(indivContrib).map(([user, amount], idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{user}</td>
                        <td className="px-4 py-2 text-right">₹{amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-2">Pending Settlements</h3>
            <div className="overflow-x-auto mb-4">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-success text-white">
                    <th className="px-4 py-2 text-left">Lender</th>
                    <th className="px-4 py-2 text-left">Borrower</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groupBalances.length === 0 ? (
                    <tr><td colSpan={4} className="text-center">No balances</td></tr>
                  ) : (
                    groupBalances.map((obj, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{obj.lender}</td>
                        <td className="px-4 py-2">{obj.borrower}</td>
                        <td className="px-4 py-2 text-right">₹{obj.balance}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="btn btn-sm btn-accent"
                            onClick={() => { setSettleUpWith(obj); settleUp(); }}
                            disabled={!(obj.lender == username || obj.borrower == username)}
                          >Settle up</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-2">Expenditures</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-warning text-black">
                    <th className="px-4 py-2 text-left">Lender</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-right">Cost</th>
                    <th className="px-4 py-2 text-left">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {indivExpenses.length === 0 ? (
                    <tr><td colSpan={4} className="text-center">No expenditures</td></tr>
                  ) : (
                    indivExpenses.map((obj, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{obj.lender}</td>
                        <td className="px-4 py-2">{obj.category}</td>
                        <td className="px-4 py-2 text-right">₹{obj.cost}</td>
                        <td className="px-4 py-2">{obj.comments ? <span className="text-right">{obj.comments}</span> : <span className="text-muted">-</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  };