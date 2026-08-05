import { ReactNode, useState } from 'react';
import { Menu, X, LogOut, BarChart3, Wallet, Users, DollarSign, Camera, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: ReactNode;
  label: string;
  shortLabel: string;
  href: string;
}

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Dashboard', shortLabel: 'Dashboard', href: '/' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Cuentas de Débito', shortLabel: 'Débito', href: '/accounts?type=DEBIT' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Tarjetas de Crédito', shortLabel: 'Crédito', href: '/accounts?type=CREDIT' },
    { icon: <Banknote className="w-5 h-5" />, label: 'Efectivo', shortLabel: 'Efectivo', href: '/accounts?type=CASH' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Inversiones', shortLabel: 'Inversiones', href: '/accounts?type=INVESTMENT' },
    { icon: <Users className="w-5 h-5" />, label: 'Deudores y Tickets', shortLabel: 'Deudores', href: '/debtors' },
    { icon: <Camera className="w-5 h-5" />, label: 'Snapshots e Histórico', shortLabel: 'Snapshots', href: '/snapshots' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col sm:flex-row relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* CONTINUOUS ELEGANT GLASS ORBS (Green & Cyan) */}
      <div className="floating-orb-green" />
      <div className="floating-orb-cyan" />

      {/* DESKTOP SIDEBAR (Liquid Glass) */}
      <aside
        className={`hidden sm:flex flex-col justify-between fixed left-0 top-0 h-full z-40 glass-panel transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between h-20 px-5 border-b border-slate-800">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                  <DollarSign className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <span className="font-black text-xl tracking-tight text-white block leading-tight">
                    Money<span className="text-emerald-400">Vault</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Control Financiero
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-md mx-auto">
                <DollarSign className="w-6 h-6 stroke-[3]" />
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const currentPathWithQuery = location.pathname + location.search;
              const isActive = location.pathname === item.href || currentPathWithQuery === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title={item.label}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop User Section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isSidebarOpen && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 backdrop-blur-md">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black uppercase shadow-md">
                {user?.username ? user.username.substring(0, 2) : 'MV'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.username || 'Usuario'}</p>
                <p className="text-[10px] text-emerald-400 truncate font-semibold">Sesión Activa</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="sm:hidden sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-black shadow-md">
            <DollarSign className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="font-black text-base text-white block leading-tight">
              Money<span className="text-emerald-400">Vault</span>
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Control Financiero</span>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* MAIN VIEW AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${
          isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20'
        } pb-24 sm:pb-8`}
      >
        {/* Top Desktop Bar */}
        <div className="hidden sm:flex h-16 glass-panel border-b border-slate-800 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Gestión de Cuentas y Deudas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{user?.username || 'Usuario Autenticado'}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* FLOATING BOTTOM DOCK (Mobile: Centrado ultracompacto con scroll horizontal suave sin barras) */}
      <nav className="sm:hidden fixed bottom-3 left-2 right-2 z-50 glass-panel border border-slate-800 rounded-2xl shadow-2xl p-1.5 flex items-center justify-between overflow-x-auto [scrollbar-width:none]">
        {navItems.map((item) => {
          const currentPathWithQuery = location.pathname + location.search;
          const isActive = location.pathname === item.href || currentPathWithQuery === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 min-w-[50px] max-w-[65px] text-center ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-extrabold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
              <span className="text-[8px] mt-0.5 font-bold tracking-tight truncate w-full">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
