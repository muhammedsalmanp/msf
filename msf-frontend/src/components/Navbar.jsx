// import { useEffect, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { logout } from "../Store/slices/userSlice";
// import logo from "../assets/logo.png";
// import axios from '../api/axiosInstance'; // --- Used ---
// import { showNotification } from "../Store/slices/notificationSlice"; // --- Used ---

// function Navbar() {
//   const [scrolled, setScrolled] = useState(false);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const isLogedin = useSelector((state) => state.user.isLogedin);
//   const userObject = useSelector((state) => state.user.user);
//   const accessToken = useSelector((state) => state.user.accessToken);

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 100);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   // --- MODIFIED ---
//   // Switched from fetch to axios and added notifications
//   const handleLogout = async () => {
//     try {
//       // Use axios.post
//       // The URL '/auth/logout' will be combined with your axiosInstance baseURL
//       const response = await axios.post(
//         "/auth/logout",
//         {}, // Send an empty object if no body is required, or your data
//         {
//           headers: {
//             // Send the token for authorization
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       // Check if the request was successful (axios throws on 4xx/5xx)
//       // We can use response.data from axios directly
//       dispatch(
//         showNotification({
//           message: "Logged out successfully!",
//           type: "success",
//         })
//       );
//       dispatch(logout()); // Dispatch local Redux logout
//       navigate("/"); // Redirect to home
//     } catch (error) {
//       // Handle errors from axios
//       console.error("Logout request failed:", error);

//       // Get a more specific error message if the backend sent one
//       const errorMessage =
//         error.response?.data?.message || "An error occurred during logout.";

//       dispatch(
//         showNotification({
//           message: errorMessage,
//           type: "error",
//         })
//       );
//     }
//   };

//   const profileLink =
//     userObject?.type === "incharge"
//       ? "/profile"
//       : userObject?.type === "unit"
//         ? "/profile2"
//         : "/profile"; // default fallback

//   return (
//     <>
//       {/* Desktop Navbar */}
//       <header
//         className={`hidden md:flex fixed right-[13%] w-[70%] items-center justify-between px-10 py-4 z-50 transition-all duration-300 ${scrolled ? "top-12" : "top-0"
//           }`}
//       >
//         {/* Logo */}
//         {!scrolled && <img src={logo} alt="Logo" className="h-20" />}

//         {/* Navigation Links */}
//         <nav
//           className={`${scrolled
//               ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-md flex gap-6"
//               : "flex gap-6"
//             } transition-all duration-300`}
//         >
//           <a
//             href="/"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Home
//           </a>
//           <a
//             href="/committee"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Committee
//           </a>
//           <a
//             href="/explore"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Explore
//           </a>
//           <a
//             href="/units"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Units
//           </a>
//         </nav>

//         {/* Icons Section */}
//         {!scrolled && (
//           <div className="flex gap-8 items-center text-green-600 text-2xl">
//             {isLogedin && (
//               <a href={profileLink} title="Profile">
//                 <i className="fa fa-user-circle text-3xl hover:text-green-800"></i>
//               </a>
//             )}

//             {isLogedin ? (
//               <button
//                 onClick={handleLogout}
//                 title="Logout"
//                 className="hover:text-red-600 transition"
//               >
//                 <i className="fa fa-sign-out text-3xl"></i>
//               </button>
//             ) : (
//               <a href="/login" title="Login">
//                 <i className="fa fa-sign-in text-3xl hover:text-green-800"></i>
//               </a>
//             )}
//           </div>
//         )}
//       </header>

//       {/* Mobile Navbar */}
//       <footer className="md:hidden fixed bottom-0 w-full h-20 bg-[#008000] flex justify-around py-3 text-white z-50">
//         <a href="/" className="text-3xl mt-3">
//           <i className="fa fa-home"></i>
//         </a>
//         <a href="/committee" className="text-3xl mt-3">
//           <i className="fa fa-users"></i>
//         </a>
//         <a href="/explore" className="text-3xl mt-3">
//           <i className="fa fa-map"></i>
//         </a>
//         <a href="/units" className="text-3xl mt-3">
//           <i className="fa fa-archive"></i>
//         </a>
//         {isLogedin && (
//           <a href={profileLink} title="Profile" className="text-3xl mt-3">
//             <i className="fa fa-user-circle"></i>
//           </a>
//         )}
//         {isLogedin ? (
//           <button onClick={handleLogout} title="Logout" className="text-3xl mt-3">
//             <i className="fa fa-sign-out"></i>
//           </button>
//         ) : (
//           <a href="/login" title="Login" className="text-3xl mt-3">
//             <i className="fa fa-sign-in"></i>
//           </a>
//         )}


//       </footer>
//     </>
//   );
// }

// export default Navbar;

// import { useEffect, useState } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigate, NavLink } from "react-router-dom"; // --- MODIFIED: Added NavLink ---
// import { logout } from "../Store/slices/userSlice";
// import logo from "../assets/logo.png";
// import axios from '../api/axiosInstance';
// import { showNotification } from "../Store/slices/notificationSlice";

// function Navbar() {
//   const [scrolled, setScrolled] = useState(false);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const isLogedin = useSelector((state) => state.user.isLogedin);
//   const userObject = useSelector((state) => state.user.user);
//   const accessToken = useSelector((state) => state.user.accessToken);

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 100);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   const handleLogout = async () => {
//     try {
//       const response = await axios.post(
//         "/auth/logout",
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       dispatch(
//         showNotification({
//           message: "Logged out successfully!",
//           type: "success",
//         })
//       );
//       dispatch(logout());
//       navigate("/");
//     } catch (error) {
//       console.error("Logout request failed:", error);
//       const errorMessage =
//         error.response?.data?.message || "An error occurred during logout.";
//       dispatch(
//         showNotification({
//           message: errorMessage,
//           type: "error",
//         })
//       );
//     }
//   };

//   const profileLink =
//     userObject?.type === "incharge"
//       ? "/profile"
//       : userObject?.type === "unit"
//         ? "/profile2"
//         : "/profile";

//   // Helper function for NavLink classes
//   // This makes the active link green and inactive links gray
//   const getNavLinkClass = ({ isActive }) => {
//     return `flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
//       isActive
//         ? "text-green-600"
//         : "text-gray-500 hover:text-green-500"
//     }`;
//   };

//   // Helper function for the logout button style
//   const logoutButtonClass =
//     "flex flex-col items-center justify-center flex-1 text-gray-500 hover:text-red-500 transition-all duration-200";

//   return (
//     <>
//       {/* Desktop Navbar (Unchanged) */}
//       <header
//         className={`hidden md:flex fixed right-[13%] w-[70%] items-center justify-between px-10 py-4 z-50 transition-all duration-300 ${
//           scrolled ? "top-12" : "top-0"
//         }`}
//       >
//         {!scrolled && <img src={logo} alt="Logo" className="h-20" />}
//         <nav
//           className={`${
//             scrolled
//               ? "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-md flex gap-6"
//               : "flex gap-6"
//           } transition-all duration-300`}
//         >
//           <a
//             href="/"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Home
//           </a>
//           <a
//             href="/committee"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Committee
//           </a>
//           <a
//             href="/explore"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Explore
//           </a>
//           <a
//             href="/units"
//             className="text-green-600 font-bold text-xl hover:bg-green-600 hover:text-white px-3 py-1 rounded transition"
//           >
//             Units
//           </a>
//         </nav>
//         {!scrolled && (
//           <div className="flex gap-8 items-center text-green-600 text-2xl">
//             {isLogedin && (
//               <a href={profileLink} title="Profile">
//                 <i className="fa fa-user-circle text-3xl hover:text-green-800"></i>
//               </a>
//             )}
//             {isLogedin ? (
//               <button
//                 onClick={handleLogout}
//                 title="Logout"
//                 className="hover:text-red-600 transition"
//               >
//                 <i className="fa fa-sign-out text-3xl"></i>
//               </button>
//             ) : (
//               <a href="/login" title="Login">
//                 <i className="fa fa-sign-in text-3xl hover:text-green-800"></i>
//               </a>
//             )}
//           </div>
//         )}
//       </header>

//       {/* --- REDESIGNED MOBILE NAVBAR --- */}
//       {/* This outer 'nav' is a container that places the bar at the bottom with padding */}
//       <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full p-4 z-50">
//         {/* This inner 'div' is the "floating pill" with shadow, background, and rounded corners */}
//         <div className="flex justify-around items-center w-full max-w-md mx-auto bg-white shadow-xl rounded-full px-2 py-3">
//           <NavLink to="/" className={getNavLinkClass}>
//             <i className="fa fa-home text-2xl"></i>
//             <span className="text-xs font-medium">Home</span>
//           </NavLink>

//           <NavLink to="/committee" className={getNavLinkClass}>
//             <i className="fa fa-users text-2xl"></i>
//             <span className="text-xs font-medium">Committee</span>
//           </NavLink>

//           <NavLink to="/explore" className={getNavLinkClass}>
//             <i className="fa fa-map text-2xl"></i>
//             <span className="text-xs font-medium">Explore</span>
//           </NavLink>

//           <NavLink to="/units" className={getNavLinkClass}>
//             <i className="fa fa-archive text-2xl"></i>
//             <span className="text-xs font-medium">Units</span>
//           </NavLink>

//           {isLogedin && (
//             <NavLink to={profileLink} className={getNavLinkClass}>
//               <i className="fa fa-user-circle text-2xl"></i>
//               <span className="text-xs font-medium">Profile</span>
//             </NavLink>
//           )}

//           {isLogedin ? (
//             <button onClick={handleLogout} className={logoutButtonClass}>
//               <i className="fa fa-sign-out text-2xl"></i>
//               <span className="text-xs font-medium">Logout</span>
//             </button>
//           ) : (
//             <NavLink to="/login" className={getNavLinkClass}>
//               <i className="fa fa-sign-in text-2xl"></i>
//               <span className="text-xs font-medium">Login</span>
//             </NavLink>
//           )}
//         </div>
//       </nav>
//     </>
//   );
// }

// export default Navbar;
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
            Units
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
            <span className="text-xs font-medium">Units</span>
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