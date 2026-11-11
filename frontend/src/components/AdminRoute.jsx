import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Superusers only. */
export default function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
