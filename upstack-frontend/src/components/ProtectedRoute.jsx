import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user } = useAuth();
  // Unauthenticated users are sent to /login.
  // The Welcome page (/welcome) is the initial public landing page for fresh browser
  // sessions — the wildcard route in App.jsx handles that case.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
