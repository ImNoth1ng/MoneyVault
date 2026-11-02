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
  Pencil,
  Activity,
  DollarSign,
  PieChart,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  useInvestments,
  usePortfolioSummary,
  useCreateHolding,
  useUpdateHolding,
  useDeleteHolding,
  useRefreshedQuotes
} from '../hooks/useInvestments';
import { useAccounts, useCreateAccount, useUpdateAccount } from '../hooks/useAccounts';
import { TransactionModal } from '../components/features/TransactionModal';
import { formatCurrency } from '../utils/formatters';
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
  const { data: portfolioSummary, refetch: refetchSummary } = usePortfolioSummary();

  const createHoldingMutation = useCreateHolding();
  const updateHoldingMutation = useUpdateHolding();
  const deleteHoldingMutation = useDeleteHolding();
  const refreshQuotesMutation = useRefreshedQuotes();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  // Estados locales
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [leftChartMode, setLeftChartMode] = useState<'LINE' | 'PIE'>('LINE');

  // Modales
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
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

  // Consultar precio al ingresar ticker según la bolsa seleccionada (BMV MXN por defecto o EE.UU. USD)
  const handleLookupTicker = async (symbolToLook: string, marketOverride?: 'MXN' | 'USD') => {
    const cleanSym = symbolToLook.trim().toUpperCase();
    if (!cleanSym) return;

    const targetMarket = marketOverride || buyCurrency || 'MXN';
    setIsFetchingQuote(true);
    setFetchedLivePrice(null);
    try {
      const client = apiClient.getClient();
      const { data } = await client.get<Record<string, any>>('/investments/quotes', {
        params: { symbols: cleanSym, market: targetMarket, refresh: false }
      });

      if (data && data[cleanSym]) {
        const quote = data[cleanSym];
        const liveP = Number(quote.regularMarketPrice) || 0;
        if (liveP > 0) {
          setFetchedLivePrice(liveP);
          setFetchedQuoteMeta({
            exchangeName: quote.exchangeName,
            currency: quote.currency || targetMarket
          });
          if (!buyName && quote.shortName) {
            setBuyName(quote.shortName);
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo autocompletar ticker:', e);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSelectMarket = (market: 'MXN' | 'USD') => {
    setBuyCurrency(market);
    if (buySymbol.trim()) {
      handleLookupTicker(buySymbol, market);
    }
  };

  const handleSelectPopularTicker = (item: { symbol: string; name: string; assetType: string }) => {
    setBuySymbol(item.symbol);
    setBuyName(item.name);
    setBuyAssetType(item.assetType);
    handleLookupTicker(item.symbol, buyCurrency);
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
    setEditingHolding(null);
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

  const handleOpenEditHolding = (holding: InvestmentHolding) => {
    setEditingHolding(holding);
    setBuyBrokerId(holding.accountId);
    setBuySymbol(holding.symbol);
    setBuyName(holding.name || holding.symbol);
    setBuyQuantity(String(holding.quantity));
    setBuyPrice(String(holding.buyPrice));
    setBuyCurrency(holding.currency === 'USD' ? 'USD' : 'MXN');
    setBuyAssetType(holding.assetType || 'STOCK');
    setBuyDate(holding.buyDate ? holding.buyDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setBuyDeductFromCash(false);
    setBuyNotes(holding.notes || '');
    setFetchedLivePrice(holding.currentPrice ? Number(holding.currentPrice) : null);
    setFetchedQuoteMeta({ currency: holding.currency });
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

    const requestPayload = {
      accountId: Number(buyBrokerId),
      symbol: buySymbol.trim().toUpperCase(),
      name: buyName.trim() || buySymbol.trim().toUpperCase(),
      quantity: qty,
      buyPrice: prc,
      currency: buyCurrency,
      assetType: buyAssetType,
      buyDate: buyDate
        ? buyDate.length === 10
          ? `${buyDate}T12:00:00`
          : buyDate.length === 16
          ? `${buyDate}:00`
          : buyDate
        : undefined,
      deductFromCash: buyDeductFromCash,
      notes: buyNotes.trim() || undefined
    };

    try {
      if (editingHolding) {
        await updateHoldingMutation.mutateAsync({
          id: editingHolding.id,
          request: requestPayload
        });
        triggerFeedback('success', `Posición de ${qty} ${buySymbol.toUpperCase()} actualizada con éxito.`);
      } else {
        await createHoldingMutation.mutateAsync(requestPayload);
        triggerFeedback('success', `Posición de ${qty} ${buySymbol.toUpperCase()} registrada con éxito.`);
      }
      setEditingHolding(null);
      setIsBuyModalOpen(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (editingHolding ? 'Error al actualizar la posición.' : 'Error al registrar la posición.');
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

  const usdRate = Number(portfolioSummary?.usdToMxnRate) || 18.5;

  // Totales base de las posiciones filtradas / activas en MXN
  const portfolioBaseMxn = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    holdings.forEach((h) => {
      const rate = Number(h.usdToMxnRate || portfolioSummary?.usdToMxnRate) || 18.5;
      const inv =
        Number(h.totalInvestedMxn ?? h.totalInvestedInAccountCurrency) ||
        (h.currency === 'USD' ? Number(h.totalInvested) * rate : Number(h.totalInvested)) ||
        0;
      const cur =
        Number(h.currentValueMxn ?? h.currentValueInAccountCurrency) ||
        (h.currency === 'USD' ? Number(h.currentValue) * rate : Number(h.currentValue)) ||
        0;
      totalInvested += inv;
      totalCurrent += cur;
    });
    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2))
    };
  }, [holdings, portfolioSummary?.usdToMxnRate]);

  // Gráfico 1: Evolución histórica día a día de tu dinero en las últimas sesiones de bolsa (en MXN)
  const historicalMoneyData = useMemo(() => {
    const { totalInvested, totalCurrent } = portfolioBaseMxn;
    if (holdings.length === 0) return [];

    // Encontrar la longitud máxima de sparkline disponible (hasta 15-20 sesiones)
    const maxLen = Math.max(
      0,
      ...holdings.map((h) => (Array.isArray(h.sparklineMxn) ? h.sparklineMxn.length : 0))
    );

    const points: { label: string; 'Mi Dinero': number; ganancia: number; pct: number }[] = [];

    // Punto inicial: Compra Base
    points.push({
      label: 'Compra',
      'Mi Dinero': totalInvested,
      ganancia: 0,
      pct: 0
    });

    if (maxLen >= 3) {
      const stepCount = Math.min(maxLen, 12);
      const startOffset = maxLen - stepCount;
      for (let i = startOffset; i < maxLen; i++) {
        let daySumMxn = 0;
        holdings.forEach((h) => {
          const rate = Number(h.usdToMxnRate || portfolioSummary?.usdToMxnRate) || 18.5;
          const curVal =
            Number(h.currentValueMxn ?? h.currentValueInAccountCurrency) ||
            (h.currency === 'USD' ? Number(h.currentValue) * rate : Number(h.currentValue)) ||
            0;
          if (Array.isArray(h.sparklineMxn) && h.sparklineMxn.length > 0) {
            const idx = Math.min(i, h.sparklineMxn.length - 1);
            daySumMxn += Number(h.sparklineMxn[idx]) || curVal;
          } else {
            daySumMxn += curVal;
          }
        });

        const isLast = i === maxLen - 1;
        const val = isLast ? totalCurrent : Number(daySumMxn.toFixed(2));
        const gain = Number((val - totalInvested).toFixed(2));
        const pct = totalInvested > 0 ? Number(((gain / totalInvested) * 100).toFixed(2)) : 0;
        const daysAgo = maxLen - 1 - i;

        points.push({
          label: isLast ? 'Hoy' : `-${daysAgo}d`,
          'Mi Dinero': val,
          ganancia: gain,
          pct
        });
      }
    } else {
      // Interpolación suave desde Compra hasta Hoy si aún no hay historial diario en caché
      const steps = 6;
      for (let s = 1; s <= steps; s++) {
        const ratio = s / steps;
        const curvedRatio = Math.pow(ratio, 0.85);
        const val = Number((totalInvested + (totalCurrent - totalInvested) * curvedRatio).toFixed(2));
        const gain = Number((val - totalInvested).toFixed(2));
        const pct = totalInvested > 0 ? Number(((gain / totalInvested) * 100).toFixed(2)) : 0;
        points.push({
          label: s === steps ? 'Hoy' : `Sem ${s}`,
          'Mi Dinero': val,
          ganancia: gain,
          pct
        });
      }
    }

    return points;
  }, [holdings, portfolioBaseMxn, portfolioSummary?.usdToMxnRate]);

  // Gráfico 2: Crecimiento aproximado de tu dinero (Desde Compra -> Hoy -> Proyección a 1 Año en MXN)
  const moneyGrowthProjectionData = useMemo(() => {
    const { totalInvested, totalCurrent } = portfolioBaseMxn;
    if (holdings.length === 0) return [];

    // Calcular tasa anual estimada combinando el rendimiento actual con el crecimiento promedio bursátil (~15% anual)
    const currentRoi = totalInvested > 0 ? (totalCurrent - totalInvested) / totalInvested : 0;
    const estimatedAnnualRate = Math.min(0.35, Math.max(0.12, currentRoi > 0.02 ? currentRoi * 2.2 : 0.15));
    const monthlyRate = Math.pow(1 + estimatedAnnualRate, 1 / 12) - 1;

    const makePoint = (label: string, stage: string, amount: number) => {
      const rounded = Number(amount.toFixed(2));
      const gain = Number((rounded - totalInvested).toFixed(2));
      const pct = totalInvested > 0 ? Number(((gain / totalInvested) * 100).toFixed(2)) : 0;
      return {
        label,
        stage,
        'Mi Dinero': rounded,
        ganancia: gain,
        pct
      };
    };

    const midPast = totalInvested + (totalCurrent - totalInvested) * 0.5;

    return [
      makePoint('Compra', 'Capital Inicial Invertido', totalInvested),
      makePoint(' Evolución', 'Evolución Reciente', midPast),
      makePoint('Hoy', 'Valor Actual en Bolsa', totalCurrent),
      makePoint('+1 Mes', 'Crecimiento Est. (1 Mes)', totalCurrent * Math.pow(1 + monthlyRate, 1)),
      makePoint('+3 Meses', 'Crecimiento Est. (3 Meses)', totalCurrent * Math.pow(1 + monthlyRate, 3)),
      makePoint('+6 Meses', 'Crecimiento Est. (6 Meses)', totalCurrent * Math.pow(1 + monthlyRate, 6)),
      makePoint('+9 Meses', 'Crecimiento Est. (9 Meses)', totalCurrent * Math.pow(1 + monthlyRate, 9)),
      makePoint('+1 Año', 'Crecimiento Est. (12 Meses)', totalCurrent * Math.pow(1 + monthlyRate, 12))
    ];
  }, [holdings.length, portfolioBaseMxn]);

  // Datos para gráfico de pastel de asignación
  const allocationPieData = useMemo(() => {
    if (portfolioSummary?.allocation && portfolioSummary.allocation.length > 0) {
      return portfolioSummary.allocation;
    }
    return [];
  }, [portfolioSummary]);

  const selectedBrokerTarget = brokerAccounts.find((b) => String(b.id) === String(buyBrokerId));
  const estimatedCost = (parseFloat(buyQuantity) || 0) * (parseFloat(buyPrice) || 0);
  const estimatedCostMxn = buyCurrency === 'USD' ? estimatedCost * usdRate : estimatedCost;
  const estimatedCostInBrokerCurrency =
    selectedBrokerTarget?.currency === 'USD'
      ? buyCurrency === 'USD'
        ? estimatedCost
        : estimatedCost / usdRate
      : estimatedCostMxn;

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
              VALOR TOTAL CARTERA (MXN)
            </span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <p className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight truncate" title={`${formatCurrency(activeMetrics.totalPortfolio)} MXN`}>
              {formatCurrency(activeMetrics.totalPortfolio)} <span className="text-xs font-bold text-slate-400">MXN</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium truncate">
            <span>Líquido + Activos (USD convertido a MXN)</span>
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
            <p className="text-xl sm:text-2xl font-mono font-black text-cyan-300 tracking-tight truncate" title={`${formatCurrency(activeMetrics.cashAvailable)} MXN`}>
              {formatCurrency(activeMetrics.cashAvailable)} <span className="text-xs font-bold text-cyan-400/70">MXN</span>
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
              VALOR MERCADO ACTIVOS (MXN)
            </span>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-300 flex-shrink-0">
              <Layers className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <p className="text-xl sm:text-2xl font-mono font-black text-slate-100 tracking-tight truncate" title={`${formatCurrency(activeMetrics.assetsValue)} MXN`}>
              {formatCurrency(activeMetrics.assetsValue)} <span className="text-xs font-bold text-slate-400">MXN</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium truncate">
            <span>Costo base: {formatCurrency(activeMetrics.totalCost)} MXN</span>
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
              RENDIMIENTO HISTÓRICO (MXN)
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
              title={`${activeMetrics.gainLoss >= 0 ? '+' : ''}${formatCurrency(activeMetrics.gainLoss)} MXN`}
            >
              {activeMetrics.gainLoss >= 0 ? '+' : ''}
              {formatCurrency(activeMetrics.gainLoss)} <span className="text-xs font-bold">MXN</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
            <span className={`flex items-center gap-1 ${activeMetrics.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeMetrics.gainLoss >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {activeMetrics.gainLoss >= 0 ? '+' : ''}
                {activeMetrics.gainLossPercent.toFixed(2)}% ROI
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Histórico</span>
          </div>
        </div>
      </div>

      {/* SELECTOR DE BROKERS (TABS) & TIPO DE CAMBIO */}
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
                    Líq: {formatCurrency(Number(broker.currentBalance) || 0)} {broker.currency || 'MXN'}
                    {broker.currency === 'USD' && (
                      <span className="text-cyan-300 ml-1">
                        (≈ {formatCurrency((Number(broker.currentBalance) || 0) * usdRate)} MXN)
                      </span>
                    )}
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

      {/* SECCIÓN DE GRÁFICAS LINEALES DE CRECIMIENTO DE TU DINERO */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico 1: Evolución Histórica de tu Dinero (Últimas Sesiones) con opción de ver Distribución */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  {leftChartMode === 'LINE' ? (
                    <Activity className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <PieChart className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {leftChartMode === 'LINE' ? 'Evolución Reciente de tu Dinero' : 'Distribución de Cartera'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {leftChartMode === 'LINE'
                    ? 'Cómo se ha movido y crecido tu dinero en las últimas sesiones de bolsa (MXN)'
                    : 'Porcentaje por activo y efectivo disponible'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLeftChartMode('LINE')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    leftChartMode === 'LINE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Evolución</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftChartMode('PIE')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    leftChartMode === 'PIE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PieChart className="w-3 h-3" />
                  <span>Distribución</span>
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              {leftChartMode === 'LINE' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalMoneyData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      domain={[
                        (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.96)),
                        (dataMax: number) => Math.ceil(dataMax * 1.04)
                      ]}
                      tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isPositive = Number(data.ganancia) >= 0;
                          return (
                            <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5">
                              <p className="font-extrabold text-white border-b border-slate-800 pb-1">
                                Sesión: {label}
                              </p>
                              <p className="flex justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">Tu Dinero Total:</span>
                                <span className="font-mono font-black text-white">
                                  {formatCurrency(Number(data['Mi Dinero']))} MXN
                                </span>
                              </p>
                              <p className="flex justify-between gap-4 text-[11px]">
                                <span className="text-slate-400">Crecimiento vs. Compra:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isPositive ? '+' : ''}
                                  {formatCurrency(Number(data.ganancia))} ({isPositive ? '+' : ''}
                                  {Number(data.pct).toFixed(2)}%)
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="Mi Dinero"
                      name="Tu Dinero (MXN)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 3.5, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : allocationPieData.length > 0 ? (
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

          {/* Gráfico 2: Crecimiento Aproximado de tu Dinero (Trayectoria y Proyección a 1 Año) */}
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Crecimiento Aproximado de tu Dinero</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Cómo va creciendo tu inversión desde tu compra hacia los próximos 12 meses (MXN)
                </p>
              </div>
              {moneyGrowthProjectionData.length > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-black flex-shrink-0">
                  Est. 1A: {formatCurrency(moneyGrowthProjectionData[moneyGrowthProjectionData.length - 1]['Mi Dinero'])} MXN
                </div>
              )}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moneyGrowthProjectionData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    domain={[
                      (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.96)),
                      (dataMax: number) => Math.ceil(dataMax * 1.04)
                    ]}
                    tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isPositive = Number(data.ganancia) >= 0;
                        return (
                          <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5">
                            <p className="font-extrabold text-white border-b border-slate-800 pb-1">
                              {data.stage || data.label}
                            </p>
                            <p className="flex justify-between gap-4 text-[11px]">
                              <span className="text-slate-400">Tu Dinero (MXN):</span>
                              <span className="font-mono font-black text-cyan-300">
                                {formatCurrency(Number(data['Mi Dinero']))} MXN
                              </span>
                            </p>
                            <p className="flex justify-between gap-4 text-[11px]">
                              <span className="text-slate-400">Ganancia Acumulada:</span>
                              <span
                                className={`font-mono font-bold ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isPositive ? '+' : ''}
                                {formatCurrency(Number(data.ganancia))} ({isPositive ? '+' : ''}
                                {Number(data.pct).toFixed(2)}%)
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="Mi Dinero"
                    name="Crecimiento de tu Dinero (MXN)"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 6.5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] text-slate-300 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 font-medium">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Iniciaste con <strong className="font-mono text-white">{formatCurrency(portfolioBaseMxn.totalInvested)} MXN</strong></span>
              </div>
              <div className="font-mono text-[10px]">
                <span className="text-slate-400">Hoy: </span>
                <strong className="text-emerald-400">{formatCurrency(portfolioBaseMxn.totalCurrent)} MXN</strong>
              </div>
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
                  const isUsd = h.currency === 'USD';
                  const rate = Number(h.usdToMxnRate || portfolioSummary?.usdToMxnRate) || 18.5;
                  const gainLoss = Number(h.gainLoss) || 0;
                  const isGain = gainLoss >= 0;
                  const dayChange = Number(h.dailyChangePercent) || 0;

                  const buyPriceMxn = Number(h.buyPriceMxn) || (isUsd ? Number(h.buyPrice) * rate : Number(h.buyPrice));
                  const totalInvestedMxn =
                    Number(h.totalInvestedMxn ?? h.totalInvestedInAccountCurrency) ||
                    (isUsd ? Number(h.totalInvested) * rate : Number(h.totalInvested));
                  const currentPriceMxn =
                    Number(h.currentPriceMxn) || (isUsd ? Number(h.currentPrice) * rate : Number(h.currentPrice));
                  const currentValueMxn =
                    Number(h.currentValueMxn ?? h.currentValueInAccountCurrency) ||
                    (isUsd ? Number(h.currentValue) * rate : Number(h.currentValue));
                  const gainLossMxn =
                    Number(h.gainLossMxn ?? h.gainLossInAccountCurrency) ||
                    (isUsd ? gainLoss * rate : gainLoss);

                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Símbolo y Nombre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-white">
                            {h.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-white text-sm">{h.symbol}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                                {h.assetType || 'STOCK'}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                  isUsd
                                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {isUsd ? 'EE.UU. · USD' : 'BMV · MXN'}
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
                        <span className="font-mono text-slate-200 font-bold block">
                          {formatCurrency(Number(h.buyPrice))} {h.currency}
                        </span>
                        {isUsd && (
                          <span className="text-[10px] text-cyan-300/90 font-mono block">
                            ≈ {formatCurrency(buyPriceMxn)} MXN c/u
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                          Total: {formatCurrency(Number(h.totalInvested))} {h.currency}
                        </span>
                        {isUsd && (
                          <span className="text-[10px] text-emerald-400/90 font-mono font-bold block">
                            ≈ {formatCurrency(totalInvestedMxn)} MXN
                          </span>
                        )}
                      </td>

                      {/* Precio Actual en Bolsa */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-white block">
                          {formatCurrency(Number(h.currentPrice))} {h.currency}
                        </span>
                        {isUsd && (
                          <span className="text-[10px] text-cyan-300/90 font-mono block">
                            ≈ {formatCurrency(currentPriceMxn)} MXN
                          </span>
                        )}
                        {dayChange !== 0 && (
                          <span
                            className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${
                              dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {dayChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {dayChange >= 0 ? '+' : ''}
                              {dayChange.toFixed(2)}% hoy
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Valor Actual de Mercado */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-white text-sm block">
                          {formatCurrency(Number(h.currentValue))} {h.currency}
                        </span>
                        {isUsd && (
                          <span className="text-[11px] text-emerald-300 font-mono font-bold block mt-0.5">
                            ≈ {formatCurrency(currentValueMxn)} MXN
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
                          {formatCurrency(gainLoss)} {h.currency} ({isGain ? '+' : ''}
                          {Number(h.gainLossPercent || 0).toFixed(2)}%)
                        </div>
                        {isUsd && (
                          <span
                            className={`text-[10px] font-mono font-bold block mt-1 ${
                              gainLossMxn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ≈ {gainLossMxn >= 0 ? '+' : ''}
                            {formatCurrency(gainLossMxn)} MXN
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditHolding(h)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Editar posición"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <a
                            href={`https://finance.yahoo.com/quote/${
                              !isUsd && !h.symbol.includes('.') ? `${h.symbol}.MX` : h.symbol
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                            title="Ver gráfico y ficha técnica en Yahoo Finance"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
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

      {/* MODAL: REGISTRAR O EDITAR POSICIÓN / COMPRA DE ACCIÓN */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {editingHolding ? (
                    <Pencil className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    {editingHolding ? 'AJUSTE DE POSICIÓN EN CARTERA' : 'OPERACIÓN BURSÁTIL'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {editingHolding ? `Editar Posición (${editingHolding.symbol})` : 'Registrar Compra de Activo'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingHolding(null);
                  setIsBuyModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBuy} className="space-y-4">
              
              {/* Selector de Bolsa de Valores (Por defecto: Bolsa Mexicana de Valores BMV/SIC) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bolsa de Valores / Mercado de Compra *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectMarket('MXN')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      buyCurrency === 'MXN'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-tight">
                        Bolsa Mexicana (BMV / SIC)
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        MXN
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Por defecto — Compra y cotización en Pesos Mexicanos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMarket('USD')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      buyCurrency === 'USD'
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-tight">
                        Bolsa de EE.UU. (NYSE / NASDAQ)
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        USD
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      En Dólares — Convierte a MXN (T.C. ${usdRate.toFixed(2)})
                    </span>
                  </button>
                </div>
              </div>

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
                      {b.name} — Líquido disponible: {formatCurrency(Number(b.currentBalance) || 0)} {b.currency || 'MXN'}
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
                    onBlur={(e) => handleLookupTicker(e.target.value, buyCurrency)}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 uppercase tracking-wider">
                          {buyCurrency === 'USD'
                            ? 'Bolsa EE.UU. (NYSE / NASDAQ)'
                            : fetchedQuoteMeta?.exchangeName === 'MEX'
                            ? 'BMV / SIC (Bolsa Mexicana)'
                            : 'Mercado en Vivo'}
                        </span>
                        <span className="text-xs font-mono font-black text-white">
                          {formatCurrency(fetchedLivePrice)} {buyCurrency}
                        </span>
                        {buyCurrency === 'USD' && (
                          <span className="text-[11px] font-mono font-bold text-cyan-300">
                            (≈ {formatCurrency(fetchedLivePrice * usdRate)} MXN)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {buyCurrency === 'USD'
                          ? `Cotización en Dólares convertida a T.C. $${usdRate.toFixed(2)} MXN/USD`
                          : 'Cotización directa en Pesos Mexicanos (MXN)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuyPrice(String(fetchedLivePrice))}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/40 transition flex items-center gap-1.5 shadow-sm flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Usar precio</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Nombre de la empresa y Tipo de Activo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
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
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tipo de Activo
                  </label>
                  <select
                    value={buyAssetType}
                    onChange={(e) => setBuyAssetType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="STOCK">STOCK (Acción)</option>
                    <option value="ETF">ETF (Fondo)</option>
                    <option value="FIBRA">FIBRA</option>
                    <option value="CRYPTO">CRYPTO</option>
                    <option value="CETES">CETES / Bono</option>
                  </select>
                </div>
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
                    Precio Compra Unitario ({buyCurrency}) *
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
                      className="w-full pl-7 pr-12 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black text-slate-400">
                      {buyCurrency}
                    </span>
                  </div>
                  {buyCurrency === 'USD' && parseFloat(buyPrice) > 0 && (
                    <span className="text-[10px] text-cyan-300 font-mono font-semibold mt-1 block">
                      ≈ {formatCurrency(parseFloat(buyPrice) * usdRate)} MXN por título
                    </span>
                  )}
                </div>
              </div>

              {/* Fecha de compra */}
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

              {/* Checkbox para descontar o ajustar del pool de liquidez y Resumen de Conversión */}
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
                      {editingHolding
                        ? 'Ajustar diferencia de costo en el saldo líquido del broker'
                        : 'Descontar del saldo líquido disponible del broker'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {editingHolding
                        ? `Actualiza el efectivo líquido de ${selectedBrokerTarget?.name || 'tu broker'} según la diferencia entre el costo anterior y el nuevo.`
                        : `Resta automáticamente el importe de compra del poder de compra del broker (${selectedBrokerTarget?.name || 'Broker'}).`}
                    </span>
                  </div>
                </label>

                {estimatedCost > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Costo total de operación:</span>
                      <strong className="font-mono text-white">
                        {formatCurrency(estimatedCost)} {buyCurrency}
                      </strong>
                    </div>
                    {buyCurrency === 'USD' && (
                      <div className="flex justify-between text-cyan-300">
                        <span>Equivalente en Pesos (T.C. ${usdRate.toFixed(2)}):</span>
                        <strong className="font-mono">
                          ≈ {formatCurrency(estimatedCostMxn)} MXN
                        </strong>
                      </div>
                    )}
                    {buyDeductFromCash && selectedBrokerTarget && !editingHolding && (
                      <div className="flex justify-between text-emerald-300">
                        <span>Líquido restante en {selectedBrokerTarget.name}:</span>
                        <strong className="font-mono">
                          {formatCurrency((Number(selectedBrokerTarget.currentBalance) || 0) - estimatedCostInBrokerCurrency)}{' '}
                          {selectedBrokerTarget.currency || 'MXN'}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingHolding(null);
                    setIsBuyModalOpen(false);
                  }}
                  disabled={createHoldingMutation.isPending || updateHoldingMutation.isPending}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createHoldingMutation.isPending || updateHoldingMutation.isPending}
                  className="px-5 py-2.5 btn-emerald text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {createHoldingMutation.isPending || updateHoldingMutation.isPending ? (
                    <span>{editingHolding ? 'Guardando cambios...' : 'Registrando posición...'}</span>
                  ) : (
                    <>
                      <span>{editingHolding ? 'Guardar Cambios' : 'Registrar Compra'}</span>
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
                Devolver el importe de compra ({formatCurrency(Number(deleteConfirmHolding.totalInvested))} {deleteConfirmHolding.currency || 'MXN'}
                {deleteConfirmHolding.currency === 'USD'
                  ? ` ≈ ${formatCurrency(
                      Number(deleteConfirmHolding.totalInvestedMxn) || Number(deleteConfirmHolding.totalInvested) * usdRate
                    )} MXN`
                  : ''}
                ) al saldo líquido disponible de {deleteConfirmHolding.accountName || 'tu broker'}
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
