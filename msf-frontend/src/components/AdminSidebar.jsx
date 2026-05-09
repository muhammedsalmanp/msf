import { useState } from 'react';
import {
  FaBars,
  FaUser,
  FaImage,
  FaLeaf,
  FaFemale,
  FaUserNurse,
  FaMapMarkedAlt,
  FaSyncAlt,
  FaSignOutAlt,
  FaTachometerAlt,
} from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../Store/slices/userSlice';

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);
  // State to control the logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const menu = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/admin/dashboard' },
    { name: 'Slide', icon: <FaImage />, path: '/admin/slide' },
    { name: 'msf Committee', icon: <FaUser />, path: '/admin/MsfMemberManagement'},
    { name: 'Haritha Committee', icon: <FaUser />, path: '/admin/HarithaMemberManagement'},
    { name: 'Updates', icon: <FaFemale />, path: '/admin/journey' },
    { name: 'Units', icon: <FaMapMarkedAlt /> , path: '/admin/units' },
  ];

  // --- Logout Handlers ---

  // 1. Show the confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setOpen(false); // Close sidebar if open on mobile
  };

  // 2. Perform the actual logout
  const confirmLogout = () => {
    dispatch(logout());
    navigate('/login');
    setShowLogoutConfirm(false); // Close modal
  };

  // 3. Close the modal without logging out
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="text-white bg-[#86f5af] p-2 rounded-md shadow-md"
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* Overlay on mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 backdrop-blur-md bg-black/20 bg-opacity-50 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-40 top-0 left-0 w-64 min-h-screen bg-[#ffffff] shadow-md transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:flex md:flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-1 pl-15 pt-3">
          <h1 className="font-bold text-5xl text-green-500">
            <span className="text-green-500">msf</span>
          </h1>
        </div>

        {/* Menu */}
        <ul className="mt-4 space-y-2 px-2 flex-grow">
          {menu.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#f0fbf4] text-black font-semibold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-base">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="px-4 py-4">
          <button
            // Updated to show the modal first
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full text-left px-4 py-16 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="text-base">Logout</span>
          </button>
        </div>
      </div>

      {/* --- Logout Confirmation Modal --- */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div
            onClick={cancelLogout}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />
          
          {/* Modal Box */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to log out?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelLogout}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminSidebar;