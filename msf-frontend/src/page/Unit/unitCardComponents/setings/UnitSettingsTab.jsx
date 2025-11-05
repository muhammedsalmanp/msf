import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../../store/slices/notificationSlice';
import { setLoading } from '../../../../store/slices/loadingSlice';
import axios from '../../../../api/axiosInstance';
import { Edit3, Save, X, KeySquare, Eye, EyeOff } from 'lucide-react';


const validatePasswordStrength = (password) => {

  if (password.length < 5) {
    return "Password must be at least 5 characters long.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must contain at least one letter.";
  }
  if (/(12345|password|qwerty)/.test(password.toLowerCase())) {
     return "Password is too simple or common.";
  }
  return null; 
};


const UnitSettingsTab = ({ unitId, unitName, unitUsername, dispatch }) => {

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState(unitUsername || '');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const appDispatch = useDispatch();

  const handleUsernameEditToggle = () => {
    if (isEditingUsername) {
      setUsername(unitUsername || ''); 
      setErrors(p => ({...p, username: null})); 
    }
    setIsEditingUsername(!isEditingUsername);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();


    const newErrors = {};

    const usernameRegex = /^[a-zA-Z0-9_]+$/; 

    if (!username) {
      newErrors.username = "Username is required.";
    } else if (!usernameRegex.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores (_).";
    }
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return; 
    }
 

    if (username === unitUsername) {
      setIsEditingUsername(false);
      return;
    }
    appDispatch(setLoading(true));
    try {
      const response = await axios.put(`/unit/username`, { username }); 
      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Username updated successfully!' }));
      setIsEditingUsername(false);

    } catch (err) {
      const message = err.response?.data?.message || 'Could not update username.';
      if (err.response?.status === 400 || err.response?.status === 409) {
        setErrors({ username: message });
      } else {
        appDispatch(showNotification({ type: 'error', message }));
      }
    } finally {
      appDispatch(setLoading(false));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // --- 1. Validation Phase ---
    const newErrors = {}; // Reset errors on each submit

    if (!oldPassword) {
      newErrors.oldPassword = "Old password is required.";
    }
    if (!password) {
      newErrors.password = "New password is required.";
    } else {
      // --- Strength Check ---
      const strengthError = validatePasswordStrength(password);
      if (strengthError) {
        newErrors.password = strengthError;
      }
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password.";
    }

    // Only run these checks if the fields aren't empty
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "New passwords do not match.";
    }
    if (oldPassword && password && oldPassword === password) {
      newErrors.password = "New password must be different from the old one.";
    }

    // --- 2. Update State & Check ---
    setErrors(newErrors);

    // If the newErrors object has any keys, it means there was an error. Stop.
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // --- 3. API Call Phase (if no errors) ---
    appDispatch(setLoading(true));
    try {
      const response = await axios.put(`/unit/password`, { 
        oldPassword, 
        password 
      });

      appDispatch(showNotification({ type: 'success', message: response.data.message || 'Password changed successfully!' }));
      
      setOldPassword(''); 
      setPassword('');
      setConfirmPassword('');
      setErrors({}); // Clear errors on success

    } catch (err) {
      const message = err.response?.data?.message || 'Could not change password.';
      
      // Handle specific backend error for wrong old password
      if (err.response?.status === 401) { // 401 Unauthorized
          setErrors({ oldPassword: "Incorrect old password." });
      } else {
          // Show a general error for other issues
          appDispatch(showNotification({ type: 'error', message }));
      }
    } finally {
      appDispatch(setLoading(false));
    }
  };

  // --- Render ---
  return (
    <div className="space-y-10">

      {/* --- Edit Username Section --- */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Unit Username</h3>
        {/* --- MODIFICATION #2: Updated form layout for error message --- */}
        <form onSubmit={handleUsernameSubmit}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-grow"> {/* Wrapper for input + error */}
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Clear error when user starts typing
                  if (errors.username) setErrors(p => ({...p, username: null}));
                }}
                readOnly={!isEditingUsername}
                // --- MODIFICATION #2: Dynamic error styling ---
                className={`w-full flex-grow px-4 py-2 border rounded-md transition-all ${
                  !isEditingUsername 
                    ? 'border-slate-300 bg-slate-100 text-slate-600' 
                    : (errors.username 
                      ? 'border-red-500 ring-2 ring-red-100' 
                      : 'border-green-400 ring-2 ring-green-100 bg-white')
                }`}
                placeholder="Unit Username"
              />
              {/* --- MODIFICATION #2: Inline Error Message --- */}
              {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
            </div>

            {isEditingUsername ? (
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"><Save size={16} /> Save</button>
                <button type="button" onClick={handleUsernameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition"><X size={16} /></button>
              </div>
            ) : (
              <button type="button" onClick={handleUsernameEditToggle} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200 transition"><Edit3 size={16} /> Edit</button>
            )}
          </div>
        </form>
      </div>

      {/* --- Change Password Section --- */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Change Unit Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          
          {/* --- Old Password Field --- */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="old-password">
              Old Password
            </label>
            <div className="relative">
              <input 
                id="old-password" 
                type={showOldPassword ? "text" : "password"} 
                value={oldPassword} 
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  // Clear error when user starts typing
                  if (errors.oldPassword) setErrors(p => ({...p, oldPassword: null}));
                }}
                // --- Dynamic borders ---
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 pr-10 ${
                  errors.oldPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-slate-300 focus:border-green-400 focus:ring-green-200'
                }`}
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* --- Inline Error Message --- */}
            {errors.oldPassword && <p className="text-red-600 text-sm mt-1">{errors.oldPassword}</p>}
          </div>

          {/* --- New Password Field --- */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="new-password">New Password</label>
            <div className="relative">
              <input 
                id="new-password" 
                type={showNewPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(p => ({...p, password: null}));
                }} 
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 pr-10 ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-slate-300 focus:border-green-400 focus:ring-green-200'
                }`}
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* --- Inline Error Message --- */}
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* --- Confirm New Password Field --- */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="confirm-password">Confirm New Password</label>
            <div className="relative">
              <input 
                id="confirm-password" 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(p => ({...p, confirmPassword: null}));
                }} 
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 pr-10 ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-slate-300 focus:border-green-400 focus:ring-green-200'
                }`}
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* --- Inline Error Message --- */}
            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-sm bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition shadow-sm"><KeySquare size={16} /> Change Password</button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default UnitSettingsTab;