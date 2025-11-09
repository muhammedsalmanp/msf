import React, { useState, useEffect } from "react";
import axios from "../../../api/axiosInstance";
import LeaderCard from "../../Admin/AdminComponents/LeaderCard";
import { FaCircle } from "react-icons/fa";

const CommitteeListing = ({ unitId, committeeType, user }) => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    gender: "",
    role: "",
    profileImage: null,
  });

  useEffect(() => {
    const fetchCommittee = async () => {
      if (!unitId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/admin/units/${unitId}`);
        setUnit(res.data);
      } catch (err) {
        setError("Error loading committee details");
      } finally {
        setLoading(false);
      }
    };
    fetchCommittee();
  }, [unitId]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`/user/units/${unitId}/users`);
      let filteredUsers = res.data;

      if (committeeType === "msf") {
        filteredUsers = filteredUsers.filter(
          (u) => u.committeeType === "msf" || !u.committeeType
        );
      } else if (committeeType === "haritha") {
        filteredUsers = filteredUsers.filter(
          (u) => u.committeeType === "haritha" || !u.committeeType
        );
      }

      setUsers(filteredUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newMember.name);
      formData.append("phone", newMember.phone);
      formData.append("gender", newMember.gender);
      formData.append("role", newMember.role);
      formData.append("committeeType", committeeType);
      formData.append("unitId", unitId);

      if (newMember.profileImage) {
        formData.append("profileImage", newMember.profileImage);
      }

      await axios.post("/user/add-member", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowAddModal(false);
      setNewMember({ name: "", phone: "", gender: "", role: "", profileImage: null });
      fetchUsers();
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  if (loading) return <div className="text-center py-6">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;
  if (!unit) return <div className="text-center py-6">No data found</div>;

  const committee =
    committeeType === "haritha" ? unit.harithaCommittee : unit.msfCommittee;

  if (!committee)
    return (
      <div className="text-center text-gray-500 py-6">
        No {committeeType === "haritha" ? "Haritha" : "MSF"} Committee found
      </div>
    );

  const isMainRole =
    user &&
    (committee?.president?._id === user._id ||
      committee?.secretary?._id === user._id ||
      committee?.treasurer?._id === user._id);

  const renderPlaceholder = (position) => (
    <div className="w-36 h-36 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-600">
      <span className="font-semibold">{position}</span>
      <span className="text-sm text-gray-400 mt-1">Vacant</span>
    </div>
  );

  const getUserRole = (u) => {
    if (!committee) return "Member";
    if (committee.president?._id === u._id) return "President";
    if (committee.secretary?._id === u._id) return "Secretary";
    if (committee.treasurer?._id === u._id) return "Treasurer";
    if (committee.vicePresidents?.some((vp) => vp._id === u._id))
      return "Vice President";
    if (committee.jointSecretaries?.some((js) => js._id === u._id))
      return "Joint Secretary";
    return "Member";
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-10 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-700">
          {committeeType === "haritha" ? "Haritha Committee" : "MSF Committee"}
        </h2>

        {isMainRole && (
          <div className="flex gap-3">
            {showEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ➕ Add New Member
              </button>
            )}
            <button
              onClick={() => {
                setShowEdit(!showEdit);
                if (!showEdit) fetchUsers();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showEdit ? "Close Edit" : "Edit Committee"}
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg relative">
            <h3 className="text-lg font-semibold mb-4 text-center">Add New Member</h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <form onSubmit={handleAddMember} className="flex flex-col gap-3">
              <div className="flex flex-col items-center">
                <img
                  src={
                    newMember.profileImage
                      ? URL.createObjectURL(newMember.profileImage)
                      : "/default-profile.jpg"
                  }
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover mb-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      profileImage: e.target.files[0],
                    })
                  }
                  className="text-sm"
                />
              </div>

              <input
                type="text"
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="border p-2 rounded"
                required
              />

              <select
                value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Role</option>
                <option value="President">President</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Vice President">Vice President</option>
                <option value="Joint Secretary">Joint Secretary</option>
                <option value="Member">Member</option>
              </select>

              <button
                type="submit"
                className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table or Committee View */}
      {showEdit ? (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="px-4 py-2 border">Image</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="border-b text-center">
                    <td className="px-4 py-2 border">
                      <img
                        src={u.profileImage || "/default-profile.jpg"}
                        alt={u.name}
                        className="w-10 h-10 rounded-full mx-auto object-cover"
                      />
                    </td>
                    <td className="px-4 py-2 border">{u.name}</td>
                    <td className="px-4 py-2 border">{getUserRole(u)}</td>
                    <td className="px-4 py-2 border">
                      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-2 border text-gray-500" colSpan={4}>
                    No users found in this unit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="text-center my-8 flex flex-col sm:flex-row justify-center lg:gap-8 gap-6">
            {committee.president ? (
              <LeaderCard {...committee.president} position="President" />
            ) : (
              renderPlaceholder("President")
            )}
            {committee.secretary ? (
              <LeaderCard {...committee.secretary} position="Secretary" />
            ) : (
              renderPlaceholder("Secretary")
            )}
            {committee.treasurer ? (
              <LeaderCard {...committee.treasurer} position="Treasurer" />
            ) : (
              renderPlaceholder("Treasurer")
            )}
          </div>

          {committee.vicePresidents?.length > 0 && (
            <div className="my-8">
              <h3 className="text-green-700 font-semibold text-lg text-center mb-4">
                Vice Presidents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {committee.vicePresidents.map((vp) => (
                  <div key={vp._id} className="flex items-center space-x-2 pl-4">
                    <FaCircle className="w-4 h-4 text-green-600" />
                    <span>{vp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {committee.jointSecretaries?.length > 0 && (
            <div className="my-8">


              
              <h3 className="text-green-700 font-semibold text-lg text-center mb-4">
                Joint Secretaries
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {committee.jointSecretaries.map((js) => (
                  <div key={js._id} className="flex items-center space-x-2 pl-4">
                    <FaCircle className="w-4 h-4 text-green-600" />
                    <span>{js.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommitteeListing;
