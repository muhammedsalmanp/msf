import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../../../store/slices/notificationSlice';
import { setLoading } from '../../../../../store/slices/loadingSlice';
import axios from "../../../../../api/axiosInstance"; // <-- IMPORT AXIOS
import { Edit3, Save, X, KeySquare, Shield, RefreshCcw } from 'lucide-react';

// This component now handles name, username, password, and admin defaults
const UnitSettingsTab = ({ unitId, unitName, unitUsername, dispatch }) => {
  // State for editing the name
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(unitName || '');

  // --- NEW: State for editing the username ---
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState(unitUsername || '');

  // State for CHANGING the password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- NEW: State for setting ADMIN DEFAULTS ---
  const [defaultUsername, setDefaultUsername] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');


  // Helper for showing notifications
  const appDispatch = useDispatch();

  // --- Handlers for Name Change ---
  const handleNameEditToggle = () => {
    if (isEditingName) setName(unitName); // Reset on cancel
    setIsEditingName(!isEditingName);
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (name === unitName || !name) {
      setIsEditingName(false);
      return;
    }
    appDispatch(setLoading(true));
    try {
      // --- API CALL 1: Update Unit Name ---
      const response = await axios.put(`/admin/units/${unitId}/name`, { name }); // <-- UNCOMMENTED

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Unit name updated successfully!' }));
      setIsEditingName(false);
      // TODO: You will need to refresh the parent component's unit data here
      // (e.g., call a 'refetchUnitDetails' function passed from UnitCard)

    } catch (err) {
      const message = err.response?.data?.message || 'Could not update name.';
      appDispatch(showNotification({ type: 'error', message }));
    } finally {
      appDispatch(setLoading(false));
    }
  };

  // --- NEW: Handlers for Username Change ---
  const handleUsernameEditToggle = () => {
    if (isEditingUsername) setUsername(unitUsername || ''); // Reset on cancel
    setIsEditingUsername(!isEditingUsername);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (username === unitUsername || !username) {
      setIsEditingUsername(false);
      return;
    }
    appDispatch(setLoading(true));
    try {
      // --- API CALL 2: Update Unit Username ---
      const response = await axios.put(`/admin/units/${unitId}/username`, { username }); // <-- UNCOMMENTED

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Username updated successfully!' }));
      setIsEditingUsername(false);
      // TODO: You will need to refresh the parent component's unit data here
      // (e.g., call a 'refetchUnitDetails' function passed from UnitCard)

    } catch (err) {
      const message = err.response?.data?.message || 'Could not update username.';
      appDispatch(showNotification({ type: 'error', message }));
    } finally {
      appDispatch(setLoading(false));
    }
  };


  // --- Handler for CHANGING the current password ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      appDispatch(showNotification({ type: 'error', message: 'Please fill in both password fields.' }));
      return;
    }
    if (password !== confirmPassword) {
      appDispatch(showNotification({ type: 'error', message: 'Passwords do not match.' }));
      return;
    }

    appDispatch(setLoading(true));
    try {
      // --- API CALL 3: Change Current Password ---
      const response = await axios.put(`/admin/units/${unitId}/password`, { password }); // <-- UNCOMMENTED

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Password changed successfully!' }));
      setPassword('');
      setConfirmPassword('');

    } catch (err) {
      const message = err.response?.data?.message || 'Could not change password.';
      appDispatch(showNotification({ type: 'error', message }));
    } finally {
      appDispatch(setLoading(false));
    }
  };

  // --- NEW: Handler for SETTING Admin Defaults ---
  const handleSetDefaults = async (e) => {
    e.preventDefault();
    if (!defaultUsername || !defaultPassword) {
      appDispatch(showNotification({ type: 'error', message: 'Please provide both a default username and password.' }));
      return;
    }
    appDispatch(setLoading(true));
    try {
      // --- API CALL 4: Set Admin Default Credentials ---
      const response = await axios.put(`/admin/units/${unitId}/default-credentials`, { // <-- UNCOMMENTED
        username: defaultUsername,
        password: defaultPassword
      });

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Default credentials set!' }));
      setDefaultUsername('');
      setDefaultPassword('');

    } catch (err) {
      const message = err.response?.data?.message || 'Could not set defaults.';
      appDispatch(showNotification({ type: 'error', message }));
    } finally {
      appDispatch(setLoading(false));
    }
  };

  // --- NEW: Handler for RESETTING unit to defaults ---
  const handleResetToDefaults = async () => {
    // Confirmation dialog
    if (!window.confirm("Are you sure? This will overwrite the unit's current username and password with the admin defaults.")) {
      return;
    }

    appDispatch(setLoading(true));
    try {
      // --- API CALL 5: Reset to Defaults ---
      const response = await axios.post(`/admin/units/${unitId}/reset-credentials`); // <-- UNCOMMENTED

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Unit credentials have been reset to default!' }));
      // TODO: You must refresh the parent data here to see the change
      // (e.g., call a 'refetchUnitDetails' function passed from UnitCard)

    } catch (err) {
      const message = err.response?.data?.message || 'Could not reset credentials.';
      appDispatch(showNotification({ type: 'error', message }));
    } finally {
      appDispatch(setLoading(false));
    }
  };


  // --- Render ---
  return (
    <div className="space-y-10">

      {/* --- Edit Name Section --- */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Unit Name</h3>
        <form onSubmit={handleNameSubmit} className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!isEditingName}
            className={`flex-grow px-4 py-2 border rounded-md transition-all ${isEditingName ? 'border-green-400 ring-2 ring-green-100 bg-white' : 'border-slate-300 bg-slate-100 text-slate-600'}`}
            placeholder="Unit Name"
          />
          {isEditingName ? (
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"><Save size={16} /> Save</button>
              <button type="button" onClick={handleNameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition"><X size={16} /></button>
            </div>
          ) : (
            <button type="button" onClick={handleNameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 transition"><Edit3 size={16} /> Edit</button>
          )}
        </form>
      </div>

      {/* --- NEW: Edit Username Section --- */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Unit Username</h3>
        <form onSubmit={handleUsernameSubmit} className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            readOnly={!isEditingUsername}
            className={`flex-grow px-4 py-2 border rounded-md transition-all ${isEditingUsername ? 'border-green-400 ring-2 ring-green-100 bg-white' : 'border-slate-300 bg-slate-100 text-slate-600'}`}
            placeholder="Unit Username"
          />
          {isEditingUsername ? (
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"><Save size={16} /> Save</button>
              <button type="button" onClick={handleUsernameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition"><X size={16} /></button>
            </div>
          ) : (
            <button type="button" onClick={handleUsernameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 transition"><Edit3 size={16} /> Edit</button>
          )}
        </form>
      </div>

      {/* --- RENAMED: Change Password Section --- */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Change Unit Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="new-password">New Password</label>
            <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="confirm-password">Confirm New Password</label>
            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400" placeholder="••••••••" />
          </div>
          <div className="pt-2">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition shadow-sm"><KeySquare size={16} /> Change Password</button>
          </div>
        </form>
      </div>

      {/* --- NEW: Admin Actions Section --- */}
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-red-800 mb-1 flex items-center gap-2"><Shield size={20} /> Admin Actions</h3>
        <p className="text-sm text-red-700 mb-4">These actions are for setting and resetting the unit's default credentials.</p>

        {/* Form to SET defaults */}
        <form onSubmit={handleSetDefaults} className="space-y-4 mb-6 pb-6 border-b border-red-200">
          <h4 className="text-lg font-semibold text-slate-800">Set/Update Default Credentials</h4>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="default-username">Default Username</label>
            <input id="default-username" type="text" value={defaultUsername} onChange={(e) => setDefaultUsername(e.target.value)} className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Default admin-set username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="default-password">Default Password</label>
            <input id="default-password" type="password" value={defaultPassword} onChange={(e) => setDefaultPassword(e.target.value)} className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-200 focus:border-red-400" placeholder="Default admin-set password" />
          </div>
          <div className="pt-2">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition shadow-sm"><Save size={16} /> Set Defaults</button>
          </div>
        </form>

        {/* Button to RESET to defaults */}
        <div>
          <h4 className="text-lg font-semibold text-slate-800">Reset Unit Credentials</h4>
          <p className="text-sm text-slate-600 mb-3 max-w-prose">This will overwrite the unit's current username and password with the defaults you set above. This action cannot be undone.</p>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition shadow-sm"
            >
            <RefreshCcw size={16} /> Reset Unit to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitSettingsTab;