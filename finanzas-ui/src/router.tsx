import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { useAuthStore } from './store/authStore';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountsPage from './pages/AccountsPage';
import DebtorsPage from './pages/DebtorsPage';
import { SnapshotsPage } from './pages/SnapshotsPage';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">Cargando sesión...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: <MainLayout />,
                children: [
                    {
                        index: true,
                        element: <DashboardPage />,
                    },
                    {
                        path: 'accounts',
                        element: <AccountsPage />,
                    },
                    {
                        path: 'debtors',
                        element: <DebtorsPage />,
                    },
                    {
                        path: 'snapshots',
                        element: <SnapshotsPage />,
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    }
]);
