'use client'
import { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabaseClient';
import { useUser } from '@/utils/UserContext'

export default function GroupsPage() {
    const [showDialog, setShowDialog] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [categories, setCategories] = useState([]);
    const [creating, setCreating] = useState(false);
    const categoryInputRef = useRef(null);
    const { username, setUsername } = useUser();
    const [otherUsers, setOtherUsers] = useState([]);
    const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [addMembersLoading, setAddMembersLoading] = useState(false);
    const [groupInfos, setGroupInfos] = useState([]);
    const router = useRouter();

    // Add category to list
    const handleAddCategory = () => {
        const trimmed = categoryInput.trim();
        if (trimmed && !categories.includes(trimmed)) {
            setCategories([...categories, trimmed]);
            setCategoryInput('');
            if (categoryInputRef.current) categoryInputRef.current.focus();
        }
    };

    // Remove category from list
    const handleRemoveCategory = (cat) => {
        setCategories(categories.filter(c => c !== cat));
    };

    // Create group and categories in DB
    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || categories.length === 0) return;
        setCreating(true);
        // Insert into groups, returning groupid
        const { data: groupRows, error: groupErr } = await supabase
            .from('groups')
            .insert([{ groupname: newGroupName.trim(), admin: username }])
            .select('groupid')
            .single();
        if (groupErr || !groupRows) {
            console.log(groupErr)
            setCreating(false);
            alert('Failed to create group');
            return;
        }
        const groupid = groupRows.groupid;
        // No errors, add row to table 'groupmembership' also
        const { error: groupMemErr } = await supabase
            .from('groupmembership')
            .insert([{ groupid: groupid, username : username }])

        if (groupMemErr) {
            console.log(groupMemErr)
            setCreating(false);
            alert('Failed to add group membership details');
            return;
        }

        // Insert categories
        const catRows = categories.map(cat => ({ groupid, groupcategory: cat }));
        const { error: catErr } = await supabase
            .from('groupcategories')
            .insert(catRows);
        setCreating(false);
        setShowDialog(false);
        setNewGroupName('');
        setCategories([]);
        setCategoryInput('');
        if (catErr) {
            alert('Group created, but failed to add categories');
        } else {
            alert('Group created successfully!');
        }
        // Optionally, refresh group list
        window.location.reload();
    };

    // Get groupIDs for this username
    const getGroupIDsForUser = async (username) => {
        const { data, error } = await supabase
            .from('groupmembership')
            .select('groupid')
            .eq('username', username);
        if (error) {
            console.log('error getting group IDs', error);
            return [];
        }else {
            console.log(data)
        };
        return data.map(row => row.groupid);
    };

    // Get group info for groupIDs
    const getGroupsInfo = async (groupIDs) => {
        if (!groupIDs.length) return [];
        const { data, error } = await supabase
            .from('groups')
            .select('groupid, groupname, admin')
            .in('groupid', groupIDs);
        if (error) return [];
        return data;
    };

    // Opens dialog to add members to group
    const addMembersToGroup = async (groupID) => {
        setShowAddMembersDialog(true);
        setSelectedUsers([]);
        // Fetch all users except current
        const { data: users } = await supabase
            .from('users')
            .select('username')
            .neq('username', username);
        setOtherUsers(users || []);
        // Store groupID for dialog actions
        setCurrentAddGroupID(groupID);
    };

    // Add selected users to groupmembership
    const [currentAddGroupID, setCurrentAddGroupID] = useState(null);
    const handleAddUserToSelection = (user) => {
        if (!selectedUsers.includes(user)) setSelectedUsers([...selectedUsers, user]);
    };
    const handleRemoveUserFromSelection = (user) => {
        setSelectedUsers(selectedUsers.filter(u => u !== user));
    };
    const handleAddMembersSubmit = async () => {
        if (!currentAddGroupID || selectedUsers.length === 0) return;
        setAddMembersLoading(true);
        const rows = selectedUsers.map(u => ({ groupid: currentAddGroupID, username: u }));
        const { error } = await supabase.from('groupmembership').insert(rows);
        setAddMembersLoading(false);
        setShowAddMembersDialog(false);
        setSelectedUsers([]);
        setCurrentAddGroupID(null);
        if (error) alert('Failed to add members');
        else alert('Members added!');
        window.location.reload();
    };

    const fetchGroups = async () => {
        if (!username) return;
        const groupIDs = await getGroupIDsForUser(username);
        const infos = await getGroupsInfo(groupIDs);
        setGroupInfos(infos);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="p-6">
            {/* Add Members Dialog */}
            {showAddMembersDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-black p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Add Members</h2>
                        <label className="block mb-2">Select User:</label>
                        <div className="flex gap-2 mb-2">
                            <select
                                className="flex-1 border p-2 rounded"
                                value=""
                                onChange={e => {
                                    if (e.target.value) handleAddUserToSelection(e.target.value);
                                }}
                            >
                                <option value="">Select user</option>
                                {otherUsers.filter(u => !selectedUsers.includes(u.username)).map(u => (
                                    <option key={u.username} value={u.username}>{u.username}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="bg-green-600 text-white px-3 py-1 rounded"
                                onClick={() => {
                                    const select = document.querySelector('select');
                                    if (select && select.value) handleAddUserToSelection(select.value);
                                }}
                                disabled={addMembersLoading}
                            >+
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedUsers.map(user => (
                                <span key={user} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                                    {user}
                                    <button
                                        type="button"
                                        className="ml-1 text-red-500 hover:text-red-700"
                                        onClick={() => handleRemoveUserFromSelection(user)}
                                        disabled={addMembersLoading}
                                    >-</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded border"
                                onClick={() => setShowAddMembersDialog(false)}
                                disabled={addMembersLoading}
                            >Cancel</button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                                onClick={handleAddMembersSubmit}
                                disabled={addMembersLoading || selectedUsers.length === 0}
                            >{addMembersLoading ? 'Adding...' : 'Add members'}</button>
                        </div>
                    </div>
                </div>
            )}

        <h1 className="text-2xl font-bold mb-4">{username}'s Groups</h1>
        <button
            className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
            onClick={() => {
                setShowDialog(true); 
                fetchGroups();}}
        >
            Create Group
        </button>

        {showDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="bg-black p-6 rounded shadow-lg w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Create Group</h2>
                    <label className="block mb-2">Group Name:
                        <input
                            type="text"
                            className="w-full border p-2 rounded mt-1"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            disabled={creating}
                        />
                    </label>
                    <label className="block mb-2">Group Categories:</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            className="flex-1 border p-2 rounded"
                            value={categoryInput}
                            onChange={e => setCategoryInput(e.target.value)}
                            onKeyDown={e => { if (e.key === '+') { e.preventDefault(); handleAddCategory(); } }}
                            ref={categoryInputRef}
                            disabled={creating}
                            placeholder="Type category and press +"
                        />
                        <button
                            type="button"
                            className="bg-green-600 text-white px-3 py-1 rounded"
                            onClick={handleAddCategory}
                            disabled={creating}
                        >+
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map(cat => (
                            <span key={cat} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                                {cat}
                                <button
                                    type="button"
                                    className="ml-1 text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveCategory(cat)}
                                    disabled={creating}
                                >×</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded border"
                            onClick={() => setShowDialog(false)}
                            disabled={creating}
                        >Cancel</button>
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={handleCreateGroup}
                            disabled={creating || !newGroupName.trim() || categories.length === 0}
                        >{creating ? 'Creating...' : 'Create'}</button>
                    </div>
                </div>
            </div>
        )}

        {groupInfos.length === 0 ? (
            <p>You are not part of any groups.</p>
        ) : (
            <ul className="space-y-4">
                {groupInfos.map(group => (
                    <li key={group.groupid} className="border rounded p-4">
                        <div><strong>Group Name:</strong> {group.groupname}</div>
                        <div><strong>Admin:</strong> {group.admin}</div>
                        {/* <div><strong>Group ID:</strong> {group.groupid}</div> */}

                        <button
                            className="bg-purple-600 text-white px-4 py-2 rounded mb-2"
                            onClick={() => addMembersToGroup(group.groupid)}>
                            Add members
                        </button>
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded mb-2 ml-2"
                            onClick={() => router.push(`/group-expense?groupid=${group.groupid}`)}>
                            Add expense
                        </button>
                    </li>
                ))
                }
            </ul>
        )}
    </div>
);
};