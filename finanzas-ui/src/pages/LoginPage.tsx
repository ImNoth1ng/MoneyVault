import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, DollarSign } from 'lucide-react';
import { ErrorMessage } from '../components/common/Feedback';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (e: any) {
      console.error(e);
      const serverMsg = typeof e.response?.data === 'string'
        ? e.response.data
        : e.response?.data?.message || e.message || 'Usuario o contraseña incorrectos.';
      setError(serverMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-slate-100 p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* ELEGANT GLASS ORBS (Green & Cyan) */}
      <div className="floating-orb-green" />
      <div className="floating-orb-cyan" />

      <div className="max-w-md w-full glass-card border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-3xl bg-[#0f172a]/90">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <DollarSign className="w-9 h-9 stroke-[3]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Money<span className="text-emerald-400">Vault</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Control Financiero Inteligente
          </p>
        </div>

        {error && <div className="mb-4"><ErrorMessage title="Error de inicio de sesión" message={error} /></div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Usuario *
            </label>
            <input
              type="text"
              minLength={3}
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              placeholder="Tu nombre de usuario"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Contraseña *
            </label>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-emerald py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 text-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn size={20} />}
            {isLoading ? 'Iniciando sesión...' : 'Entrar a MoneyVault'}
          </button>

          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            ¿No tienes cuenta aún?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold underline">
              Regístrate gratis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
