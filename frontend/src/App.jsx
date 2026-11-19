import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import OwnerLoginPage from './pages/OwnerLoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-zinc-500">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={allowedRole === 'owner' ? '/owner-login' : '/login'} replace />;
  }

  if (allowedRole) {
    const isCustomerRole = ['customer', 'user'].includes(user.role);
    const isOwnerRole = ['owner', 'demo_owner'].includes(user.role);
    const matches =
      allowedRole === 'customer'
        ? isCustomerRole
        : allowedRole === 'owner'
        ? isOwnerRole
        : user.role === allowedRole;
    if (!matches) {
      return (
        <Navigate
          to={isOwnerRole ? '/owner/dashboard' : '/customer/dashboard'}
          replace
        />
      );
    }
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<CustomerAuthPage />} />
          <Route path="/owner-login" element={<OwnerLoginPage />} />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
