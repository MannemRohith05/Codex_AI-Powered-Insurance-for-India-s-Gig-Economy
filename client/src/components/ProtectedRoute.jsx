import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { token, role: userRole } = useAuth();
  if (!token) {
    return <Navigate to={`/${role}/login`} replace />;
  }
  if (userRole !== role) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }
  return children;
};

export default ProtectedRoute;
