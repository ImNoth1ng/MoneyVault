import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  DollarSign,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  useInvestments,
  usePortfolioSummary,
  useCreateHolding,
  useDeleteHolding,
  useRefreshedQuotes
} from '../hooks/useInvestments';
import { useAccounts, useCreateAccount, useUpdateAccount } from '../hooks/useAccounts';
import { TransactionModal } from '../components/features/TransactionModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { InvestmentHolding, AccountType } from '../types';
import apiClient from '../lib/apiClient';

const POPULAR_TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp (BMV / SIC)', assetType: 'STOCK' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF (BMV / SIC)', assetType: 'ETF' },
  { symbol: 'WALMEX', name: 'Walmart de México (BMV)', assetType: 'STOCK' },
  { symbol: 'AAPL', name: 'Apple Inc (BMV / SIC)', assetType: 'STOCK' },
  { symbol: 'MSFT', name: 'Microsoft Corp (BMV / SIC)', assetType: 'STOCK' },
  { symbol: 'CEMEXCPO', name: 'Cemex CPO (BMV)', assetType: 'STOCK' },
  { symbol: 'FEMSAUBD', name: 'Fomento Económico Mexicano (BMV)', assetType: 'STOCK' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF (BMV / SIC)', assetType: 'ETF' },
];

export default function InvestmentsPage() {
  const { data: accounts = [] } = useAccounts();
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | number>('ALL');

  const { data: holdings = [], isLoading: holdingsLoading, refetch: refetchHoldings } = useInvestments(selectedBrokerId);
  const { data: portfolioSummary, isLoading: summaryLoading, refetch: refetchSummary } = usePortfolioSummary();

  const createHoldingMutation = useCreateHolding();
  const deleteHoldingMutation = useDeleteHolding();
  const refreshQuotesMutation = useRefreshedQuotes();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  // Estados locales
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modales
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isCreateBrokerModalOpen, setIsCreateBrokerModalOpen] = useState(false);
  const [isEditCashModalOpen, setIsEditCashModalOpen] = useState(false);
  const [deleteConfirmHolding, setDeleteConfirmHolding] = useState<InvestmentHolding | null>(null);
  const [refundToCashOnDelete, setRefundToCashOnDelete] = useState(true);

  // Formulario editar saldo líquido broker
  const [editCashBrokerId, setEditCashBrokerId] = useState<string | number>('');
  const [editCashAmount, setEditCashAmount] = useState<string>('');

  // Formulario de compra (por default en pesos mexicanos)
  const [buyBrokerId, setBuyBrokerId] = useState<string | number>('');
  const [buySymbol, setBuySymbol] = useState('');
  const [buyName, setBuyName] = useState('');
  const [buyQuantity, setBuyQuantity] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [buyCurrency, setBuyCurrency] = useState<'USD' | 'MXN'>('MXN');
  const [buyAssetType, setBuyAssetType] = useState('STOCK');
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [buyDeductFromCash, setBuyDeductFromCash] = useState(true);
  const [buyNotes, setBuyNotes] = useState('');
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [fetchedLivePrice, setFetchedLivePrice] = useState<number | null>(null);
  const [fetchedQuoteMeta, setFetchedQuoteMeta] = useState<{ exchangeName?: string; currency?: string } | null>(null);

  // Formulario nuevo broker (por default en pesos mexicanos)
  const [newBrokerName, setNewBrokerName] = useState('');
  const [newBrokerInitialBalance, setNewBrokerInitialBalance] = useState('');
  const [newBrokerCurrency, setNewBrokerCurrency] = useState('MXN');

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Cuentas de Inversión activas
  const brokerAccounts = useMemo(() => {
    return accounts.filter((a) => a.type === AccountType.INVESTMENT && a.active !== false);
  }, [accounts]);

  const selectedBroker = useMemo(() => {
    if (selectedBrokerId === 'ALL') return null;
    return brokerAccounts.find((b) => String(b.id) === String(selectedBrokerId)) || null;
  }, [selectedBrokerId, brokerAccounts]);

  // Manejo de refresh de cotizaciones
  const handleRefreshQuotes = async () => {
    try {
      await refreshQuotesMutation.mutateAsync();
      await refetchHoldings();
      await refetchSummary();
      triggerFeedback('success', 'Cotizaciones de mercado actualizadas en tiempo real.');
    } catch (err: any) {
      triggerFeedback('error', 'Error al refrescar cotizaciones de mercado.');
    }
  };

  // Consultar precio al ingresar ticker
  const handleLookupTicker = async (symbolToLook: string) => {
    const cleanSym = symbolToLook.trim().toUpperCase();
    if (!cleanSym) return;

    setIsFetchingQuote(true);
    setFetchedLivePrice(null);
    try {
      const client = apiClient.getClient();
      const { data } = await client.get<Record<string, any>>('/investments/quotes', {
        params: { symbols: cleanSym, refresh: false }
      });

      if (data && data[cleanSym]) {
        const quote = data[cleanSym];
        const liveP = Number(quote.regularMarketPrice) || 0;
        if (liveP > 0) {
          setFetchedLivePrice(liveP);
          setFetchedQuoteMeta({
            exchangeName: quote.exchangeName,
            currency: quote.currency
          });
          if (!buyName && quote.shortName) {
            setBuyName(quote.shortName);
          }
          if (quote.currency) {
            setBuyCurrency(quote.currency === 'MXN' ? 'MXN' : 'USD');
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo autocompletar ticker:', e);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSelectPopularTicker = (item: { symbol: string; name: string; assetType: string }) => {
    setBuySymbol(item.symbol);
    setBuyName(item.name);
    setBuyAssetType(item.assetType);
    handleLookupTicker(item.symbol);
  };

  // Manejo de modal para editar dinero líquido del broker
  const handleOpenEditCashModal = (brokerId?: string | number) => {
    const targetId = brokerId || (selectedBrokerId !== 'ALL' ? selectedBrokerId : brokerAccounts[0]?.id);
    if (!targetId) {
      triggerFeedback('error', 'Crea una cuenta de broker primero.');
      return;
    }
    const targetBroker = brokerAccounts.find((b) => String(b.id) === String(targetId));
    setEditCashBrokerId(targetId);
    setEditCashAmount(targetBroker ? String(targetBroker.currentBalance || '') : '');
    setIsEditCashModalOpen(true);
  };

  const handleSaveEditCash = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBroker = brokerAccounts.find((b) => String(b.id) === String(editCashBrokerId));
    if (!targetBroker) return;

    const newBal = parseFloat(editCashAmount);
    if (isNaN(newBal) || newBal < 0) {
      triggerFeedback('error', 'Ingresa un saldo válido mayor o igual a 0.');
      return;
    }

    try {
      await updateAccountMutation.mutateAsync({
        id: targetBroker.id,
        account: {
          name: targetBroker.name,
          type: targetBroker.type,
          currency: targetBroker.currency || 'MXN',
          currentBalance: newBal,
        },
      });

      triggerFeedback('success', `Saldo líquido de ${targetBroker.name} actualizado a ${formatCurrency(newBal)}.`);
      setIsEditCashModalOpen(false);
      refetchSummary();
      refetchHoldings();
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al actualizar el saldo líquido.');
    }
  };

  const handleOpenBuyModal = () => {
    if (brokerAccounts.length === 0) {
      setIsCreateBrokerModalOpen(true);
      return;
    }
    const defaultBroker = selectedBrokerId !== 'ALL' ? selectedBrokerId : brokerAccounts[0].id;
    setBuyBrokerId(defaultBroker);
    setBuySymbol('');
    setBuyName('');
    setBuyQuantity('');
    setBuyPrice('');
    setBuyCurrency('MXN');
    setBuyAssetType('STOCK');
    setBuyDate(new Date().toISOString().slice(0, 10));
    setBuyDeductFromCash(true);
    setBuyNotes('');
    setFetchedLivePrice(null);
    setFetchedQuoteMeta(null);
    setIsBuyModalOpen(true);
  };

  const handleSubmitBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(buyQuantity);
    const prc = parseFloat(buyPrice);

    if (isNaN(qty) || qty <= 0) {
      triggerFeedback('error', 'Ingresa una cantidad de títulos válida mayor a 0.');
      return;
    }
    if (isNaN(prc) || prc <= 0) {
      triggerFeedback('error', 'Ingresa un precio de compra válido mayor a 0.');
      return;
    }
    if (!buyBrokerId) {
      triggerFeedback('error', 'Selecciona la cuenta broker de inversión.');
      return;
    }

    try {
      await createHoldingMutation.mutateAsync({
        accountId: buyBrokerId,
        symbol: buySymbol.trim().toUpperCase(),
        name: buyName.trim() || buySymbol.trim().toUpperCase(),
        quantity: qty,
        buyPrice: prc,
        currency: buyCurrency,
        assetType: buyAssetType,
        buyDate: buyDate ? new Date(buyDate).toISOString() : undefined,
        deductFromCash: buyDeductFromCash,
        notes: buyNotes.trim() || undefined
      });

      triggerFeedback('success', `Posición de ${qty} ${buySymbol.toUpperCase()} registrada con éxito.`);
      setIsBuyModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al registrar la posición.';
      triggerFeedback('error', msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmHolding) return;
    try {
      await deleteHoldingMutation.mutateAsync({
        id: deleteConfirmHolding.id,
        refundToCash: refundToCashOnDelete
      });
      triggerFeedback('success', `Posición de ${deleteConfirmHolding.symbol} eliminada.`);
      setDeleteConfirmHolding(null);
    } catch (err: any) {
      triggerFeedback('error', 'Error al eliminar la posición.');
    }
  };

  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrokerName.trim()) {
      triggerFeedback('error', 'El nombre del broker es obligatorio (ej: GBM+, Bursanet).');
      return;
    }

    try {
      const initialBal = parseFloat(newBrokerInitialBalance) || 0;
      await createAccountMutation.mutateAsync({
        name: newBrokerName.trim(),
        type: 'INVESTMENT' as any,
        currentBalance: initialBal,
        currency: newBrokerCurrency
      });

      triggerFeedback('success', `Cuenta de inversión "${newBrokerName.trim()}" creada con éxito.`);
      setIsCreateBrokerModalOpen(false);
      setNewBrokerName('');
      setNewBrokerInitialBalance('');
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al crear la cuenta broker.');
    }
  };

  // Filtrado de holdings para la tabla
  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = h.symbol.toLowerCase().includes(q);
        const matchesName = h.name?.toLowerCase().includes(q);
        const matchesBroker = h.accountName?.toLowerCase().includes(q);
        return matchesSymbol || matchesName || matchesBroker;
      }
      return true;
    });
  }, [holdings, searchQuery]);

  // Métricas calculadas para la vista activa (Global o Broker seleccionado)
  const activeMetrics = useMemo(() => {
    if (selectedBroker && portfolioSummary?.brokers) {
      const bSummary = portfolioSummary.brokers.find((b) => String(b.accountId) === String(selectedBroker.id));
      if (bSummary) {
        return {
          totalPortfolio: bSummary.totalPortfolioValue,
          cashAvailable: bSummary.cashAvailable,
          assetsValue: bSummary.investedValue,
          totalCost: bSummary.totalCost,
          gainLoss: bSummary.gainLoss,
          gainLossPercent: bSummary.gainLossPercent,
          currency: bSummary.currency || 'MXN',
          holdingsCount: bSummary.holdingsCount
        };
      }
    }

    return {
      totalPortfolio: portfolioSummary?.totalPortfolioValueMxn || 0,
      cashAvailable: portfolioSummary?.totalCashAvailableMxn || 0,
      assetsValue: portfolioSummary?.totalAssetsValueMxn || 0,
      totalCost: portfolioSummary?.totalCostBasisMxn || 0,
      gainLoss: portfolioSummary?.totalGainLossMxn || 0,
      gainLossPercent: portfolioSummary?.totalGainLossPercent || 0,
      currency: 'MXN',
      holdingsCount: holdings.length
    };
  }, [selectedBroker, portfolioSummary, holdings.length]);

  // Datos para gráfico de barras comparativo (Costo vs Valor Actual por Activo)
  const comparisonBarData = useMemo(() => {
    return holdings.slice(0, 8).map((h) => {
      const invested = Number(h.totalInvestedInAccountCurrency || h.totalInvested) || 0;
      const current = Number(h.currentValueInAccountCurrency || h.currentValue) || 0;
      return {
        symbol: h.symbol,
        Invertido: invested,
        'Valor Actual': current
      };
    });
  }, [holdings]);

  // Datos para gráfico de pastel de asignación
  const allocationPieData = useMemo(() => {
    if (portfolioSummary?.allocation && portfolioSummary.allocation.length > 0) {
      return portfolioSummary.allocation;
    }
    return [];
  }, [portfolioSummary]);

  const selectedBrokerTarget = brokerAccounts.find((b) => String(b.id) === String(buyBrokerId));
  const estimatedCost = (parseFloat(buyQuantity) || 0) * (parseFloat(buyPrice) || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 🚀 CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Mercado Bursátil & Carteras
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portafolio de Inversiones
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Monitoreo en tiempo real de acciones, ETFs, brokers y pool de liquidez
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefreshQuotes}
            disabled={refreshQuotesMutation.isPending}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow hover:text-white"
            title="Refrescar cotizaciones de mercado en tiempo real"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshQuotesMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Refrescar Mercado</span>
          </button>

          <button
            onClick={() => setIsFundModalOpen(true)}
            className="px-3.5 py-2.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
            title="Transferir fondos desde tu cuenta bancaria al pool de liquidez del broker"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>Mandar a Invertir</span>
          </button>

          <button
            onClick={handleOpenBuyModal}
            className="px-4 py-2.5 btn-emerald text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-950/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Posición / Compra</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
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

      {/* 📊 TARJETAS KPIS DE RENDIMIENTO Y LIQUIDEZ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valor Total Portafolio */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
              VALOR TOTAL CARTERA
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <p className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight truncate" title={formatCurrency(activeMetrics.totalPortfolio)}>
              {formatCurrency(activeMetrics.totalPortfolio)}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium truncate">
            <span>Líquido + Activos valorizados</span>
          </div>
        </div>

        {/* KPI 2: Efectivo Líquido Disponible (Pool de Inversión) */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-widest truncate">
              PODER DE COMPRA LÍQUIDO
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEditCashModal()}
                className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                title="Editar directamente el dinero líquido en el broker"
              >
                <DollarSign className="w-3 h-3 text-cyan-400" />
                <span>Editar</span>
              </button>
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Wallet className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div className="my-1">
            <p className="text-xl sm:text-2xl font-mono font-black text-cyan-300 tracking-tight truncate" title={formatCurrency(activeMetrics.cashAvailable)}>
              {formatCurrency(activeMetrics.cashAvailable)}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="truncate">Efectivo libre en broker</span>
            {selectedBroker && (
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                {selectedBroker.name}
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Activos Invertidos */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
              VALOR MERCADO ACTIVOS
            </span>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-300 flex-shrink-0">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <p className="text-xl sm:text-2xl font-mono font-black text-slate-100 tracking-tight truncate" title={formatCurrency(activeMetrics.assetsValue)}>
              {formatCurrency(activeMetrics.assetsValue)}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium truncate">
            <span>Costo base: {formatCurrency(activeMetrics.totalCost)}</span>
          </div>
        </div>

        {/* KPI 4: Rendimiento Acumulado */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700/80 transition shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest truncate ${
                activeMetrics.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              RENDIMIENTO HISTÓRICO
            </span>
            <div
              className={`p-2 rounded-xl border flex-shrink-0 ${
                activeMetrics.gainLoss >= 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {activeMetrics.gainLoss >= 0 ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>
          </div>
          <div className="my-1">
            <p
              className={`text-xl sm:text-2xl font-mono font-black tracking-tight truncate ${
                activeMetrics.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={`${activeMetrics.gainLoss >= 0 ? '+' : ''}${formatCurrency(activeMetrics.gainLoss)}`}
            >
              {activeMetrics.gainLoss >= 0 ? '+' : ''}
              {formatCurrency(activeMetrics.gainLoss)}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
            <span className={activeMetrics.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {activeMetrics.gainLoss >= 0 ? '▲ +' : '▼ '}
              {activeMetrics.gainLossPercent.toFixed(2)}% ROI
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Histórico</span>
          </div>
        </div>
      </div>

      {/* 🧭 SELECTOR DE BROKERS (TABS) & TIPO DE CAMBIO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
        
        {/* Pestañas de brokers */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 min-w-0">
          <button
            onClick={() => setSelectedBrokerId('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              selectedBrokerId === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Todos los Brokers</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] rounded-md text-slate-300">
              {holdings.length}
            </span>
          </button>

          {brokerAccounts.map((broker) => {
            const isSelected = String(selectedBrokerId) === String(broker.id);
            return (
              <div
                key={broker.id}
                className={`flex items-center rounded-xl transition flex-shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-500/40 shadow text-cyan-300'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBrokerId(broker.id)}
                  className="px-3 py-2 text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{broker.name}</span>
                  <span className="text-[10px] font-mono font-medium text-slate-300 bg-slate-800/90 px-1.5 py-0.5 rounded-md">
                    Líq: {formatCurrency(Number(broker.currentBalance) || 0)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditCashModal(broker.id);
                  }}
                  className="p-1.5 mr-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 transition"
                  title={`Editar dinero líquido disponible en ${broker.name}`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => handleOpenEditCashModal()}
            className="px-2.5 py-2 rounded-xl text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            title="Editar dinero líquido en el broker seleccionado"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Editar Saldo</span>
          </button>

          <button
            onClick={() => setIsCreateBrokerModalOpen(true)}
            className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            title="Dar de alta una nueva cuenta de inversión (ej. GBM, Bursanet)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Broker</span>
          </button>
        </div>

        {/* Tipo de cambio USD/MXN */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex-shrink-0 self-end sm:self-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">USD/MXN:</span>
          <span className="font-mono font-black text-white">
            ${portfolioSummary?.usdToMxnRate?.toFixed(2) || '18.50'} MXN
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo
          </span>
        </div>
      </div>

      {/* 📈 SECCIÓN DE GRÁFICOS INTERACTIVOS (DISTRIBUCIÓN Y RENDIMIENTO) */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico 1: Asignación de Activos (Donut Chart) */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <span>Distribución de Cartera</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Porcentaje por activo y efectivo disponible</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {allocationPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={allocationPieData}
                      dataKey="valueMxn"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {allocationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} stroke="#0b0f19" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                              <p className="font-extrabold text-white">{data.name}</p>
                              <p className="text-emerald-400 font-mono font-bold">{formatCurrency(data.valueMxn)}</p>
                              <p className="text-slate-400 text-[10px] font-semibold">{Number(data.percentage).toFixed(1)}% del portafolio</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Sin datos de asignación suficientes
                </div>
              )}
            </div>

            {/* Mini leyenda de asignación */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
              {allocationPieData.map((item) => (
                <div key={item.symbol} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold">{item.symbol}:</span>
                  <span className="font-mono text-slate-400">{Number(item.percentage).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico 2: Costo vs Valor Actual por Activo (Bar Chart) */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Costo vs. Valor Actual</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Comparativa de adquisición contra cotización de mercado</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="symbol" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                            <p className="font-extrabold text-white mb-1">{label}</p>
                            {payload.map((p: any) => (
                              <p key={p.name} className="flex justify-between gap-3 text-[11px]">
                                <span className="text-slate-400">{p.name}:</span>
                                <span className={`font-mono font-bold ${p.name === 'Valor Actual' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                  {formatCurrency(Number(p.value))}
                                </span>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Invertido" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Valor Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-800/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cifras convertidas a moneda local para comparación homogénea</span>
            </div>
          </div>
        </div>
      )}

      {/* 📋 LISTADO DE ACTIVOS / ACCIONES EN CARTERA */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>Posiciones en Cartera</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {filteredHoldings.length} activos
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Acciones, ETFs e instrumentos bursátiles bajo custodia
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por símbolo (ej. NVDA)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {holdingsLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold">
            Cargando portafolio y cotizaciones...
          </div>
        ) : filteredHoldings.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No tienes posiciones registradas</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-medium">
                {brokerAccounts.length === 0
                  ? 'Para empezar a trackear tus inversiones, crea tu primera cuenta broker (ej. GBM+, Bursanet) y registra compras de acciones como NVDA o VOO.'
                  : 'Registra tus compras de acciones (ej. NVDA, VOO) para que el sistema consulte automáticamente las cotizaciones de mercado y calcule tus rendimientos.'}
              </p>
            </div>
            <button
              onClick={handleOpenBuyModal}
              className="px-5 py-2.5 btn-emerald text-white rounded-xl text-xs font-black transition inline-flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Primera Compra</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0f172a]/90 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">Activo / Ticker</th>
                  <th className="py-3.5 px-4">Broker</th>
                  <th className="py-3.5 px-4 text-right">Títulos</th>
                  <th className="py-3.5 px-4 text-right">Precio Compra</th>
                  <th className="py-3.5 px-4 text-right">Precio Actual (Bolsa)</th>
                  <th className="py-3.5 px-4 text-right">Valor de Mercado</th>
                  <th className="py-3.5 px-4 text-right">Rendimiento Total</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredHoldings.map((h) => {
                  const gainLoss = Number(h.gainLoss) || 0;
                  const isGain = gainLoss >= 0;
                  const dayChange = Number(h.dailyChangePercent) || 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Símbolo y Nombre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-white">
                            {h.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white text-sm">{h.symbol}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                                {h.assetType || 'STOCK'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{h.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Broker */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                          {h.accountName || 'Broker'}
                        </span>
                      </td>

                      {/* Cantidad de Títulos */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {Number(h.quantity).toLocaleString()}
                      </td>

                      {/* Precio de Compra */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-slate-300 block">
                          {formatCurrency(Number(h.buyPrice))} {h.currency}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Total: {formatCurrency(Number(h.totalInvested))}
                        </span>
                      </td>

                      {/* Precio Actual en Bolsa */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-white block">
                          {formatCurrency(Number(h.currentPrice))} {h.currency}
                        </span>
                        {dayChange !== 0 && (
                          <span
                            className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                              dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {dayChange >= 0 ? '▲ +' : '▼ '}
                            {dayChange.toFixed(2)}% hoy
                          </span>
                        )}
                      </td>

                      {/* Valor Actual de Mercado */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-white text-sm block">
                          {formatCurrency(Number(h.currentValue))} {h.currency}
                        </span>
                        {h.currency === 'USD' && h.currentValueInAccountCurrency && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ≈ {formatCurrency(Number(h.currentValueInAccountCurrency))} MXN
                          </span>
                        )}
                      </td>

                      {/* Rendimiento Ganancia / Pérdida */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`inline-block px-2.5 py-1 rounded-xl font-mono text-xs font-black ${
                            isGain
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isGain ? '+' : ''}
                          {formatCurrency(gainLoss)} ({isGain ? '+' : ''}
                          {Number(h.gainLossPercent || 0).toFixed(2)}%)
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://finance.yahoo.com/quote/${h.symbol}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                            title="Ver gráfico y ficha técnica en Yahoo Finance"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => {
                              setDeleteConfirmHolding(h);
                              setRefundToCashOnDelete(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Eliminar posición"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🛒 MODAL: REGISTRAR NUEVA POSICIÓN / COMPRA DE ACCIÓN */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    OPERACIÓN BURSÁTIL
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Registrar Compra de Activo
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBuy} className="space-y-4">
              
              {/* Selector de Broker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Broker / Cuenta de Inversión *</span>
                </label>
                <select
                  value={buyBrokerId}
                  onChange={(e) => setBuyBrokerId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                >
                  {brokerAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — Líquido disponible: {formatCurrency(Number(b.currentBalance) || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticker / Símbolo con chips populares */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Símbolo o Ticker de Bolsa (ej. NVDA, VOO) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={buySymbol}
                    onChange={(e) => setBuySymbol(e.target.value.toUpperCase())}
                    onBlur={(e) => handleLookupTicker(e.target.value)}
                    placeholder="Ej. NVDA, VOO, AAPL, CETES..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm uppercase focus:outline-none focus:border-emerald-500 transition"
                  />
                  {isFetchingQuote && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Consultando...</span>
                    </div>
                  )}
                </div>

                {/* Chips populares */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {POPULAR_TICKERS.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      onClick={() => handleSelectPopularTicker(item)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-800 transition"
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>

                {/* Precio sugerido de mercado */}
                {fetchedLivePrice !== null && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 uppercase tracking-wider">
                          {fetchedQuoteMeta?.exchangeName === 'MEX' ? 'BMV / SIC (Bolsa Mexicana)' : 'Mercado en Vivo'}
                        </span>
                        <span className="text-xs font-mono font-black text-white">
                          ${fetchedLivePrice.toFixed(2)} {buyCurrency}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Cotización en Pesos Mexicanos (MXN)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuyPrice(String(fetchedLivePrice))}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/40 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Usar precio</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Nombre de la empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Empresa o Fondo
                </label>
                <input
                  type="text"
                  value={buyName}
                  onChange={(e) => setBuyName(e.target.value)}
                  placeholder="Ej. NVIDIA Corporation, Vanguard S&P 500 ETF..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Cantidad y Precio de Compra */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cantidad de Títulos *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    required
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(e.target.value)}
                    placeholder="Ej. 1, 0.5, 10"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Precio Compra Unitario *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      required
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Moneda y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Moneda de cotización
                  </label>
                  <select
                    value={buyCurrency}
                    onChange={(e) => setBuyCurrency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="MXN">MXN ($ Pesos Mexicanos) — BMV/SIC</option>
                    <option value="USD">USD ($ Dólares)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fecha de compra</span>
                  </label>
                  <input
                    type="date"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Checkbox para descontar del pool de liquidez */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buyDeductFromCash}
                    onChange={(e) => setBuyDeductFromCash(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Descontar del saldo líquido disponible del broker
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Resta automáticamente el importe de compra del poder de compra del broker ({selectedBrokerTarget?.name || 'Broker'}).
                    </span>
                  </div>
                </label>

                {buyDeductFromCash && selectedBrokerTarget && estimatedCost > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] flex justify-between text-slate-300">
                    <span>Costo estimado: <strong>{formatCurrency(estimatedCost)} {buyCurrency}</strong></span>
                    <span>Líquido restante: <strong>{formatCurrency((Number(selectedBrokerTarget.currentBalance) || 0) - estimatedCost)}</strong></span>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(false)}
                  disabled={createHoldingMutation.isPending}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createHoldingMutation.isPending}
                  className="px-5 py-2.5 btn-emerald text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {createHoldingMutation.isPending ? (
                    <span>Registrando posición...</span>
                  ) : (
                    <>
                      <span>Registrar Compra</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💵 MODAL: EDITAR SALDO LÍQUIDO DEL BROKER */}
      {isEditCashModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Wallet className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    PODER DE COMPRA LÍQUIDO
                  </span>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Editar Saldo Líquido
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCashModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Ajusta directamente el efectivo líquido disponible en tu broker (ej. GBM) listo para invertir, sin modificar tus acciones en portafolio.
            </p>

            <form onSubmit={handleSaveEditCash} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cuenta Broker o Plataforma *
                </label>
                <select
                  value={editCashBrokerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setEditCashBrokerId(id);
                    const b = brokerAccounts.find((acc) => String(acc.id) === String(id));
                    if (b) {
                      setEditCashAmount(String(b.currentBalance ?? ''));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  {brokerAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Saldo actual: {formatCurrency(Number(b.currentBalance) || 0)} {b.currency || 'MXN'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nuevo Saldo Líquido (Pesos Mexicanos MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={editCashAmount}
                    onChange={(e) => setEditCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-16 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-cyan-400">
                    MXN
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-white font-bold block">Fondeo desde cuenta bancaria</span>
                <p>
                  Para registrar además el retiro de tu banco cuando transferiste a GBM, te recomendamos usar el botón <strong className="text-cyan-300">"Mandar a Invertir"</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCashModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateAccountMutation.isPending}
                  className="px-5 py-2 btn-emerald text-white rounded-xl text-xs font-black shadow-lg"
                >
                  {updateAccountMutation.isPending ? 'Guardando...' : 'Actualizar Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏛️ MODAL: CREAR CUENTA BROKER */}
      {isCreateBrokerModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Building2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    NUEVO BROKER
                  </span>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Crear Cuenta de Inversión
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateBrokerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Broker o Plataforma *
                </label>
                <input
                  type="text"
                  required
                  value={newBrokerName}
                  onChange={(e) => setNewBrokerName(e.target.value)}
                  placeholder="Ej. GBM+, Bursanet, Cetesdirecto, Interactive Brokers..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Saldo Líquido Inicial (Poder de compra)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={newBrokerInitialBalance}
                    onChange={(e) => setNewBrokerInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Moneda Base
                </label>
                <select
                  value={newBrokerCurrency}
                  onChange={(e) => setNewBrokerCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                  <option value="USD">USD ($ Dólares)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateBrokerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="px-5 py-2 btn-emerald text-white rounded-xl text-xs font-black shadow-lg"
                >
                  Crear Cuenta Broker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteConfirmHolding && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¿Eliminar Posición?</h3>
                <p className="text-xs text-slate-400">
                  {deleteConfirmHolding.symbol} ({deleteConfirmHolding.name})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Se removerán los {deleteConfirmHolding.quantity} títulos del portafolio.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={refundToCashOnDelete}
                onChange={(e) => setRefundToCashOnDelete(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-300 font-bold">
                Devolver el importe de compra ({formatCurrency(Number(deleteConfirmHolding.totalInvested))}) al saldo líquido disponible de {deleteConfirmHolding.accountName || 'tu broker'}
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmHolding(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteHoldingMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg"
              >
                Eliminar Posición
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💸 MODAL DE FONDEO / MANDAR A INVERTIR */}
      <TransactionModal
        isOpen={isFundModalOpen}
        initialType="INVESTMENT"
        onClose={() => setIsFundModalOpen(false)}
        onSuccess={(msg) => {
          triggerFeedback('success', msg);
          refetchHoldings();
          refetchSummary();
        }}
      />
    </div>
  );
}
