import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ErrorMessage } from '../components/common/Feedback';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden. Por favor verifica ambos campos.');
      return;
    }

    try {
      await register({
        username: name.trim(),
        email: email.trim(),
        password: password,
        passwordConfirm: passwordConfirm,
      });
      navigate('/');
    } catch (e: any) {
      console.error(e);
      const serverMsg = typeof e.response?.data === 'string' 
        ? e.response.data 
        : e.response?.data?.message || e.message || 'Error al registrar usuario.';
      setError(serverMsg);
    }
  };

  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-slate-100 p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* ELEGANT GLASS ORBS (Green & Cyan) */}
      <div className="floating-orb-green" />
      <div className="floating-orb-cyan" />

      <div className="max-w-md w-full glass-card border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-3xl bg-[#0f172a]/90">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <DollarSign className="w-9 h-9 stroke-[3]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Crear Cuenta</h1>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">
            Únete a MoneyVault
          </p>
        </div>

        {error && <div className="mb-4"><ErrorMessage title="Error al registrar" message={error} /></div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Nombre de Usuario *
            </label>
            <input
              type="text"
              minLength={3}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              placeholder="juan.perez (mínimo 3 caracteres)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              placeholder="juan@example.com"
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
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <input
                type="password"
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`glass-input w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none placeholder-slate-500 font-semibold ${
                  passwordsMatch
                    ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                    : passwordsMismatch
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'focus:border-emerald-500'
                }`}
                placeholder="Repite tu contraseña"
                required
              />
              {passwordsMatch && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3" />
              )}
              {passwordsMismatch && (
                <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3.5 top-3" />
              )}
            </div>
            {passwordsMismatch && (
              <p className="text-[11px] text-rose-400 font-bold mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || passwordsMismatch}
            className="w-full btn-emerald py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 text-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus size={20} />}
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <p className="mt-5 text-center text-xs text-slate-400 font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
