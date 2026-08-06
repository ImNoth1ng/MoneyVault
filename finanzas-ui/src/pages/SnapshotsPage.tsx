import { useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/Feedback';
import { useAccounts, useAllSnapshots, useCreateGlobalSnapshot, useCreateSnapshot } from '../hooks/useAccounts';
import { useDebtTickets } from '../hooks/useDebts';
import { formatCurrency } from '../utils/formatters';

export const SnapshotsPage = () => {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: tickets = [], isLoading: ticketsLoading } = useDebtTickets();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useAllSnapshots();

  const createGlobalSnapshotMutation = useCreateGlobalSnapshot();
  const createSnapshotMutation = useCreateSnapshot();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State para Captura de Snapshot
  const [snapshotType, setSnapshotType] = useState<'GLOBAL' | 'ACCOUNT' | 'CREDIT_CARD' | 'CASH' | 'DEBTOR' | 'INVESTMENT'>('GLOBAL');
  const [selectedAccountId, setSelectedAccountId] = useState<string | number>('');
  const [frequency, setFrequency] = useState<'FIFTEEN_DAYS' | 'MONTHLY'>('FIFTEEN_DAYS');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (accountsLoading || ticketsLoading || snapshotsLoading) {
    return <LoadingSpinner text="Cargando Histórico de Snapshots..." />;
  }

  // Cálculos Financieros Actuales para pre-llenar los snapshots por tipo
  const debitAccounts = accounts.filter((a) => a.type === 'DEBIT' && a.active !== false);
  const totalDebit = debitAccounts.reduce((sum, a) => sum + parseFloat(String(a.currentBalance || 0)), 0);

  const creditAccounts = accounts.filter((a) => (a.type === 'CREDIT' || String(a.type) === 'CREDIT_CARD') && a.active !== false);
  const totalCreditDebt = creditAccounts.reduce((sum, a) => sum + (a.usedCredit !== undefined ? parseFloat(String(a.usedCredit)) : parseFloat(String(a.currentBalance || 0))), 0);

  const cashAccounts = accounts.filter((a) => a.type === 'CASH' && a.active !== false);
  const totalCash = cashAccounts.reduce((sum, a) => sum + parseFloat(String(a.currentBalance || 0)), 0);

  const pendingTickets = tickets.filter((t) => !Boolean(t.isPaid || t.status === 'PAID'));
  const totalPendingTickets = pendingTickets.reduce((sum, t) => sum + parseFloat(String(t.totalAmount || 0)), 0);

  const dineroLibre = (totalDebit + totalCash + totalPendingTickets) - totalCreditDebt;

  // Filtrado de la lista de snapshots
  const sortedSnapshots = [...snapshots].sort(
    (a: any, b: any) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
  );

  const filteredSnapshots = sortedSnapshots.filter((s: any) => {
    if (activeFilter === 'ALL') return true;
    return s.snapshotType === activeFilter;
  });

  const handleOpenModal = () => {
    setErrorMsg(null);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
    setShowModal(true);
  };

  const handleCreateSnapshot = async () => {
    setErrorMsg(null);
    try {
      if (snapshotType === 'GLOBAL') {
        await createGlobalSnapshotMutation.mutateAsync({
          customAmount: dineroLibre,
          frequency,
        });
      } else if (snapshotType === 'DEBTOR') {
        await createGlobalSnapshotMutation.mutateAsync({
          customAmount: totalPendingTickets,
          frequency,
        });
      } else if (selectedAccountId) {
        await createSnapshotMutation.mutateAsync({
          accountId: selectedAccountId,
          frequency,
        });
      } else {
        setErrorMsg('Selecciona una cuenta válida para el snapshot.');
        return;
      }

      setFeedback('¡Snapshot registrado exitosamente!');
      setTimeout(() => setFeedback(null), 3500);
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error al guardar snapshot');
    }
  };

  const getSnapshotTypeBadge = (type?: string) => {
    switch (type) {
      case 'GLOBAL':
        return <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-[9px]">GLOBAL</span>;
      case 'CREDIT_CARD':
        return <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full font-bold text-[9px]">CRÉDITO</span>;
      case 'CASH':
        return <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full font-bold text-[9px]">EFECTIVO</span>;
      case 'DEBTOR':
        return <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full font-bold text-[9px]">DEUDORES</span>;
      case 'INVESTMENT':
        return <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full font-bold text-[9px]">INVERSIÓN</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full font-bold text-[9px]">DÉBITO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Histórico de Snapshots</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
            Capturas y registros históricos por categoría (Dinero Libre, Débito, Crédito, Efectivo, Deudores e Inversiones)
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 btn-emerald text-xs font-bold rounded-xl transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Capturar Snapshot</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tarjetas Informativas de los Valores Actuales a Capturar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-card p-3.5 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase text-emerald-400">Dinero Libre</p>
          <p className="text-lg font-black text-white">{formatCurrency(dineroLibre)}</p>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase text-slate-300">Cuentas Débito</p>
          <p className="text-lg font-black text-white">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase text-rose-400">Tarjetas Crédito</p>
          <p className="text-lg font-black text-rose-300">-{formatCurrency(totalCreditDebt)}</p>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase text-cyan-400">Efectivo Billetes</p>
          <p className="text-lg font-black text-white">{formatCurrency(totalCash)}</p>
        </div>
        <div className="glass-card p-3.5 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase text-amber-400">Por Cobrar Tickets</p>
          <p className="text-lg font-black text-white">{formatCurrency(totalPendingTickets)}</p>
        </div>
      </div>

      {/* Filtros de Categoría de Snapshot */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold">
        <Filter className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-1" />
        {[
          { id: 'ALL', label: 'Todos' },
          { id: 'GLOBAL', label: '🌍 Global' },
          { id: 'ACCOUNT', label: '🏦 Débito' },
          { id: 'CREDIT_CARD', label: '💳 Crédito' },
          { id: 'CASH', label: '💵 Efectivo' },
          { id: 'DEBTOR', label: '👥 Deudores' },
          { id: 'INVESTMENT', label: '📈 Inversión' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl transition flex-shrink-0 ${
              activeFilter === tab.id
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla Principal de Histórico de Snapshots */}
      <Card title="Tabla de Registros Históricos" subtitle={`${filteredSnapshots.length} snapshot(s) encontrados`}>
        {filteredSnapshots.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center font-medium">
            No se encontraron snapshots en esta categoría. Presiona "Capturar Snapshot" para guardar un nuevo registro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Nombre / Origen</th>
                  <th className="py-3 px-4">Frecuencia</th>
                  <th className="py-3 px-4">Notas / Desglose</th>
                  <th className="py-3 px-4 text-right">Monto Capturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSnapshots.map((snap: any) => (
                  <tr key={snap.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                      {new Date(snap.snapshotDate).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">{getSnapshotTypeBadge(snap.snapshotType)}</td>
                    <td className="py-3.5 px-4 font-black text-white">{snap.accountName || 'Resumen Global'}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full uppercase">
                        {snap.frequency || 'FIFTEEN_DAYS'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{snap.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(parseFloat(String(snap.snapshotAmount || 0)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Captura */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#0f172a]/95 rounded-2xl border border-emerald-500/30 w-full max-w-md p-6 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span>Registrar Snapshot</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 font-medium">
              Escoge el tipo de snapshot que deseas tomar para tus estadísticas históricas.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">Tipo de Snapshot *</label>
                <select
                  value={snapshotType}
                  onChange={(e) => setSnapshotType(e.target.value as any)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f172a] text-white font-semibold"
                >
                  <option value="GLOBAL" className="bg-[#0f172a] text-white">🌍 Resumen Global (Dinero Libre)</option>
                  <option value="ACCOUNT" className="bg-[#0f172a] text-white">🏦 Cuenta de Débito</option>
                  <option value="CREDIT_CARD" className="bg-[#0f172a] text-white">💳 Tarjeta de Crédito</option>
                  <option value="CASH" className="bg-[#0f172a] text-white">💵 Efectivo / Billetes</option>
                  <option value="DEBTOR" className="bg-[#0f172a] text-white">👥 Tickets de Deudores</option>
                  <option value="INVESTMENT" className="bg-[#0f172a] text-white">📈 Cuenta de Inversión</option>
                </select>
              </div>

              {(snapshotType === 'ACCOUNT' || snapshotType === 'CREDIT_CARD' || snapshotType === 'CASH' || snapshotType === 'INVESTMENT') && accounts.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">Cuenta Específica *</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f172a] text-white font-semibold"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#0f172a] text-white">
                        {a.name} ({a.type}) - Saldo: {formatCurrency(parseFloat(String(a.currentBalance || 0)))}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-emerald-400 mb-1.5">Frecuencia *</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f172a] text-white font-semibold"
                >
                  <option value="FIFTEEN_DAYS" className="bg-[#0f172a] text-white">Quincenal (Cada 15 días)</option>
                  <option value="MONTHLY" className="bg-[#0f172a] text-white">Mensual (Cada 30 días)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSnapshot}
                  className="px-4 py-2 btn-emerald rounded-xl text-xs font-bold transition"
                >
                  Confirmar Snapshot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
