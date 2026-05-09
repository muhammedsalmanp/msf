
import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useDispatch } from "react-redux";
import { setLoading } from "../../Store/slices/loadingSlice";
import { showNotification } from "../../Store/slices/notificationSlice";

import ProfileTab from "./ProfileTabs/ProfileTab";
import InChargeTab from "./ProfileTabs/InChargeTab";

import {
  FaUser,
  FaTasks,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

// --- RoleBadges Component (Unchanged) ---
const RoleBadges = ({ roles, unitName }) => {
  if (!roles || roles.length === 0) {
    return (
      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
        Member
      </span>
    );
  }

  return roles.map((r, i) => {
    let label = r.roleTitle;
    if (r.scope === "unit") label = `${r.roleTitle} - ${unitName || ""}`;
    if (r.scope === "main") label = `${r.roleTitle} - Panchayath`;
    if (r.scope === "haritha") label = `${r.roleTitle} - Haritha`;

    return (
      <span
        key={i}
        className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full"
      >
        {label}
      </span>
    );
  });
};

// --- TabContent Component (Unchanged) ---
const TabContent = ({ activeTab, user, setUser }) => {
  if (activeTab === "Profile") {
    return <ProfileTab user={user} setUser={setUser} />;
  }
  if (activeTab === "In-Charge") {
    return <InChargeTab />;
  }

  // --- This is the desktop-only "empty" state ---
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] text-center text-gray-500">
      <img
        src="/path/to/welcome-icon.svg" // Example: Add a welcome graphic
        alt="Welcome"
        className="w-32 h-32 mb-4"
      />
      <h3 className="text-2xl font-semibold text-gray-800">
        Welcome, {user.name}
      </h3>
      <p className="mt-2 max-w-xs">
        Select an option from the menu on the left to view or manage your
        details.
      </p>
    </div>
  );
};

// --- Main UserProfile Component ---
function UserProfile() {
  const [activeTab, setActiveTab] = useState(null); // Default state is still null
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      dispatch(setLoading(true));
      try {
        const res = await axiosInstance.get("/user/profile");
        setUser(res.data.profile);

        // --- CHANGED (Request 1) ---
        // After successfully fetching the profile, check if we are on desktop.
        // If so, set the default active tab to "Profile".
        // This avoids the "welcome" message on desktop load.
        if (window.innerWidth >= 1024) { // 1024px is Tailwind's 'lg' breakpoint
          setActiveTab("Profile");
        }

      } catch (err) {
        dispatch(
          showNotification({ type: "error", message: "Failed to fetch profile" })
        );
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchProfile();
  }, [dispatch]); // Logic unchanged

  // --- Loading State (Unchanged) ---
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  // --- List of tabs with new Icon data (Unchanged) ---
  const tabs = [
    { name: "Profile", icon: <FaUser /> },
    { name: "In-Charge", icon: <FaTasks /> },
  ];

  return (
    <div className="min-h-screen mt-20">

      <div className="hidden lg:flex max-w-7xl mx-auto w-full gap-8 py-10 px-4">

        <nav className="w-1/4 xl:w-1/4 flex-shrink-0 flex flex-col">

          <div className="bg-white rounded-2xl shadow-xl p-6 h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.unit?.name}</p>
            </div>

            {/* Roles (Unchanged) */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <RoleBadges roles={user.roles} unitName={user.unit?.name} />
            </div>

            {/* Navigation Buttons (Unchanged) */}
            <div className="mt-8 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                    activeTab === tab.name
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* --- Desktop Content Area --- */}
        {/* CHANGED (Request 2): Added `flex flex-col` so its child can use `h-full` */}
        <main className="w-3/4 xl:w-4/5 flex flex-col">
          {/* - CHANGED (Request 2): Removed `min-h-[600px]`
            - Added `h-full` to make this card stretch
          */}
          <div className="bg-white rounded-2xl shadow-xl p-8 h-full">
            {/* Render the shared TabContent component (Unchanged) */}
            <TabContent
              activeTab={activeTab}
              user={user}
              setUser={setUser}
            />
          </div>
        </main>
      </div>

      {/*
      ==============================
      === MOBILE VIEW (Unchanged) ===
      ==============================
      */}
      <div className="lg:hidden  p-4">
        {/* --- Mobile: Menu View (activeTab is null) --- */}
        {activeTab === null && (
          <div className="mt-30">
            {/* Profile Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-54 h-54 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.unit?.name}</p>
            </div>

            {/* Roles */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <RoleBadges roles={user.roles} unitName={user.unit?.name} />
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-white hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600">{tab.icon}</span>
                    <span className="font-medium text-gray-700">
                      {tab.name}
                    </span>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Mobile: Content View (activeTab is selected) --- */}
        {activeTab && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Back Button */}
            <button
              onClick={() => setActiveTab(null)}
              className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <FaArrowLeft size={14} /> Back
            </button>

            {/* Render the shared TabContent component */}
            <TabContent
              activeTab={activeTab}
              user={user}
              setUser={setUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;