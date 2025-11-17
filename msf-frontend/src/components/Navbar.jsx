
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { logout } from "../Store/slices/userSlice";
import logo from "../assets/logo.png";
import axios from '../api/axiosInstance';
import { showNotification } from "../Store/slices/notificationSlice";

// Variant for the mobile nav (from bottom)
const mobileNavbarVariants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20,
      delay: 0.2,
    },
  },
};


function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLogedin = useSelector((state) => state.user.isLogedin);
  const userObject = useSelector((state) => state.user.user);
  const accessToken = useSelector((state) => state.user.accessToken);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        "/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      dispatch(
        showNotification({
          message: "Logged out successfully!",
          type: "success",
        })
      );
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Logout request failed:", error);
      const errorMessage =
        error.response?.data?.message || "An error occurred during logout.";
      dispatch(
        showNotification({
          message: errorMessage,
          type: "error",
        })
      );
    }
  };

  const profileLink =
    userObject?.type === "incharge"
      ? "/profile"
      : userObject?.type === "unit"
        ? "/profile2"
        : "/profile";

  // --- MODIFIED: Style for UNSCROLLED state (your original style) ---
  const getDesktopNavLinkClass_Unscrolled = ({ isActive }) => {
    const baseStyle = "font-bold text-xl px-3 py-1 rounded transition";
    if (isActive) {
      return `bg-green-600 text-white ${baseStyle}`;
    } else {
      return `text-green-600 hover:bg-green-600 hover:text-white ${baseStyle}`;
    }
  };

  // --- NEW: Creative style for SCROLLED state ---
  const getDesktopNavLinkClass_Scrolled = ({ isActive }) => {
    const baseStyle = "font-bold text-xl px-4 py-2 rounded-full transition-all duration-300";
    if (isActive) {
      // The active link gets the green pill
      return `bg-green-600 text-white shadow-md ${baseStyle}`;
    } else {
      // Inactive links are just text (inside the white pill)
      return `text-green-700 hover:bg-green-50 ${baseStyle}`;
    }
  };


  // Mobile NavLink helper (unchanged)
  const getMobileNavLinkClass = ({ isActive }) => {
    return `flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
      isActive
        ? "text-green-600"
        : "text-gray-500 hover:text-green-500"
    }`;
  };

  const mobileLogoutButtonClass =
    "flex flex-col items-center justify-center flex-1 text-gray-500 hover:text-red-500 transition-all duration-200";

  return (
    <>
      {/* --- DESKTOP NAVBAR --- */}
      <header
        className={`hidden md:flex fixed right-[13%] w-[70%] items-center justify-between px-10 py-4 z-50 transition-all duration-300 ${
          scrolled ? "top-12" : "top-0"
        }`}
      >
        {/* Logo (Hides on scroll) */}
        {!scrolled && (
          <NavLink to="/">
            <img src={logo} alt="Logo" className="h-20" />
          </NavLink>
        )}

        {/* --- MODIFIED: Navigation Links (Becomes creative pill on scroll) --- */}
        <nav
          className={`${
            scrolled
              // "Shrunk" pill: p-2 (was p-4) and gap-2 (was gap-6)
              ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md flex gap-2"
              : "flex gap-6"
          } transition-all duration-300`}
        >
          {/* This logic checks if we are scrolled and applies the correct style function */}
          <NavLink 
            to="/" 
            className={({isActive}) => scrolled 
              ? getDesktopNavLinkClass_Scrolled({isActive}) 
              : getDesktopNavLinkClass_Unscrolled({isActive})
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/committee" 
            className={({isActive}) => scrolled 
              ? getDesktopNavLinkClass_Scrolled({isActive}) 
              : getDesktopNavLinkClass_Unscrolled({isActive})
            }
          >
            Committee
          </NavLink>
          <NavLink 
            to="/explore" 
            className={({isActive}) => scrolled 
              ? getDesktopNavLinkClass_Scrolled({isActive}) 
              : getDesktopNavLinkClass_Unscrolled({isActive})
            }
          >
            Explore
          </NavLink>
          <NavLink 
            to="/units" 
            className={({isActive}) => scrolled 
              ? getDesktopNavLinkClass_Scrolled({isActive}) 
              : getDesktopNavLinkClass_Unscrolled({isActive})
            }
          >
            Ward
          </NavLink>
        </nav>

        {/* Icons Section (Hides on scroll) */}
        {!scrolled && (
          <div className="flex gap-8 items-center text-green-600 text-2xl">
            {isLogedin && (
              <NavLink to={profileLink} title="Profile">
                <i className="fa fa-user-circle text-3xl hover:text-green-800"></i>
              </NavLink>
            )}

            {isLogedin ? (
              <button
                onClick={handleLogout}
                title="Logout"
                className="hover:text-red-600 transition"
              >
                <i className="fa fa-sign-out text-3xl"></i>
              </button>
            ) : (
              <NavLink to="/login" title="Login">
                <i className="fa fa-sign-in text-3xl hover:text-green-800"></i>
              </NavLink>
            )}
          </div>
        )}
      </header>

      {/* --- REDESIGNED MOBILE NAVBAR (Unchanged) --- */}
      <motion.nav
        className="md:hidden fixed bottom-0 left-0 right-0 w-full p-4 z-50"
        variants={mobileNavbarVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-around items-center w-full max-w-md mx-auto bg-white shadow-xl rounded-full px-2 py-3">
          {/* ... mobile nav links are all correct and unchanged ... */}
          <NavLink to="/" className={getMobileNavLinkClass}>
            <i className="fa fa-home text-2xl"></i>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink to="/committee" className={getMobileNavLinkClass}>
            <i className="fa fa-users text-2xl"></i>
            <span className="text-xs font-medium">Committee</span>
          </NavLink>
          <NavLink to="/explore" className={getMobileNavLinkClass}>
            <i className="fa fa-map text-2xl"></i>
            <span className="text-xs font-medium">Explore</span>
          </NavLink>
          <NavLink to="/units" className={getMobileNavLinkClass}>
            <i className="fa fa-archive text-2xl"></i>
            <span className="text-xs font-medium">Ward</span>
          </NavLink>
          {isLogedin && (
            <NavLink to={profileLink} className={getMobileNavLinkClass}>
              <i className="fa fa-user-circle text-2xl"></i>
              <span className="text-xs font-medium">Profile</span>
            </NavLink>
          )}
          {isLogedin ? (
            <button onClick={handleLogout} className={mobileLogoutButtonClass}>
              <i className="fa fa-sign-out text-2xl"></i>
              <span className="text-xs font-medium">Logout</span>
            </button>
          ) : (
            <NavLink to="/login" className={getMobileNavLinkClass}>
              <i className="fa fa-sign-in text-2xl"></i>
              <span className="text-xs font-medium">Login</span>
            </NavLink>
          )}
        </div>
      </motion.nav>
    </>
  );
}

export default Navbar;