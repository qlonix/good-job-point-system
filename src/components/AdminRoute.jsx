import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const isAuthenticated = sessionStorage.getItem('gj_admin_auth') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
