import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const GuestRoute = () => {
  const { isLogedin, user } = useSelector((state) => state.user);

  if (isLogedin) {
    const userType = user?.type;
    if (userType === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default GuestRoute;
