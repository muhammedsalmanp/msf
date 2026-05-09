import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../Store/slices/userSlice.js';
import { setLoading } from '../../Store/slices/loadingSlice.js';
import { showNotification } from '../../Store/slices/notificationSlice.js';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { motion } from 'framer-motion';


import { FaEye, FaEyeSlash } from 'react-icons/fa';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector((state) => state.loading.isLoading);

  const validate = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Username or Phone is required.';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      dispatch(setLoading(true));
      const isPhone = /^\d{10}$/.test(identifier);

      const payload = {};
      if (isPhone) {
        payload.phone = `+91${identifier}`;
        payload.password = password;
      } else {
        payload.username = identifier;
        payload.password = password;
      }

      const res = await axiosInstance.post('/auth/login', payload);
      const userData = res.data.user;

      dispatch(
        login({
          user: userData,
          accessToken: res.data.accessToken,
        })
      );

      dispatch(
        showNotification({
          type: 'success',
          message: res.data.message || 'Login Successful!!',
        })
      );

      if (userData.isAdmin) {
        navigate('/admin/dashboard');
      } else if (userData.type === 'unit') {
        navigate(`/`);
      } else {
        navigate('/');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed!!';

      dispatch(
        showNotification({
          type: 'error',
          message: errorMessage,
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0fbf4] p-4">
      <motion.div
        className="w-full max-w-[400px] text-center
                   p-[10px] 
                   sm:bg-white sm:rounded-[12px] 
                   sm:shadow-[0_6px_20px_rgba(0,0,0,0.1)] 
                   sm:p-[40px_30px]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#2e7d32]">
            Welcome Back
          </h2>
          <p className="mt-2 text-base text-[#555] mb-[25px]">
            Please log in to continue
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              id="identifier"
              type="text"
              placeholder="Username"
              className={`w-full text-base px-[15px] py-[12px] my-[10px] border rounded-[8px] text-gray-900 
                          transition-colors duration-300
                          ${errors.identifier
                  ? 'border-red-500'
                  : 'border-[#ccc]'}
                          focus:outline-none focus:border-[#128c28] focus:ring-0`}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
            />
            {errors.identifier && (
              <span className="block mt-[-5px] mb-[10px] text-left text-red-600 text-sm">
                {errors.identifier}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`w-full text-base px-[15px] py-[12px] my-[10px] border rounded-[8px] text-gray-900 
                          transition-colors duration-300
                          ${errors.password
                  ? 'border-red-500'
                  : 'border-[#ccc]'}
                          focus:outline-none focus:border-[#128c28] focus:ring-0`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-sm text-[#555] hover:text-[#128c28] focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <span className="block mt-[-5px] mb-[10px] text-left text-red-600 text-sm">
              {errors.password}
            </span>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-[12px] font-bold text-white text-base rounded-[8px]
                         bg-[#2e7d32] hover:bg-[#128c28] 
                         focus:outline-none 
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         transition-colors duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;