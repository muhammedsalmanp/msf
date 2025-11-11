import React, { useEffect, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { ArrowLeft, PlusCircle, UserPlus, Trash2 } from "lucide-react";
import { ClipLoader } from "react-spinners";

const EditCommitteee = ({ unitId, committeeType, onBack }) => {
  const [users, setUsers] =  useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // This endpoint should return all users belonging to the unit
        const res = await axios.get(`/admin/units/${unitId}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [unitId]);

  return (
    <div className="bg-slate-50 font-sans  p-4 sm:p-6  lg:p-8 mb-10">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline mb-2">
              <ArrowLeft size={18} />
              Back to Unit Details
            </button>
            <h2 className="text-3xl font-bold text-slate-800">
              Edit {committeeType === "haritha" ? "Haritha" : "MSF"} Committee
            </h2>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full sm:w-auto">
            <PlusCircle size={20} />
            Add New Member
          </button>
        </div>

        {/* Users Table / List */}
        <div className="overflow-x-auto">
          <div className="min-w-full bg-white border border-slate-200 rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-3 sm:grid-cols-4 bg-slate-50 p-4 font-semibold text-slate-600 text-sm border-b">
              <div className="col-span-2 sm:col-span-2">USER</div>
              <div className="hidden sm:block text-center">CURRENT ROLE</div>
              <div className="text-right">ACTIONS</div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="flex justify-center p-10"><ClipLoader color="#16a34a" /></div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div key={user._id} className="grid grid-cols-3 sm:grid-cols-4 items-center p-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition">
                  {/* User Info */}
                  <div className="col-span-2 sm:col-span-2 flex items-center gap-4">
                    <img
                      src={user.profileImage || `https://api.dicebear.com/8.x/avatar/svg?seed=${user.name}`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-slate-800">{user.name}</h4>
                      <p className="text-slate-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  {/* Current Role */}
                  <div className="hidden sm:block text-center text-slate-500 text-sm">
                    {/* You'll need logic to display the user's current role in this committee */}
                    President
                  </div>
                  {/* Actions */}
                  <div className="flex justify-end items-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Assign Role">
                      <UserPlus size={18} />
                    </button>
                    <button className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 col-span-full text-center p-10">
                No users found in this unit.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCommitteee;