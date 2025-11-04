'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext'

export default function GroupExpensePage() {
    const searchParams = useSearchParams();
    const groupid = searchParams.get('groupid');
    const { username, setUsername } = useUser();
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('');
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);
    const [equalSplitters, setequalSplitters] = useState([]);
    const [unequalSplitters, setUnequalSplitters] = useState([]);
    const [splitType, setSplitType] = useState('equal');
    const [unequalType, setUnequalType] = useState('%');
    const [comments, setComments] = useState('');
    const router = useRouter();
    
    let defaultCats = ['Food', 'Beverage', 'Cab', 'Fuel', 'Misc'];

    // Placeholder for split logic
    const handleEqualSplit = async () => {
        const perPerson = Math.round(expenseAmount / equalSplitters.length, 2);
        const rows = equalSplitters.map(u => ({ 
            groupid: groupid,
            lender : username,
            borrower : u,
            category : expenseCategory,
            cost : perPerson,
            comments : comments
        }));

        const { error } = await supabase.from('groupexpenses').insert(rows);
        if (error) alert('Failed to add expense.');
        else{
            alert('Added expense!');
            prepareExpenseBox();
        }
    };

    const handleUnequalSplit = async () => {
        let rows;
        if (unequalType == '$'){
            rows = unequalSplitters.map(item => ({
                groupid : groupid, 
                lender : username,
                borrower : item.username,
                category: expenseCategory,
                cost : item.value,
                comments : comments
            }))
        }

        else {
            rows = unequalSplitters.map(item => ({
                groupid : groupid, 
                lender : username,
                borrower : item.username,
                category: expenseCategory,
                cost : Math.round(item.value / 100 * expenseAmount, 2),
                comments : comments
            }))
        }

        const { error } = await supabase.from('groupexpenses').insert(rows);
        if (error) alert('Failed to add expense.');
        else{
            alert('Added expense!');
            prepareExpenseBox();
        }        
    };

    const prepareExpenseBox = async (groupid) => {
        setExpenseAmount('');
        setExpenseCategory('');
        setequalSplitters([]);
        setUnequalSplitters([]);
        setSplitType('equal');
        setUnequalType('');

        // Fetch categories for this group
        const { data: cats } = await supabase
            .from('groupcategories')
            .select('groupcategory')
            .eq('groupid', groupid);
        
        setExpenseCategories(defaultCats.concat((cats || []).map(c => c.groupcategory)));

        // Fetch group members
        const { data: members } = await supabase
            .from('groupmembership')
            .select('username')
            .eq('groupid', groupid);
        setGroupMembers(members || []);
    }

    useEffect(() => {
        prepareExpenseBox(groupid);
    }, [groupid]);

    return(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-black p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
                <label className="block mb-2">Category:
                    <select
                        className="w-full border p-2 rounded mt-1"
                        value={expenseCategory}
                        onChange={e => setExpenseCategory(e.target.value)}
                    >
                        <option value="">Select category</option>
                        {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </label>
                <label className="block mb-2">Split:</label>
                <div className="flex gap-4 mb-2">
                    <label>
                        <input
                            type="radio"
                            name="splitType"
                            value="equal"
                            checked={splitType === 'equal'}
                            onChange={() => setSplitType('equal')}
                        /> Equal
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="splitType"
                            value="unequal"
                            checked={splitType === 'unequal'}
                            onChange={() => setSplitType('unequal')}
                        /> Unequal
                    </label>
                </div>
                {splitType === 'unequal' && (
                    <div className="flex gap-2 mb-2">
                        <label>
                            <input
                                type="radio"
                                name="unequalType"
                                value="%"
                                checked={unequalType === '%'}
                                onChange={() => setUnequalType('%')}
                            /> %
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="unequalType"
                                value="$"
                                checked={unequalType === '$'}
                                onChange={() => setUnequalType('$')}
                            /> $
                        </label>
                    </div>
                )}
                { (splitType == 'equal' || (splitType == 'unequal' && unequalType == '%'))  && 
                <label className="block mb-2">Amount:
                    <input
                        type="number"
                        className="w-full border p-2 rounded mt-1"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                    />
                </label>
                }                
                <label className="block mb-2">Members:</label>
                <div className="overflow-x-auto mb-2">
                    <table className="table w-full">
                        <tbody>
                            {groupMembers.map(m => (
                                <tr key={m.username}>
                                    <td className="font-medium align-middle">{m.username}</td>
                                    <td>
                                        {(splitType === 'unequal' && unequalType == '%') && (
                                            <input
                                                type="number"
                                                className="input input-bordered w-24"
                                                min={0}
                                                max={100}
                                                step="any"
                                                placeholder={'%share'}
                                                value={unequalSplitters.find(b => b.username === m.username)?.value || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setUnequalSplitters(prev => {
                                                        const others = prev.filter(b => b.username !== m.username);
                                                        if (val === '' || isNaN(Number(val))) return others;
                                                        return [...others, { username: m.username, value: val }];
                                                    });
                                                }}
                                            />
                                        )}

                                        {(splitType === 'unequal' && unequalType == '$') && (
                                            <input
                                                type="number"
                                                className="input input-bordered w-24"
                                                min={undefined}
                                                max={undefined}
                                                step="any"
                                                placeholder={'amount'}
                                                value={unequalSplitters.find(b => b.username === m.username)?.value || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setUnequalSplitters(prev => {
                                                        const others = prev.filter(b => b.username !== m.username);
                                                        if (val === '' || isNaN(Number(val))) return others;
                                                        return [...others, { username: m.username, value: val }];
                                                    });
                                                }}
                                            />
                                        )}


                                        {(splitType === 'equal') && (
                                            <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={equalSplitters.includes(m.username)}
                                            onChange={e => {
                                                if (e.target.checked) setequalSplitters([...equalSplitters, m.username]);
                                                else setequalSplitters(equalSplitters.filter(u => u !== m.username));
                                            }}
                                        />)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <label>
                        Comments:
                        <input type="text" value={comments} onChange={(e) => setComments(e.target.value)} className="input input-bordered w-full mt-1 mb-3" maxLength={50} />
                </label>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="px-4 py-2 rounded border"
                        onClick={() => router.back()}
                    >Cancel</button>
                    <button
                        className="bg-blue-600 text-black px-4 py-2 rounded"
                        onClick={() => {
                            if (splitType === 'equal') handleEqualSplit();
                            else handleUnequalSplit();
                        }}
                        disabled={ 
                            !expenseCategory
                            || splitType == 'equal' && (equalSplitters.length === 0 || !expenseAmount )
                            || splitType == 'unequal' && unequalSplitters.length == 0
                        }
                    >Add</button>
                </div>
            </div>
        </div>
    )
}