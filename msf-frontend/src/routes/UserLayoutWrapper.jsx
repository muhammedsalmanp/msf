import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Layout from '../Layouts/Layout'; 


const UserLayoutWrapper = () => {
  const { isLogedin, user } = useSelector((state) => state.user);

  if (isLogedin && user?.type === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Layout />;
};

export default UserLayoutWrapper;