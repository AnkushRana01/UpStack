import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user } = useAuth();
  // Unauthenticated users are sent to /login.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
