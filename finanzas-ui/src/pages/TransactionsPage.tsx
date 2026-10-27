import { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  Search,
  Tag,
  Filter,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Receipt,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { TransactionModal } from '../components/features/TransactionModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Transaction } from '../types';

export const TransactionsPage = () => {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const deleteTxMutation = useDeleteTransaction();

  // Estados de control y filtros
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenModal = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER') => {
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (tx: Transaction) => {
    const isCredit = tx.accountType === 'CREDIT';
    let impactText = '';
    if (tx.type === 'EXPENSE') {
      impactText = isCredit
        ? 'Se restará este monto de la deuda de tu tarjeta de crédito.'
        : 'Se devolverá este monto al saldo disponible de tu cuenta.';
    } else if (tx.type === 'INCOME') {
      impactText = 'Se descontará este monto del saldo de tu cuenta.';
    } else {
      impactText = 'Se restaurarán los saldos de ambas cuentas involucradas.';
    }

    if (!window.confirm(`¿Eliminar este movimiento de ${formatCurrency(Number(tx.amount) || 0)}?\n\n${impactText}`)) {
      return;
    }

    try {
      await deleteTxMutation.mutateAsync(tx.id);
      triggerFeedback('success', 'Movimiento eliminado y saldos de cuentas restaurados exitosamente.');
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al eliminar movimiento.');
    }
  };

  // Clave del mes actual en formato YYYY-MM
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Mes seleccionado (por defecto el mes actual)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Helper para obtener YYYY-MM de una transacción
  const getMonthKey = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Formato legible en español para el mes
  const formatMonthName = (monthKey: string) => {
    if (!monthKey || monthKey === 'ALL') return 'Todo el Histórico';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 'ALL') {
      setSelectedMonth(currentMonthKey);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevKey);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'ALL') {
      setSelectedMonth(currentMonthKey);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextKey);
  };

  // Lista de meses disponibles basados en las transacciones registradas + mes actual
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthKey);
    transactions.forEach((t) => {
      const key = getMonthKey(t.transactionDate || t.createdAt);
      if (key) months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [transactions, currentMonthKey]);

  // Transacciones acotadas al mes seleccionado (para alimentar KPIs del mes)
  const monthTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((tx) => {
      const txMonth = getMonthKey(tx.transactionDate || tx.createdAt);
      return txMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // KPIs calculados sobre el mes seleccionado
  const totalExpenses = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [monthTransactions]);

  const totalIncomes = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [monthTransactions]);

  const netFlow = totalIncomes - totalExpenses;

  // Lista de tags únicos dentro del periodo seleccionado
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    monthTransactions.forEach((t) => {
      if (t.category && t.category.trim()) {
        tags.add(t.category.trim());
      }
    });
    return Array.from(tags);
  }, [monthTransactions]);

  // Filtrado de transacciones para la tabla
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((tx) => {
      // 1. Tab
      if (activeTab !== 'ALL' && tx.type !== activeTab) return false;

      // 2. Tag
      if (selectedTag !== 'ALL' && tx.category !== selectedTag) return false;

      // 3. Cuenta
      if (selectedAccountId !== 'ALL') {
        const matchesOrigin = String(tx.accountId) === String(selectedAccountId);
        const matchesDest = String(tx.destinationAccountId) === String(selectedAccountId);
        if (!matchesOrigin && !matchesDest) return false;
      }

      // 4. Búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const senderMatch = (tx.senderOrRecipient || '').toLowerCase().includes(query);
        const accMatch = (tx.accountName || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch && !senderMatch && !accMatch) return false;
      }

      return true;
    });
  }, [monthTransactions, activeTab, selectedTag, selectedAccountId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Botones de Creación Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Movimientos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Control de Flujo
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
            Registro detallado de gastos, compras, ingresos, depósitos y transferencias
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenModal('EXPENSE')}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-rose-950/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Gasto</span>
          </button>

          <button
            onClick={() => handleOpenModal('INCOME')}
            className="px-4 py-2.5 btn-emerald rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Ingreso</span>
          </button>

          <button
            onClick={() => handleOpenModal('TRANSFER')}
            className="px-3.5 py-2.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Transferir entre cuentas propias"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Transferir</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/30 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 📅 BARRA SELECTORA DE MES (FILTRO MENSUAL / HISTÓRICO) */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevMonth}
            disabled={selectedMonth === 'ALL'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mes Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <optgroup label="Filtrar por Mes">
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {formatMonthName(mKey)} {mKey === currentMonthKey ? '(Mes Actual)' : ''}
                  </option>
                ))}
              </optgroup>
              <option value="ALL">Todo el Histórico (Sin filtro de mes)</option>
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={selectedMonth === 'ALL'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mes Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Acceso rápido a Mes Actual o Histórico */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedMonth !== currentMonthKey && (
            <button
              onClick={() => setSelectedMonth(currentMonthKey)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ir a Mes Actual</span>
            </button>
          )}

          {selectedMonth !== 'ALL' ? (
            <button
              onClick={() => setSelectedMonth('ALL')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              Ver Todo el Histórico
            </button>
          ) : (
            <span className="text-[11px] font-bold text-cyan-400 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/30">
              Histórico Completo Activo
            </span>
          )}
        </div>
      </div>

      {/* 📊 TARJETAS KPI DE RESUMEN FINANCIERO (Calculadas para el Mes Seleccionado) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Gastos */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Total Gastos {selectedMonth === 'ALL' ? 'Histórico' : `(${formatMonthName(selectedMonth)})`}
            </p>
            <p className="text-2xl font-black text-rose-300 mt-1">{formatCurrency(totalExpenses)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              {monthTransactions.filter((t) => t.type === 'EXPENSE').length} gasto(s) en {selectedMonth === 'ALL' ? 'histórico' : formatMonthName(selectedMonth)}
            </p>
          </div>
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Total Ingresos {selectedMonth === 'ALL' ? 'Histórico' : `(${formatMonthName(selectedMonth)})`}
            </p>
            <p className="text-2xl font-black text-emerald-300 mt-1">{formatCurrency(totalIncomes)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              {monthTransactions.filter((t) => t.type === 'INCOME').length} depósito(s) o abonos
            </p>
          </div>
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Balance Neto */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              Flujo Neto {selectedMonth === 'ALL' ? 'Histórico' : `(${formatMonthName(selectedMonth)})`}
            </p>
            <p
              className={`text-2xl font-black mt-1 ${
                netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netFlow >= 0 ? `+${formatCurrency(netFlow)}` : formatCurrency(netFlow)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              {netFlow >= 0 ? 'Superávit en el periodo' : 'Déficit en el periodo'}
            </p>
          </div>
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Registros */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Movimientos {selectedMonth === 'ALL' ? 'Histórico' : `(${formatMonthName(selectedMonth)})`}
            </p>
            <p className="text-2xl font-black text-white mt-1">{monthTransactions.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
              Registros en el periodo
            </p>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🔍 BARRA DE FILTROS Y CONTROLES */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Pestañas Principales (Todos, Gastos, Ingresos, Transferencias) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todos ({monthTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Gastos ({monthTransactions.filter((t) => t.type === 'EXPENSE').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingresos ({monthTransactions.filter((t) => t.type === 'INCOME').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('TRANSFER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'TRANSFER'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transferencias ({monthTransactions.filter((t) => t.type === 'TRANSFER').length})</span>
            </button>
          </div>

          {/* Filtro por Cuenta */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase hidden md:inline">Cuenta:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">Todas las cuentas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscador y Etiquetas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descripción, etiqueta, cuenta o remitente..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-500"
            />
          </div>

          {/* Chips de Etiquetas Rápidas */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 flex-shrink-0">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>Etiqueta:</span>
              </span>
              <button
                onClick={() => setSelectedTag('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex-shrink-0 border ${
                  selectedTag === 'ALL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Todas
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? 'ALL' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex-shrink-0 border ${
                    selectedTag === tag
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 📋 LISTADO DE MOVIMIENTOS */}
      {isLoading ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 text-slate-400 text-xs font-bold">
          Cargando movimientos...
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-bold">
          Error al cargar los movimientos del usuario.
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {monthTransactions.length === 0 && selectedMonth !== 'ALL'
              ? `Sin movimientos en ${formatMonthName(selectedMonth)}`
              : 'No hay movimientos registrados'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            {transactions.length === 0
              ? 'Empieza registrando tus gastos diarios o tus ingresos para tener el control total de tus cuentas y dinero libre.'
              : monthTransactions.length === 0 && selectedMonth !== 'ALL'
              ? `Aún no has registrado gastos ni ingresos en este mes (${formatMonthName(selectedMonth)}). Puedes registrar uno nuevo o consultar otro periodo.`
              : 'No se encontraron movimientos que coincidan con los filtros seleccionados.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {monthTransactions.length === 0 && selectedMonth !== 'ALL' && transactions.length > 0 && (
              <button
                onClick={() => setSelectedMonth('ALL')}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Ver Todo el Histórico ({transactions.length})
              </button>
            )}
            <button
              onClick={() => handleOpenModal('EXPENSE')}
              className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Registrar Gasto</span>
            </button>
            <button
              onClick={() => handleOpenModal('INCOME')}
              className="px-4 py-2 btn-emerald rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0f172a]/80 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descripción y Detalle</th>
                  <th className="py-3 px-4">Cuenta / Origen</th>
                  <th className="py-3 px-4">Etiqueta</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const isExpense = tx.type === 'EXPENSE';
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';
                  const isCredit = tx.accountType === 'CREDIT';
                  const amountNum = Number(tx.amount) || 0;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Tipo Icono */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-xl ${
                              isExpense
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : isIncome
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {isExpense && <ArrowDownLeft className="w-4 h-4" />}
                            {isIncome && <ArrowUpRight className="w-4 h-4" />}
                            {isTransfer && <ArrowLeftRight className="w-4 h-4" />}
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              isExpense
                                ? 'text-rose-400'
                                : isIncome
                                ? 'text-emerald-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {isExpense ? 'Gasto' : isIncome ? 'Ingreso' : 'Traspaso'}
                          </span>
                        </div>
                      </td>

                      {/* Descripción y Remitente */}
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-white text-xs">
                          {tx.description || (isExpense ? 'Gasto registrado' : isIncome ? 'Ingreso registrado' : 'Transferencia')}
                        </p>
                        {tx.senderOrRecipient && (
                          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-cyan-400" />
                            <span>{tx.senderOrRecipient}</span>
                          </p>
                        )}
                        {tx.debtTicketId && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                            Ticket #{tx.debtTicketId} liquidado
                          </span>
                        )}
                      </td>

                      {/* Cuenta / Origen */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{tx.accountName || `Cuenta #${tx.accountId}`}</span>
                          {isTransfer && tx.destinationAccountName && (
                            <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 mt-0.5">
                              → {tx.destinationAccountName}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                            {isCredit ? 'Tarjeta Crédito (Deuda)' : tx.accountType || 'Cuenta'}
                          </span>
                        </div>
                      </td>

                      {/* Etiqueta */}
                      <td className="py-3.5 px-4">
                        {tx.category ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700/80 text-slate-300">
                            {tx.category}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px] italic">Sin etiqueta</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium text-[11px] whitespace-nowrap">
                        {tx.transactionDate ? formatDate(tx.transactionDate) : formatDate(tx.createdAt || '')}
                      </td>

                      {/* Monto */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-black text-sm ${
                            isExpense
                              ? 'text-rose-400'
                              : isIncome
                              ? 'text-emerald-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {isExpense ? `-${formatCurrency(amountNum)}` : isIncome ? `+${formatCurrency(amountNum)}` : formatCurrency(amountNum)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                          title="Eliminar movimiento y revertir saldos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear Movimiento */}
      <TransactionModal
        isOpen={isModalOpen}
        initialType={modalInitialType}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => triggerFeedback('success', msg)}
      />
    </div>
  );
};

export default TransactionsPage;
