import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import axios from "../../../api/axiosInstance";
import { showNotification } from "../../../Store/slices/notificationSlice";
import { setLoading } from "../../../Store/slices/loadingSlice";
import { useDispatch } from "react-redux";

const rolesList = [
  "President",
  "Secretary",
  "Treasurer",
  "Vice President",
  "Joint Secretary",
  "Member",
];

const ChangeRoleModal = ({
  member,
  unitId,
  committeeType,
  onClose,
  onSubmit,
}) => {
  const dispatch = useDispatch();
  const currentRole =
    member.roles && member.roles.length > 0 && member.roles[0].role
      ? member.roles[0].role.title
      : "Member";
      
  const [newRole, setNewRole] = useState(currentRole);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmClick = () => {
    if (newRole === currentRole) {
      dispatch(
        showNotification({
          type: "info",
          message: "You haven't selected a new role.",
        })
      );
      return;
    }
    setShowConfirm(true);
  };

  const executeRoleChange = async () => {
    dispatch(setLoading(true));
    try {
      const res = await axios.put(`/user/change-role/${member._id}`, {
        unitId,
        committeeType,
        newRole, // Send the new role title
      });

      dispatch(
        showNotification({
          type: "success",
          message: "Role updated successfully!",
        })
      );
      onSubmit(res.data.user); // Pass the updated user back
      onClose(); // Close the modal
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update role.";
      dispatch(
        showNotification({
          type: "error",
          message: errorMessage,
        })
      );
    } finally {
      dispatch(setLoading(false));
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition">
      {/* Main Modal Content */}
      {!showConfirm ? (
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full transform scale-100 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Change Role for {member.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={22} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Role
              </label>
              <input
                type="text"
                disabled
                value={currentRole}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClick}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Change Role
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Confirmation Dialog
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center transform scale-100 transition-transform">
           <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Are you sure?
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Do you want to change {member.name}'s role from{" "}
            <strong>{currentRole}</strong> to <strong>{newRole}</strong>?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={executeRoleChange}
              className="px-4 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition"
            >
              Yes, Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeRoleModal;