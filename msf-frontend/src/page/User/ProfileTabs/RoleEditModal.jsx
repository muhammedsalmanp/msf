import React, { useState } from 'react';
// Use the same CSS as the other modal for a consistent look
import './CommitteeMemberModal.css';

// We need the same list of roles here
const COMMITTEE_ROLES = [
    { name: 'President', value: 'president' },
    { name: 'Secretary', value: 'secretary' },
    { name: 'Treasurer', value: 'treasurer' },
    { name: 'Vice President', value: 'vicePresidents' },
    { name: 'Joint Secretary', value: 'jointSecretaries' },
];

const RoleEditModal = ({ isOpen, onClose, onSave, member }) => {
    // The member prop should contain their current role key, e.g., 'president'
    const [newRole, setNewRole] = useState(member?.roleKey || '');

    if (!isOpen || !member) return null;

    const handleSave = () => {
        // Pass the member's ID and the new role's key (e.g., 'president') back to the parent
        onSave(member._id, newRole);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Change Role</h2>
                
                {/* Member Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg mb-6">
                    <img 
                        src={member.profileImage || `https://ui-avatars.com/api/?name=${member.name.replace(' ', '+')}&background=random`} 
                        alt={member.name} 
                        className="h-16 w-16 rounded-full object-cover" 
                    />
                    <div>
                        <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">Current Role: <span className="font-medium text-slate-700">{member.role}</span></p>
                    </div>
                </div>

                {/* Role Selector */}
                <label htmlFor="role-select" className="block mb-2 font-semibold text-slate-700">New Role</label>
                <select 
                    id="role-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                    <option value="" disabled>Select a new role</option>
                    {COMMITTEE_ROLES.map(role => (
                        <option key={role.value} value={role.value}>{role.name}</option>
                    ))}
                </select>

                {/* Actions */}
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
                    <button type="button" onClick={handleSave} className="btn-save">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default RoleEditModal;