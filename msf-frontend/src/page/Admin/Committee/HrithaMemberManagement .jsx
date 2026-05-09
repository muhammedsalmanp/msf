import React, { useEffect, useState } from "react";
import axios from "../../../api/axiosInstance";
import {
  FaPlus,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaKey,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showNotification } from "../../../Store/slices/notificationSlice";
import { setLoading } from "../../../Store/slices/loadingSlice";

const HarithaMemberManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [members, setMembers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  // --- REMOVED alreadyAssignedUnits STATE ---
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewUnits, setViewUnits] = useState([]);

  // --- State for Password Modal ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- NEW: State for Delete Modal ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  // ---------------------------------

  const fetchMembers = async () => {
    dispatch(setLoading(true));
    try {
      // --- UPDATED to fetch Haritha members ---
      const res = await axios.get("/admin/hritha-members");
      setMembers(res.data || []);
    } catch (error) {
      console.error("Error fetching members", error);
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to fetch members.",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchUnits = async () => {
    // Note: setLoading is handled by the function that calls this (handleAssignUnit)
    try {
      const response = await axios.get("/auth/units");
      setUnits(response.data || []);
    } catch (error) {
      console.error("Error fetching units", error);
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to fetch units.",
        })
      );
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Assign In-Charge Functions (from MemberManagement) ---
  const handleAssignUnit = async (user) => {
    dispatch(setLoading(true));
    try {
      setSelectedUser(user._id);
      await fetchUnits();
      const assignedUnitIds = user.inChargeOfUnits?.map((u) => u._id) || [];
      setSelectedUnits(assignedUnitIds);
      setIsAssignModalOpen(true);
    } catch (error) {
      console.error("Error preparing unit assignment:", error);
      dispatch(
        showNotification({
          type: "error",
          message: "Could not load unit assignment modal.",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCheckboxChange = (unitId) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleApply = async () => {
    dispatch(setLoading(true));
    try {
      // --- UPDATED: Use axios.put to replace the list ---
      await axios.put(`/admin/members/${selectedUser}/assign-units`, {
        units: selectedUnits,
      });

      dispatch(
        showNotification({
          type: "success",
          message: "In-charge units updated successfully!",
        })
      );
      setIsAssignModalOpen(false);
      setSelectedUnits([]);
      fetchMembers(); // This will trigger its own loading spinner
    } catch (error) {
      console.error("Failed to assign units:", error);
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to update in-charge units. Please try again.",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setIsAssignModalOpen(false);
    setSelectedUnits([]);
  };

  // --- View In-Charge Functions ---
  const handleViewInChargeUnits = (units) => {
    setViewUnits(units);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewUnits([]);
  };

  // --- Edit Function ---
  const handleEdit = (member) => {
    navigate(`/admin/edit-member/${member._id}`);
  };

  // --- NEW: Delete Modal Functions ---
  const openDeleteModal = (memberId) => {
    setSelectedUserForDelete(memberId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUserForDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!selectedUserForDelete) return;

    dispatch(setLoading(true));
    try {
      await axios.delete(`/admin/members/${selectedUserForDelete}`);
      dispatch(
        showNotification({
          type: "success",
          message: "Member deleted successfully.",
        })
      );
      fetchMembers(); // Refresh the member list
    } catch (err) {
      console.error("Failed to delete user:", err);
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to delete member. They may be linked to other data.",
        })
      );
    } finally {
      closeDeleteModal();
      dispatch(setLoading(false));
    }
  };
  // ---------------------------------

  // --- Password Modal Functions ---
  const openPasswordModal = (userId) => {
    setSelectedUserForPassword(userId);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setSelectedUserForPassword(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = async () => {
    if (!password || !confirmPassword) {
      return dispatch(
        showNotification({
          type: "warning",
          message: "Please fill in both password fields.",
        })
      );
    }
    if (password !== confirmPassword) {
      return dispatch(
        showNotification({
          type: "warning",
          message: "Passwords do not match.",
        })
      );
    }

    dispatch(setLoading(true));
    try {
      await axios.patch(`/admin/members/${selectedUserForPassword}/password`, {
        password,
      });
      dispatch(
        showNotification({
          type: "success",
          message: "Password updated successfully!",
        })
      );
      closePasswordModal();
    } catch (err) {
      console.error("Failed to update password:", err);
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to update password.",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };
  // ---------------------------------

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* --- UPDATED: Title --- */}
        <h2 className="text-3xl font-bold text-gray-800">
          Haritha Member Management
        </h2>
        <Link
          to="/admin/add-member" // This link was correct in both files
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md shadow hover:bg-blue-700 flex items-center gap-2 transition"
        >
          <FaPlus className="text-white" /> Add Member
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
          {/* --- UPDATED: Table Head to match HarithaMemberManagement --- */}
          <thead className="bg-gray-200 text-sm text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Gender</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Roles</th>
              <th className="p-4 text-left">In-Charge</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                {/* --- UPDATED: colSpan to 7 --- */}
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m._id}
                  className="border-t even:bg-gray-50 hover:bg-gray-100 text-sm transition"
                >
                  <td className="p-4 flex items-center gap-3">
                    {m.profileImage && (
                      <img
                        src={m.profileImage}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                    )}
                    <span className="font-medium text-gray-800">{m.name}</span>
                  </td>
                  <td className="p-4 capitalize">{m.gender}</td>
                  {/* --- UPDATED: Using m.phone --- */}
                  <td className="p-4">{m.username}</td>
                  <td className="p-4">
                    {m.roles
                      ?.filter((r) => r.scope === "main")
                      .map((r, i) => (
                        <div key={i} className="text-sm text-gray-700">
                          {r.role?.title}
                        </div>
                      ))}
                  </td>
                  <td className="p-4">
                    {m.inChargeOfUnits?.length > 0 ? (
                      <>
                        {m.inChargeOfUnits.slice(0, 2).map((u, i) => (
                          <div key={i} className="text-xs text-gray-600">
                            {u.name}
                          </div>
                        ))}
                        {m.inChargeOfUnits.length > 2 && (
                          <button
                            onClick={() =>
                              handleViewInChargeUnits(m.inChargeOfUnits)
                            }
                            className="text-xs text-blue-600 hover:underline mt-1"
                          >
                            View All In-Charge Units
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {/* --- UPDATED: Added Status Column --- */}
                  <td className="p-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        m.isVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  {/* --- UPDATED: Actions from MemberManagement --- */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAssignUnit(m)}
                        title="Add In-Charge"
                        className="p-2 rounded-full text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition"
                      >
                        <FaUserPlus size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(m)}
                        title="Edit"
                        className="p-2 rounded-full text-green-600 hover:bg-green-100 hover:text-green-800 transition"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => openPasswordModal(m._id)}
                        title="Change Password"
                        className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800 transition"
                      >
                        <FaKey size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(m._id)}
                        title="Delete"
                        className="p-2 rounded-full text-red-600 hover:bg-red-100 hover:text-red-800 transition"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- ALL MODALS (Copied from MemberManagement) --- */}

      {/* Assign In-Charge Modal (Now uses PUT logic) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Assign Unit In-Charge
            </h3>
            <div className="max-h-60 overflow-y-auto border rounded-md p-3">
              {units.length > 0 ? (
                units.map((unit) => (
                  <label
                    key={unit._id}
                    className="flex items-center justify-between border-b py-2 cursor-pointer"
                  >
                    <span className="text-gray-700">{unit.name}</span>
                    {/* --- UPDATED: Removed disabled logic --- */}
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(unit._id)}
                      onChange={() => handleCheckboxChange(unit._id)}
                      className="w-4 h-4"
                    />
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-center py-3">
                  No available units.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All In-Charge Units Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              In-Charge Units
            </h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {viewUnits.map((u, i) => (
                <li
                  key={i}
                  className="border-b pb-1 text-gray-700 text-sm font-medium"
                >
                  {u.name}
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-5">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (Typos fixed) */}
     {/* Change Password Modal (Fixed typo) */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                // --- THIS IS THE CORRECTED LINE ---
                onChange={(e) => setConfirmPassword(e.target.value)}
                // ------------------------------------
                className="border p-2 rounded w-full"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: Delete Confirmation Modal --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this member? This will remove them
              from all committees and delete their data permanently.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarithaMemberManagement;