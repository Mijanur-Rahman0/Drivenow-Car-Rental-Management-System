import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Only for logged-in users — others are sent to /login and sent back afterwards. */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, message: 'Please log in to continue.', type: 'error' }}
      />
    );
  }
  return children;
}
