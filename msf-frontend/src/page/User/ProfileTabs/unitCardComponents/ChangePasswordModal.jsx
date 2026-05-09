// ChangePasswordModal.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../../../api/axiosInstance";
import { setLoading } from "../../../../Store/slices/loadingSlice";
import { showNotification } from "../../../../Store/slices/notificationSlice";

function ChangePasswordModal({ isOpen, onClose }) {
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!passwords.oldPassword) newErrors.oldPassword = "Old password is required";
    if (!passwords.newPassword) newErrors.newPassword = "New password is required";

    if (passwords.newPassword && passwords.newPassword.length < 6) {
       newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (passwords.newPassword && passwords.newPassword === passwords.oldPassword) {
      newErrors.newPassword = "New password must be different from the old password";
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(setLoading(true));
    try {
      const res = await axiosInstance.put("/user/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });

      dispatch(
        showNotification({ type: "success", message: res.data.message })
      );
      onClose(); // Close modal on success
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Reset fields

    } catch (error) {
      console.error("Password change error:", error);
      dispatch(
        showNotification({
          type: "error",
          message: error.response?.data?.message || "Failed to change password",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen) return null;

  return (
    // Modal Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium">Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={passwords.oldPassword}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.oldPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.oldPassword && <p className="text-red-500 text-xs mt-1">{errors.oldPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;