import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DashboardAdminPage from './pages/DashboardAdminPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import MagazinesPage from './pages/MagazinesPage.jsx';
import MagazinesCatalogPage from './pages/MagazinesCatalogPage.jsx';
import PeriodsPage from './pages/PeriodsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AppLayout from './components/AppLayout.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Carregando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Carregando...</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/app" replace />;
  return children;
}

function DashboardRoute() {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <DashboardAdminPage /> : <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/verificar" element={<VerifyPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRoute />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="revistas" element={<MagazinesCatalogPage />} />
          <Route path="revistas-admin" element={<AdminRoute><MagazinesPage /></AdminRoute>} />
          <Route path="periodos" element={<AdminRoute><PeriodsPage /></AdminRoute>} />
          <Route path="usuarios" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
