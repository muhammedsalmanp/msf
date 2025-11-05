import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isLogedin, user } = useSelector((state) => state.user);
  const location = useLocation();

  if (!isLogedin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const userType = user?.type;

  if (allowedRoles && !allowedRoles.includes(userType)) {
    if (userType === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;