import { useState } from 'react';
import { Wallet, TrendingUp, Users, Plus, ArrowRight, AlertCircle, Camera, CheckCircle2, AlertTriangle, Calendar, CreditCard, Banknote, FileText } from 'lucide-react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/Feedback';
import { useAccounts, useAllSnapshots, useCreateGlobalSnapshot } from '../../hooks/useAccounts';
import { useDebtors, useDebtTickets } from '../../hooks/useDebts';
import { formatCurrency } from '../../utils/formatters';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useAccounts();
  const { data: debtors = [], isLoading: debtorsLoading } = useDebtors();
  const { data: tickets = [], isLoading: ticketsLoading } = useDebtTickets();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useAllSnapshots();

  const createGlobalSnapshotMutation = useCreateGlobalSnapshot();
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<'MONTHLY' | 'FIFTEEN_DAYS'>('FIFTEEN_DAYS');
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  if (accountsLoading || debtorsLoading || ticketsLoading || snapshotsLoading) {
    return <LoadingSpinner text="Cargando Inteligencia Financiera..." />;
  }

  if (accountsError) {
    return (
      <div className="p-8 text-center glass-card border border-rose-500/40 bg-rose-950/20 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <h3 className="text-lg font-black text-white">Error al cargar datos</h3>
        <p className="text-xs text-rose-300 mt-1 font-medium">Verifica la conexión con el servidor backend (http://localhost:8085).</p>
      </div>
    );
  }

  // 1. DÉBITO, EFECTIVO Y LIQUIDEZ TOTAL
  const liquidityAccounts = accounts.filter((a) => (a.type === 'DEBIT' || a.type === 'CASH') && a.active !== false);
  const totalLiquidityDebit = liquidityAccounts.reduce((sum, a) => sum + parseFloat(String(a.currentBalance || 0)), 0);

  // 2. TARJETAS DE CRÉDITO
  const creditAccounts = accounts.filter((a) => (a.type === 'CREDIT' || String(a.type) === 'CREDIT_CARD') && a.active !== false);
  const creditDebtTotal = creditAccounts.reduce((sum, a) => {
    const used = a.usedCredit !== undefined ? parseFloat(String(a.usedCredit)) : parseFloat(String(a.currentBalance || 0));
    return sum + used;
  }, 0);

  // 3. DEUDAS POR COBRAR
  const pendingTickets = tickets.filter((t) => !Boolean(t.isPaid || t.status === 'PAID'));
  const totalPendingReceivable = pendingTickets.reduce((sum, t) => sum + parseFloat(String(t.totalAmount || 0)), 0);

  // 4. INVERSIONES (Suma de saldos en cuentas de inversión)
  const investmentAccounts = accounts.filter((a) => a.type === 'INVESTMENT' && a.active !== false);
  const totalInvestmentBalance = investmentAccounts.reduce((sum, a) => sum + parseFloat(String(a.currentBalance || 0)), 0);

  // 5. DINERO LIBRE
  const dineroLibre = totalLiquidityDebit - creditDebtTotal;

  // 6. SNAPSHOT ANALYSIS & SEMÁFORO LOGIC
  const sortedSnapshots = [...snapshots].sort((a: any, b: any) => 
    new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
  );

  const lastSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[0] : null;
  const previousSnapshotAmount = lastSnapshot ? parseFloat(String(lastSnapshot.snapshotAmount || 0)) : null;

  const last3Snapshots = sortedSnapshots.slice(0, 3);
  const avgLast3Snapshots = last3Snapshots.length > 0
    ? last3Snapshots.reduce((acc: number, s: any) => acc + parseFloat(String(s.snapshotAmount || 0)), 0) / last3Snapshots.length
    : null;

  let statusColor: 'green' | 'orange' | 'red' = 'green';
  let statusMessage = 'Liquidez libre óptima';

  if (dineroLibre < 0 || (avgLast3Snapshots !== null && avgLast3Snapshots > dineroLibre * 1.15)) {
    statusColor = 'red';
    statusMessage = '⚠️ Alerta de Gasto Elevado: Tu dinero libre disponible disminuyó respecto al promedio de tus últimos 3 snapshots.';
  } else if (previousSnapshotAmount !== null && dineroLibre < previousSnapshotAmount) {
    statusColor = 'orange';
    statusMessage = 'Menor dinero libre disponible respecto al snapshot previo';
  } else {
    statusColor = 'green';
    statusMessage = 'Mayor disponibilidad de dinero libre que en el periodo anterior';
  }

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Sin snapshots registrados';
    const now = new Date();
    const snapDate = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - snapDate.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `Hace ${diffHours} hora(s)`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día(s)`;
  };

  const handleCaptureSnapshot = async () => {
    setModalError(null);
    try {
      await createGlobalSnapshotMutation.mutateAsync({
        customAmount: dineroLibre,
        frequency: selectedFrequency,
      });
      setSnapshotFeedback(`¡Snapshot Global de Dinero Libre (${formatCurrency(dineroLibre)}) guardado correctamente!`);
      setTimeout(() => setSnapshotFeedback(null), 3500);
      setShowSnapshotModal(false);
    } catch (e: any) {
      console.error(e);
      setModalError(e.response?.data?.message || e.message || 'Error al capturar snapshot.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dashboard Financiero</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">Control de Dinero Libre, Liquidez Total y Deudas en Tarjeta</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Capturar Snapshot Global</span>
          </button>
          <Link
            to="/accounts?type=DEBIT"
            className="px-4 py-2.5 btn-emerald text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Gestionar Cuentas</span>
          </Link>
        </div>
      </div>

      {snapshotFeedback && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{snapshotFeedback}</span>
        </div>
      )}

      {/* 🚀 TARJETA PRINCIPAL GRANDE: DINERO LIBRE */}
      <div
        className={`glass-card rounded-2xl p-6 sm:p-8 border relative overflow-hidden transition-all duration-300 ${
          statusColor === 'red'
            ? 'border-rose-500/50 bg-rose-950/20'
            : statusColor === 'orange'
            ? 'border-amber-500/40 bg-amber-950/10'
            : 'border-emerald-500/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full inline-block animate-pulse ${
                  statusColor === 'red'
                    ? 'bg-rose-500'
                    : statusColor === 'orange'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Dinero Libre Disponible
              </span>
              <span className="text-[10px] px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-slate-300 font-bold">
                Post-Deudas Crédito
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {formatCurrency(dineroLibre)}
            </h2>

            <p className="text-xs font-semibold text-slate-300 max-w-xl">
              Es el dinero líquido neto real que te queda libre después de restar tus deudas en Tarjetas de Crédito ({formatCurrency(creditDebtTotal)}) de tu dinero total en Liquidez ({formatCurrency(totalLiquidityDebit)}).
            </p>

            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 backdrop-blur-md mt-3 ${
                statusColor === 'red'
                  ? 'bg-rose-500/15 text-rose-200 border-rose-500/30'
                  : statusColor === 'orange'
                  ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
              }`}
            >
              {statusColor === 'red' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : statusColor === 'orange' ? (
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <span className="text-xs font-bold">{statusMessage}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 min-w-[280px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Último Snapshot</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {lastSnapshot ? getTimeAgo(lastSnapshot.snapshotDate) : 'No registrado'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Snapshot Previo:</span>
                <span className="font-mono font-bold text-white">
                  {previousSnapshotAmount !== null ? formatCurrency(previousSnapshotAmount) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Promedio Últimos 3:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {avgLast3Snapshots !== null ? formatCurrency(avgLast3Snapshots) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Variación Disponibilidad:</span>
                <span
                  className={`font-black ${
                    previousSnapshotAmount === null
                      ? 'text-slate-400'
                      : dineroLibre >= previousSnapshotAmount
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {previousSnapshotAmount !== null
                    ? `${dineroLibre >= previousSnapshotAmount ? '+' : ''}${formatCurrency(dineroLibre - previousSnapshotAmount)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 TARJETAS SECUNDARIAS DESGLOSADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Dinero Total en Liquidez</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalLiquidityDebit)}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{liquidityAccounts.length} cuenta(s) en liquidez (débito y efectivo)</p>
          </div>
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Deuda Tarjetas Crédito</p>
            <p className="text-2xl font-black text-rose-300 mt-1">{formatCurrency(creditDebtTotal)}</p>
            <p className="text-[10px] text-rose-400/80 mt-1 font-semibold">{creditAccounts.length} tarjeta(s) ocupadas</p>
          </div>
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Por Cobrar (Tickets)</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalPendingReceivable)}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{pendingTickets.length} ticket(s) pendientes</p>
          </div>
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Dinero en Inversiones</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalInvestmentBalance)}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{investmentAccounts.length} cuenta(s) de inversión</p>
          </div>
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tablas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Cuentas Bancarias" subtitle={`${accounts.length} registrada(s)`}>
          {accounts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">No hay cuentas bancarias asociadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Saldo / Deuda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {accounts.slice(0, 6).map((account) => {
                    const isCredit = account.type === 'CREDIT' || String(account.type) === 'CREDIT_CARD';
                    const bal = parseFloat(String(account.currentBalance || 0));

                    return (
                      <tr key={account.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-extrabold text-white">{account.name}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${isCredit ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
                            {account.type}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-black ${isCredit ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isCredit ? `-${formatCurrency(bal)}` : formatCurrency(bal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <Link to="/accounts?type=DEBIT" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition">
                  <span>Ver todas las cuentas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card title="Tickets de Deuda Recientes" subtitle={`${pendingTickets.length} por cobrar`}>
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">No hay tickets de deuda registrados.</p>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => {
                const isPaid = Boolean(ticket.isPaid || ticket.status === 'PAID');
                return (
                  <div key={ticket.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-white">{ticket.description}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Deudor ID: {ticket.debtorId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-black text-white">{formatCurrency(Number(ticket.totalAmount) || 0)}</p>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5 border ${isPaid ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
                        {isPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 flex justify-end">
                <Link to="/debtors" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition">
                  <span>Ver todos los tickets y deudores</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL: CAPTURAR SNAPSHOT GLOBAL */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#0f172a]/95 rounded-2xl border border-emerald-500/30 w-full max-w-md p-6 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span>Capturar Snapshot Global</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 font-medium">
              Guarda el estado global de tu momento financiero (Dinero Libre) para alimentar el semáforo y gráficas.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">Frecuencia del Snapshot *</label>
                <select
                  value={selectedFrequency}
                  onChange={(e) => setSelectedFrequency(e.target.value as any)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f172a] text-white font-semibold"
                >
                  <option value="FIFTEEN_DAYS" className="bg-[#0f172a] text-white">Quincenal (Cada 15 días)</option>
                  <option value="MONTHLY" className="bg-[#0f172a] text-white">Mensual (Cada 30 días)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-emerald-400">Resumen a Registrar:</p>
                <p className="text-slate-300 font-medium">• Dinero Libre: <span className="font-bold text-white">{formatCurrency(dineroLibre)}</span></p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCaptureSnapshot}
                  disabled={createGlobalSnapshotMutation.isPending}
                  className="px-4 py-2 btn-emerald rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {createGlobalSnapshotMutation.isPending ? 'Guardando...' : 'Confirmar y Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
