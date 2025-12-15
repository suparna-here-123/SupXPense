'use client';

import { useEffect, useState } from 'react';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext';
import { useRouter } from 'next/navigation';

export default function GroupInfoClient({ groupid, groupname, groupExpenses, transactors, indivExpenses, perPersonOOP, groupBalances, totalSpent, personalSpends }) {
    const [settleUpWith, setSettleUpWith] = useState([]);
    const { username, setUsername } = useUser();

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const settleUp = async () => {
      const isConfirmed = window.confirm(`Settle balance between ${settleUpWith.lender} and ${settleUpWith.borrower}?`);

      if (isConfirmed){
      //Update settlement in groupexpenses
      const { error: updateError } = await supabase
                            .from('groupexpenses')
                            .update({ settled: true })
                            .match({ 
                                    lender : settleUpWith.lender,
                                    borrower : settleUpWith.borrower
                            }) 
                            &&
                            await supabase
                            .from('groupexpenses')
                            .update({ settled: true })
                            .match({ lender : settleUpWith.borrower,
                                    borrower : settleUpWith.lender
                            });

      const { error: addError } = await supabase
                          .from('personalexpenses')
                          .insert({
                                username : settleUpWith.borrower,
                                expyear : currentYear,
                                expmonth : currentMonth,
                                category : 'Group Debt',
                                amount : settleUpWith.balance,
                                comments : groupname
      })
      if (addError) {
        alert("Error adding to personal expense");
        return;
      }                            
      
      if (updateError) {
        alert('Error settling up.')
        setSettleUpWith([]);
        return;
      }else {
        alert('Debt settled!');
        window.location.reload();
      }
    }};
    
    const deleteGroup = async () => {
      if (groupBalances.length == 0){
          const isConfirmed = window.confirm(`Delete group? Action cannot be undone. Individual running costs will be added to monthly expenses.`);
          if (isConfirmed){
            // Add the balance to borrower's personal expense under category 'Group'
            for(let j = 0; j < personalSpends.length; j++){
                const { error: addError } = await supabase
                                    .from('personalexpenses')
                                    .insert({
                                          username : personalSpends[j].person,
                                          expyear : currentYear,
                                          expmonth : currentMonth,
                                          category : 'Group Personal',
                                          amount : personalSpends[j].amount,
                                          comments : groupname
                })
                if (addError) {
                  alert("Error adding to personal expense");
                  return;
                }
            }
            const response = await supabase
                            .from('groups')
                            .delete()
                            .eq('groupid', groupid);
            alert('Group deleted!');
            router.back();
      }}
      else{
        alert("Settle balances before deleting group.");
        return;
      }
    };  

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
                            // disabled={!(obj.lender == username || obj.borrower == username)}
                          >Settle up</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


            <h3 className="text-lg font-semibold mb-2">Per-person out-of-pocket</h3>
            <div className="overflow-x-auto mb-4">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-info text-black">
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupExpenses.length === 0 ? (
                    <tr><td colSpan={2} className="text-center">No expenses</td></tr>
                  ) : (
                    Object.entries(perPersonOOP).map(([user, amount], idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{user}</td>
                        <td className="px-4 py-2 text-right">₹{amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-2">How much have I spent for myself?</h3>
            <div className="overflow-x-auto">
              <table className="table table-zebra table-compact w-full">
                <thead>
                  <tr className="bg-success text-black">
                    <th className="px-4 py-2 text-left">Username</th>
                    <th className="px-4 py-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {personalSpends.length === 0 ? (
                    <tr><td colSpan={2} className="text-center">No expenditures</td></tr>
                  ) : (
                    personalSpends.map((obj, idx) => (
                      <tr key={idx} className="hover">
                        <td className="px-4 py-2">{obj.person}</td>
                        <td className="px-4 py-2 text-right">₹{obj.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
                className="btn btn-error"
                onClick={() => deleteGroup()}>
                Delete Group
            </button>        
          </div>
        </div>
      </div>
    )
  };