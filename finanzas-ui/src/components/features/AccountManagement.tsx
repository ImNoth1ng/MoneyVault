import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, AlertCircle, MoreVertical, DollarSign, Settings2, Banknote, CreditCard, Wallet, TrendingUp, Camera } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '../common/Feedback';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useCreateSnapshot } from '../../hooks/useAccounts';
import { Account } from '../../types';
import { formatCurrency, getAccountTypeIcon } from '../../utils/formatters';
import { AccountModal } from './AccountModal';
import { CashBreakdownModal } from './CashBreakdownModal';

export const AccountManagement = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const { data: accountsData, isLoading, error } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const snapshotMutation = useCreateSnapshot();

  const [activeTab, setActiveTab] = useState<'DEBIT' | 'CREDIT' | 'CASH' | 'INVESTMENT'>('DEBIT');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit_balance' | 'edit_full'>('create');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeParam) {
      const upper = typeParam.toUpperCase();
      if (upper === 'CREDIT' || upper === 'DEBIT' || upper === 'CASH' || upper === 'INVESTMENT') {
        setActiveTab(upper as any);
      }
    }
  }, [typeParam]);

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const accounts = accountsData || [];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedAccount(null);
    setShowModal(true);
  };

  const handleEditBalance = (account: Account) => {
    setModalMode('edit_balance');
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleOpenCashBreakdown = (account: Account) => {
    setSelectedAccount(account);
    setShowCashModal(true);
  };

  const handleSaveCashBreakdown = async (payload: {
    currentBalance: number;
    b1000Count: number;
    b500Count: number;
    b200Count: number;
    b100Count: number;
    b50Count: number;
    b20Count: number;
  }) => {
    if (!selectedAccount) return;
    try {
      const fullAccountRequest = {
        name: selectedAccount.name,
        type: selectedAccount.type,
        currency: selectedAccount.currency || 'MXN',
        creditLimit: selectedAccount.creditLimit ? Number(selectedAccount.creditLimit) : undefined,
        ...payload,
      };

      await updateMutation.mutateAsync({
        id: selectedAccount.id,
        account: fullAccountRequest as any,
      });
      triggerFeedback('success', `Saldo de efectivo actualizado a ${formatCurrency(payload.currentBalance)}`);
      setShowCashModal(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error al guardar el desglose de billetes';
      triggerFeedback('error', msg);
    }
  };

  const handleCreateSnapshot = async (account: Account) => {
    try {
      await snapshotMutation.mutateAsync({
        accountId: account.id,
        frequency: 'FIFTEEN_DAYS',
      });
      triggerFeedback('success', `Snapshot de ${account.name} registrado correctamente`);
    } catch (err: any) {
      triggerFeedback('error', 'Error al registrar snapshot de cuenta');
    }
  };

  const handleEditFull = (account: Account) => {
    setModalMode('edit_full');
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
      try {
        await deleteMutation.mutateAsync(id);
        triggerFeedback('success', 'Cuenta eliminada exitosamente');
      } catch (err: any) {
        triggerFeedback('error', 'Error al eliminar la cuenta');
      }
    }
  };

  const handleSave = async (data: Partial<Account>) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(data as any);
        triggerFeedback('success', 'Cuenta guardada exitosamente');
      } else if (selectedAccount) {
        await updateMutation.mutateAsync({ id: selectedAccount.id, account: data });
        triggerFeedback('success', 'Cuenta actualizada exitosamente');
      }
      setShowModal(false);
    } catch (err: any) {
      triggerFeedback('error', 'Error al guardar los datos de la cuenta');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Cargando cuentas..." />;
  }

  if (error) {
    return <ErrorMessage message="No se pudieron cargar las cuentas" />;
  }

  const filteredAccounts = accounts.filter((a) => {
    const t = String(a.type || 'DEBIT').toUpperCase();
    if (activeTab === 'CREDIT') return t === 'CREDIT' || t === 'CREDIT_CARD';
    return t === activeTab;
  });

  const getCategoryTitle = () => {
    switch (activeTab) {
      case 'CREDIT':
        return 'Tarjetas de Crédito';
      case 'CASH':
        return 'Cuentas de Efectivo';
      case 'INVESTMENT':
        return 'Inversiones';
      default:
        return 'Cuentas de Débito';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/30'
              : 'bg-rose-950/80 text-rose-200 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="text-xs font-bold">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Encabezado Limpio Sin Menú Redundante */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              {activeTab === 'CREDIT' ? <CreditCard className="w-6 h-6" /> : activeTab === 'CASH' ? <Banknote className="w-6 h-6" /> : activeTab === 'INVESTMENT' ? <TrendingUp className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
            </span>
            <span>{getCategoryTitle()}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Gestión de saldos y configuración de {getCategoryTitle().toLowerCase()}</p>
        </div>
        
        <button
          onClick={handleCreate}
          className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Grid de Cuentas Filtradas */}
      {filteredAccounts.length === 0 ? (
        <div className="glass-card border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-sm font-medium mb-4">No tienes cuentas registradas en {getCategoryTitle().toLowerCase()}.</p>
          <button onClick={handleCreate} className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Crear cuenta en esta categoría</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEditBalance={handleEditBalance}
              onEditFull={handleEditFull}
              onDelete={handleDelete}
              onOpenCashBreakdown={handleOpenCashBreakdown}
              onSnapshot={handleCreateSnapshot}
            />
          ))}
        </div>
      )}

      {/* Modal de crear/editar */}
      {showModal && (
        <AccountModal
          mode={modalMode}
          account={selectedAccount}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Modal de Desglose de Billetes en Efectivo */}
      {showCashModal && selectedAccount && (
        <CashBreakdownModal
          account={selectedAccount}
          onClose={() => setShowCashModal(false)}
          onSave={handleSaveCashBreakdown}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
};

interface AccountCardProps {
  account: Account;
  onEditBalance: (account: Account) => void;
  onEditFull: (account: Account) => void;
  onDelete: (id: string | number) => void;
  onOpenCashBreakdown: (account: Account) => void;
  onSnapshot: (account: Account) => void;
}

const AccountCard = ({ account, onEditBalance, onEditFull, onDelete, onOpenCashBreakdown, onSnapshot }: AccountCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const balance = parseFloat(String(account.currentBalance || 0));
  const creditLimit = account.creditLimit ? parseFloat(String(account.creditLimit)) : 0;
  const usedCredit = account.usedCredit ? parseFloat(String(account.usedCredit)) : 0;
  const percentageUsed = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;
  const isCash = account.type === 'CASH';

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between group relative">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400">
              {getAccountTypeIcon(account.type)}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-tight">{account.name}</h3>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {account.currency || 'MXN'}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Opciones de cuenta"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-8 w-48 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl z-30 p-1.5 text-xs space-y-1 backdrop-blur-xl animate-in fade-in duration-150"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEditFull(account);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg font-bold flex items-center gap-2 transition"
                >
                  <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Configuración completa</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(account.id);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/15 rounded-lg font-bold flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Eliminar cuenta</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Saldo Actual</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(balance)}</p>
          </div>

          {(account.type === 'CREDIT' || String(account.type) === 'CREDIT_CARD') && creditLimit > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-400 font-medium">Límite ocupado</span>
                <span className="font-bold text-slate-200">
                  {formatCurrency(usedCredit)} / {formatCurrency(creditLimit)}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all ${percentageUsed > 80 ? 'bg-rose-500' : percentageUsed > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => onEditBalance(account)}
          className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-1 justify-center"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Saldo</span>
        </button>

        {isCash && (
          <button
            onClick={() => onOpenCashBreakdown(account)}
            className="px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-1 justify-center"
            title="Calculadora de Billetes"
          >
            <Banknote className="w-3.5 h-3.5 text-cyan-400" />
            <span>Billetes</span>
          </button>
        )}

        <button
          onClick={() => onSnapshot(account)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-1 justify-center"
          title="Tomar Snapshot de Cuenta"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Snapshot</span>
        </button>
      </div>
    </div>
  );
};
