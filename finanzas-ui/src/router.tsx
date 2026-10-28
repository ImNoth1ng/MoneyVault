import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { useAuthStore } from './store/authStore';
import { isTokenExpired } from './utils/jwtUtils';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountsPage from './pages/AccountsPage';
import DebtorsPage from './pages/DebtorsPage';
import { SnapshotsPage } from './pages/SnapshotsPage';
import TransactionsPage from './pages/TransactionsPage';
import InvestmentsPage from './pages/InvestmentsPage';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, token, logout } = useAuthStore();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0b0f19]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Cargando sesión...</p>
                </div>
            </div>
        );
    }

    const currentToken = token || localStorage.getItem('authToken');

    if (!isAuthenticated || isTokenExpired(currentToken)) {
        if (isAuthenticated || currentToken) {
            logout();
        }
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
                        path: 'movimientos',
                        element: <TransactionsPage />,
                    },
                    {
                        path: 'transactions',
                        element: <Navigate to="/movimientos" replace />,
                    },
                    {
                        path: 'inversiones',
                        element: <InvestmentsPage />,
                    },
                    {
                        path: 'investments',
                        element: <Navigate to="/inversiones" replace />,
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
