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
    const [selectedBorrowers, setSelectedBorrowers] = useState([]);
    const [splitType, setSplitType] = useState('equal');
    const [unequalType, setUnequalType] = useState('%');
    const [comments, setComments] = useState('');
    let defaultCats = ['Food', 'Beverage', 'Cab', 'Fuel', 'Misc'];

    // Placeholder for split logic
    const handleEqualSplit = async () => {
        const perPerson = Math.round(expenseAmount / selectedBorrowers.length, 2);
        const rows = selectedBorrowers.map(u => ({ 
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
    const handleUnequalSplit = () => {
        // TODO: Implement unequal split logic
    };

    const prepareExpenseBox = async (groupid) => {
        setExpenseAmount('');
        setExpenseCategory('');
        setSelectedBorrowers([]);
        setSplitType('equal');
        setUnequalType('%');

        // Fetch categories for this group
        const { data: cats } = await supabase
            .from('groupcategories')
            .select('groupcategory')
            .eq('groupid', groupid);
        
        setExpenseCategories(defaultCats.concat(cats.map(c => c.groupcategory)));

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
                <label className="block mb-2">Amount:
                    <input
                        type="number"
                        className="w-full border p-2 rounded mt-1"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                    />
                </label>
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

                <label className="block mb-2">Members:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {groupMembers.map(m => (
                        <label key={m.username} className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={selectedBorrowers.includes(m.username)}
                                onChange={e => {
                                    if (e.target.checked) setSelectedBorrowers([...selectedBorrowers, m.username]);
                                    else setSelectedBorrowers(selectedBorrowers.filter(u => u !== m.username));
                                }}
                            />
                            {m.username}
                        </label>
                    ))}
                </div>




                <label>
                    Comments:
                    <input type="text" value={comments} onChange={(e) => setComments(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" maxLength={50} />
                </label>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="px-4 py-2 rounded border"
                        onClick={() => {}}
                    >Cancel</button>
                    <button
                        className="bg-blue-600 text-black px-4 py-2 rounded"
                        onClick={() => {
                            if (splitType === 'equal') handleEqualSplit();
                            else handleUnequalSplit();
                        }}
                        disabled={!expenseAmount || !expenseCategory || selectedBorrowers.length === 0}
                    >Add</button>
                </div>
            </div>
        </div>
    )
}