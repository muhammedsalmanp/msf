import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import axios from "../../../../api/axiosInstance";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal"; 
import ChangeRoleModal from "./ChangeRoleModal"; 
import { useDispatch } from "react-redux";
import { showNotification } from "../../../../Store/slices/notificationSlice";
import { setLoading } from "../../../../Store/slices/loadingSlice";

const EditCommittee = ({ unitId, committeeType, members, onBack }) => {
  const [committeeMembers, setCommitteeMembers] = useState(members || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedMember, setSelectedMember] = useState(null); 

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    open: false,
    member: null,
  });

   const dispatch = useDispatch();

  useEffect(() => {
    setCommitteeMembers(members || []);
  }, [members]);

  const handleAddUserClick = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (member) => {
    setMemberToEdit(member);
    setIsEditModalOpen(true);
  };

  const handleChangeRoleClick = (member) => {
    setMemberToChangeRole(member);
    setIsChangeRoleModalOpen(true);
  };


  const openDeleteConfirm = (member) => {
    setConfirmDeleteModal({ open: true, member });
  };

  const handleDeleteMember = async () => {
    if (!confirmDeleteModal.member) return;
    const memberId = confirmDeleteModal.member._id;

    dispatch(setLoading(true)); 
    try {
  
      await axios.delete(`/unit/delete/${memberId}`);


      setCommitteeMembers((prev) => prev.filter((m) => m._id !== memberId));
      setConfirmDeleteModal({ open: false, member: null });
      
      dispatch(showNotification({ 
        type: 'success',
        message: 'Member deleted successfully!'
      }));

    } catch (err) {
      console.error("Error deleting member:", err);
      dispatch(showNotification({ // ✅ Show error
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete member.'
      }));
    } finally {
      dispatch(setLoading(false)); // ✅ Hide loader
      setConfirmDeleteModal({ open: false, member: null }); // Ensure modal closes
    }
  };


  return (
    <div className="max-w-5xl mx-auto mt-30 mb-20  lg:bg-white lg:rounded-xl lg:shadow-lg p-6 sm:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Edit {committeeType === "haritha" ? "Haritha" : "MSF"} Committee
          </h2>
          <p className="text-slate-500 mt-1">
            Manage member roles and add new users.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          ← Back to Unit Details
        </button>
      </div>

      {/* Action bar */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddUserClick}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
        >
          <PlusCircle size={18} />
          Add User
        </button>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking.
              wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {committeeMembers.length > 0 ? (
              committeeMembers.map((member) => (
                <tr key={member._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.profileImage ||
                          `https://ui-avatars.com/api/?name=${member.name.replace(
                            " ",
                            "+"
                          )}&background=random`
                        }
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {member.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.roles &&
                        member.roles.length > 0 &&
                        member.roles[0].role
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {member.roles &&
                      member.roles.length > 0 &&
                      member.roles[0].role
                        ? member.roles[0].role.title
                        : "Not Assigned"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-4">
                      {/* Edit */}
                      <button
                        title="Edit Member"
                        onClick={() => handleEditClick(member)}
                        className="text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* ✅ Change Role */}
                      <button
                        title="Change Role"
                        onClick={() => handleChangeRoleClick(member)}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <RefreshCw size={18} />
                      </button>

                      {/* ✅ Delete */}
                      <button
                        title="Delete Member"
                        onClick={() => openDeleteConfirm(member)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-12 px-4">
                  <h3 className="text-lg font-medium text-slate-700">
                    No Members Found
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Click the "Add User" button to start building the committee.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <AddUserModal
          onClose={() => setIsModalOpen(false)}
          unitId={unitId}
          committeeType={committeeType}
          onSubmit={(newUser) => {
            setCommitteeMembers([...committeeMembers, newUser]);
            setIsModalOpen(false); // Close modal on submit
          }}
        />
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && memberToEdit && (
        <EditUserModal
          onClose={() => {
            setIsEditModalOpen(false);
            setMemberToEdit(null);
          }}
          memberToEdit={memberToEdit}
          unitId={unitId}
          committeeType={committeeType}
          onSubmit={(updatedUser) => {
            setCommitteeMembers((prev) =>
              prev.map((m) => (m._id === updatedUser._id ? updatedUser : m))
            );
            setIsEditModalOpen(false);
            setMemberToEdit(null);
          }}
        />
      )}

      {/* ✅ Change Role Modal */}
      {isChangeRoleModalOpen && memberToChangeRole && (
        <ChangeRoleModal
          member={memberToChangeRole}
          unitId={unitId}
          committeeType={committeeType}
          onClose={() => {
            setIsChangeRoleModalOpen(false);
            setMemberToChangeRole(null);
          }}
          onSubmit={(updatedUser) => {
            setCommitteeMembers((prev) =>
              prev.map((m) => (m._id === updatedUser._id ? updatedUser : m))
            );
            setIsChangeRoleModalOpen(false);
            setMemberToChangeRole(null);
          }}
        />
      )}

      {/* ✅ Delete Confirmation Modal */}
      {confirmDeleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center transform scale-100 transition-transform">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Do you want to delete this member?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  setConfirmDeleteModal({ open: false, member: null })
                }
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="px-4 py-2 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCommittee;