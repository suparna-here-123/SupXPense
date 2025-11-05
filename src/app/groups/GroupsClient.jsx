'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext';

export default function GroupsClient({ username, initialGroups }) {
  const router = useRouter();
  const { setUsername } = useUser();
  useEffect(() => setUsername(username), [username]);

  // ✅ STATES
  const [groupInfos, setGroupInfos] = useState(initialGroups);
  const [showDialog, setShowDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [creating, setCreating] = useState(false);
  const categoryInputRef = useRef(null);

  // Member management
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [newMembers, setNewMembers] = useState([]);
  const [removeMembers, setRemoveMembers] = useState([]);
  const [currentAddGroupID, setCurrentAddGroupID] = useState(null);
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);

  // ✅ Function: Add Category
  const handleAddCategory = () => {
    const trimmed = categoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setCategoryInput('');
      categoryInputRef.current?.focus();
    }
  };

  // ✅ Function: Remove Category
  const handleRemoveCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  // ✅ Function: Create group (writes to DB)
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || categories.length === 0) return;
    setCreating(true);

    const { data: groupRow, error: groupErr } = await supabase
      .from('groups')
      .insert([{ groupname: newGroupName.trim(), admin: username }])
      .select('groupid')
      .single();

    if (groupErr || !groupRow) {
      alert('Failed to create group');
      setCreating(false);
      return;
    }

    const groupid = groupRow.groupid;
    await supabase.from('groupmembership').insert([{ groupid, username }]);
    await supabase.from('groupcategories').insert(
      categories.map(c => ({ groupid, groupcategory: c }))
    );

    alert('Group created!');
    setCreating(false);
    setShowDialog(false);
    setNewGroupName('');
    setCategories([]);

    // Refresh UI
    setGroupInfos([...groupInfos, { groupid, groupname: newGroupName, admin: username }]);
  };

  // ✅ Open Member Management Dialog
  const addMembersToGroup = async (groupID) => {
    setShowAddMembersDialog(true);
    setCurrentAddGroupID(groupID);
    setNewMembers([]);
    setRemoveMembers([]);

    const { data: allUsers } = await supabase.from('users').select('username');
    const { data: members } = await supabase.from('groupmembership').select('username').eq('groupid', groupID);

    const memberNames = (members || []).map(m => m.username);
    setGroupMembers(members || []);
    setPotentialMembers(allUsers.filter(u => !memberNames.includes(u.username) && u.username !== username));
  };

    const handleAddUserToSelection = (user) => {
    if (!newMembers.includes(user)) setNewMembers([...newMembers, user]);
    };

    const handleRemoveUserFromSelection = (user) => {
        setNewMembers(newMembers.filter(u => u !== user));
    };

  const handleSaveChanges = async () => {
        if (!currentAddGroupID) return;

        setSaveChangesLoading(true);
        // Make rows
        const newMemRows = newMembers.map(u => ({ groupid: currentAddGroupID, username: u }));
        
        const { addError } = await supabase.from('groupmembership').insert(newMemRows)
        const { data, removeError } = await supabase
                                    .from('groupmembership')
                                    .delete()
                                    .match({ groupid: currentAddGroupID })
                                    .in('username', removeMembers);
        
        setSaveChangesLoading(false);
        setShowAddMembersDialog(false);
        setNewMembers([]);
        setCurrentAddGroupID(null);

        if ( addError || removeError ) alert('Failed to save changes.');
        else alert('Saved changes!');
  };

    
    return (
        <div className="p-6">
            {showAddMembersDialog && (
                <dialog open className="modal modal-open">
                    <div className="modal-box bg-base-200">
                        <h2 className="font-bold text-lg mb-4">Manage Members</h2>
                        <form method="dialog" className="form-control gap-2">
                            <label className="label">Add user</label>
                            <div className="flex gap-2 mb-2">
                                <select
                                    className="select select-bordered w-full"
                                    value=""
                                    onChange={e => {
                                        if (e.target.value) handleAddUserToSelection(e.target.value);
                                    }}
                                >
                                    <option value="">Select user</option>
                                    {potentialMembers.filter(u => !newMembers.includes(u.username)).map(u => (
                                        <option key={u.username} value={u.username}>{u.username}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => {
                                        const select = document.querySelector('select');
                                        if (select && select.value) handleAddUserToSelection(select.value);
                                    }}
                                    disabled={saveChangesLoading}
                                >+
                                </button>
                            </div>

                            <label className="label">Remove user</label>
                            <div className="flex gap-2 mb-2">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {groupMembers.map(m => (
                                        <label key={m.username} className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={removeMembers.includes(m.username)}
                                                onChange={e => {
                                                    if (e.target.checked) setRemoveMembers([...removeMembers, m.username]);
                                                    else setRemoveMembers(removeMembers.filter(u => u !== m.username));
                                                }}
                                            />
                                            {m.username}
                                        </label>
                                    ))}
                                </div>
                            </div>                            


                            <div className="flex flex-wrap gap-2 mb-4">
                                {newMembers.map(user => (
                                    <span key={user} className="badge badge-outline flex items-center gap-1">
                                        {user}
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-circle btn-ghost text-error"
                                            onClick={() => handleRemoveUserFromSelection(user)}
                                            disabled={saveChangesLoading}
                                        >✕</button>
                                    </span>
                                ))}
                            </div>
                            <div className="modal-action flex gap-2">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowAddMembersDialog(false)}
                                    disabled={saveChangesLoading}
                                >Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSaveChanges}
                                    disabled={saveChangesLoading || (newMembers.length === 0 && removeMembers.length == 0)}
                                >{saveChangesLoading ? 'Saving...' : 'Save changes'}</button>
                            </div>
                        </form>
                    </div>
                </dialog>
            )}

        <h1 className="text-2xl font-bold mb-4">My Groups</h1>
        <button
            className="btn btn-primary mb-6"
            onClick={() => {
                setShowDialog(true); 
                // fetchGroups();
            }}
        >
            Create Group
        </button>

        {showDialog && (
            <dialog open className="modal modal-open">
                <div className="modal-box bg-base-200">
                    <h2 className="font-bold text-lg mb-4">Create Group</h2>
                    <form method="dialog" className="form-control gap-2">
                        <label className="label">Group Name:</label>
                        <input
                            type="text"
                            className="input input-bordered w-full mb-2"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            disabled={creating}
                        />
                        <label className="label">Group Categories:</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                className="input input-bordered flex-1"
                                value={categoryInput}
                                onChange={e => setCategoryInput(e.target.value)}
                                onKeyDown={e => { if (e.key === '+') { e.preventDefault(); handleAddCategory(); } }}
                                ref={categoryInputRef}
                                disabled={creating}
                                placeholder="Type category and press +"
                            />
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleAddCategory}
                                disabled={creating}
                            >+
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {categories.map(cat => (
                                <span key={cat} className="badge badge-outline flex items-center gap-1">
                                    {cat}
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-circle btn-ghost text-error"
                                        onClick={() => handleRemoveCategory(cat)}
                                        disabled={creating}
                                    >✕</button>
                                </span>
                            ))}
                        </div>
                        <div className="modal-action flex gap-2">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowDialog(false)}
                                disabled={creating}
                            >Cancel</button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateGroup}
                                disabled={creating || !newGroupName.trim() || categories.length === 0}
                            >{creating ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </dialog>
        )}

        {groupInfos.length === 0 ? (
            <p>You are not part of any groups.</p>
        ) : (
            <ul className="space-y-4">
                {groupInfos.map(group => (
                    <li key={group.groupid}>
                        <div className="card bg-base-100 shadow-md">
                            <div className="card-body p-4">
                                <h3 className="card-title mb-2">{group.groupname}</h3>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => addMembersToGroup(group.groupid)}>
                                        Manage members
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => router.push(`/group-expense?groupid=${group.groupid}`)}>
                                        Add expense
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
    );
}
