import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  AlertCircle,
  Wallet,
  Repeat,
  Pencil,
} from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import {
  useCreateTransaction,
  useUpdateTransaction,
  useRecurringTransactions,
  useCreateRecurringTransaction,
} from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatters';
import { Transaction, RecurringTransaction } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT';
  transactionToEdit?: Transaction | null;
  prefillRecurring?: RecurringTransaction | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const COMMON_EXPENSE_TAGS = [
  'Comida',
  'Suscripciones',
  'Supermercado',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Compras',
  'Educación',
  'Hogar',
  'Otro',
];

const COMMON_INCOME_TAGS = [
  'Nómina / Sueldo',
  'Depósito',
  'Cobro Ticket',
  'Venta',
  'Rendimientos',
  'Regalo',
  'Reembolso',
  'Otro',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType = 'EXPENSE',
  transactionToEdit = null,
  prefillRecurring = null,
  onClose,
  onSuccess,
}) => {
  const { data: accounts = [] } = useAccounts();
  const { data: recurringList = [] } = useRecurringTransactions();
  const createTxMutation = useCreateTransaction();
  const updateTxMutation = useUpdateTransaction();
  const createRecurringMutation = useCreateRecurringTransaction();

  const isEditing = Boolean(transactionToEdit);

  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | number>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string | number>('');
  const [category, setCategory] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');
  const [senderOption, setSenderOption] = useState<'myself' | 'other'>('myself');
  const [senderName, setSenderName] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [saveAsRecurring, setSaveAsRecurring] = useState<boolean>(false);
  const [recurringName, setRecurringName] = useState<string>('');
  const [activeRecurringId, setActiveRecurringId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.active !== false);

  // Cuentas agrupadas para mayor claridad
  const debitAccounts = activeAccounts.filter((a) => a.type === 'DEBIT');
  const cashAccounts = activeAccounts.filter((a) => a.type === 'CASH');
  const creditAccounts = activeAccounts.filter(
    (a) => a.type === 'CREDIT' || String(a.type) === 'CREDIT_CARD'
  );
  const investmentAccounts = activeAccounts.filter((a) => a.type === 'INVESTMENT');
  const otherAccounts = activeAccounts.filter(
    (a) =>
      a.type !== 'DEBIT' &&
      a.type !== 'CASH' &&
      a.type !== 'CREDIT' &&
      String(a.type) !== 'CREDIT_CARD' &&
      a.type !== 'INVESTMENT'
  );

  const toLocalDateTimeInput = (isoStr?: string) => {
    const d = isoStr ? new Date(isoStr) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    return new Date(validDate.getTime() - validDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const applyRecurringTemplate = (rec: RecurringTransaction) => {
    const isInv =
      rec.type === 'TRANSFER' &&
      (rec.destinationAccountType === 'INVESTMENT' || rec.category === 'Inversión');
    const resolvedType: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT' = isInv
      ? 'INVESTMENT'
      : (rec.type as 'EXPENSE' | 'INCOME' | 'TRANSFER') || 'EXPENSE';

    setActiveRecurringId(rec.id);
    setTxType(resolvedType);
    setAmount(String(rec.amount || ''));
    setDescription(rec.description || rec.name || '');
    setSelectedAccountId(rec.accountId || '');
    setDestinationAccountId(rec.destinationAccountId || '');

    const cat = rec.category || '';
    const commonList = resolvedType === 'EXPENSE' ? COMMON_EXPENSE_TAGS : COMMON_INCOME_TAGS;
    if (commonList.includes(cat)) {
      setCategory(cat);
      setCustomTag('');
    } else {
      setCategory('');
      setCustomTag(cat);
    }

    if (!rec.senderOrRecipient || rec.senderOrRecipient === 'Yo mismo (Fondos propios)') {
      setSenderOption('myself');
      setSenderName('');
    } else {
      setSenderOption('other');
      setSenderName(rec.senderOrRecipient);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaveAsRecurring(false);
    setRecurringName('');

    if (transactionToEdit) {
      // Modo Edición de un movimiento existente
      const isInv =
        transactionToEdit.type === 'TRANSFER' &&
        (transactionToEdit.destinationAccountType === 'INVESTMENT' ||
          transactionToEdit.category === 'Inversión');
      const resolvedType: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT' = isInv
        ? 'INVESTMENT'
        : (transactionToEdit.type as 'EXPENSE' | 'INCOME' | 'TRANSFER') || 'EXPENSE';

      setActiveRecurringId(null);
      setTxType(resolvedType);
      setAmount(String(transactionToEdit.amount || ''));
      setDescription(transactionToEdit.description || '');
      setSelectedAccountId(transactionToEdit.accountId || '');
      setDestinationAccountId(transactionToEdit.destinationAccountId || '');

      const cat = transactionToEdit.category || '';
      const commonList = resolvedType === 'EXPENSE' ? COMMON_EXPENSE_TAGS : COMMON_INCOME_TAGS;
      if (commonList.includes(cat)) {
        setCategory(cat);
        setCustomTag('');
      } else {
        setCategory('');
        setCustomTag(cat);
      }

      if (
        !transactionToEdit.senderOrRecipient ||
        transactionToEdit.senderOrRecipient === 'Yo mismo (Fondos propios)'
      ) {
        setSenderOption('myself');
        setSenderName('');
      } else {
        setSenderOption('other');
        setSenderName(transactionToEdit.senderOrRecipient);
      }

      setTransactionDate(
        toLocalDateTimeInput(transactionToEdit.transactionDate || transactionToEdit.createdAt)
      );
    } else if (prefillRecurring) {
      // Modo pre-llenado desde un movimiento recurrente
      setTransactionDate(toLocalDateTimeInput());
      applyRecurringTemplate(prefillRecurring);
    } else {
      // Modo creación limpia
      setActiveRecurringId(null);
      setTxType(initialType);
      setAmount('');
      setDescription(initialType === 'INVESTMENT' ? 'Fondeo de pool de inversión' : '');
      setCategory(initialType === 'INVESTMENT' ? 'Inversión' : '');
      setCustomTag('');
      setSenderOption('myself');
      setSenderName('');
      setTransactionDate(toLocalDateTimeInput());

      if (initialType === 'EXPENSE') {
        const defaultAcc =
          debitAccounts[0] || cashAccounts[0] || creditAccounts[0] || activeAccounts[0];
        if (defaultAcc) setSelectedAccountId(defaultAcc.id);
      } else if (initialType === 'INCOME') {
        const defaultAcc = debitAccounts[0] || cashAccounts[0] || activeAccounts[0];
        if (defaultAcc) setSelectedAccountId(defaultAcc.id);
      } else if (initialType === 'INVESTMENT') {
        const defaultOrigin = debitAccounts[0] || cashAccounts[0] || activeAccounts[0];
        if (defaultOrigin) setSelectedAccountId(defaultOrigin.id);
        if (investmentAccounts.length > 0) {
          setDestinationAccountId(investmentAccounts[0].id);
        }
      } else {
        if (activeAccounts.length > 0) setSelectedAccountId(activeAccounts[0].id);
        if (activeAccounts.length > 1) setDestinationAccountId(activeAccounts[1].id);
      }
    }
  }, [isOpen, initialType, transactionToEdit, prefillRecurring, accounts]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const currentAccount = activeAccounts.find((a) => String(a.id) === String(selectedAccountId));
  const destAccount = activeAccounts.find((a) => String(a.id) === String(destinationAccountId));
  const isSubmitting = createTxMutation.isPending || updateTxMutation.isPending;

  const handleSelectTag = (tag: string) => {
    if (category === tag) {
      setCategory('');
    } else {
      setCategory(tag);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!selectedAccountId) {
      setError('Debes especificar la cuenta de origen o destino.');
      return;
    }

    if (txType === 'TRANSFER' || txType === 'INVESTMENT') {
      if (!destinationAccountId) {
        setError(
          txType === 'INVESTMENT'
            ? 'Debes seleccionar el broker de inversión destino.'
            : 'Debes seleccionar la cuenta a donde transferirás el dinero.'
        );
        return;
      }
      if (String(selectedAccountId) === String(destinationAccountId)) {
        setError('La cuenta origen y destino deben ser distintas.');
        return;
      }
    }

    const finalTag =
      txType === 'INVESTMENT'
        ? customTag.trim() || category || 'Inversión'
        : customTag.trim()
        ? customTag.trim()
        : category;

    let senderOrRecipient: string | undefined = undefined;
    if (txType === 'INCOME') {
      senderOrRecipient =
        senderOption === 'myself'
          ? 'Yo mismo (Fondos propios)'
          : senderName.trim() || 'Alguien más';
    }

    const payload = {
      accountId: selectedAccountId,
      destinationAccountId:
        txType === 'TRANSFER' || txType === 'INVESTMENT' ? destinationAccountId : null,
      amount: parsedAmount,
      type: (txType === 'INVESTMENT' ? 'TRANSFER' : txType) as 'EXPENSE' | 'INCOME' | 'TRANSFER',
      category: finalTag || undefined,
      description:
        description.trim() ||
        (txType === 'INVESTMENT' ? 'Fondeo de cuenta de inversión' : undefined),
      senderOrRecipient: senderOrRecipient,
      debtTicketId: transactionToEdit?.debtTicketId ?? null,
      transactionDate: transactionDate ? new Date(transactionDate).toISOString() : undefined,
    };

    try {
      if (isEditing && transactionToEdit) {
        await updateTxMutation.mutateAsync({
          id: transactionToEdit.id,
          data: payload,
        });
        onSuccess(
          `Movimiento actualizado a ${formatCurrency(parsedAmount)}. Los saldos de tus cuentas se ajustaron automáticamente.`
        );
      } else {
        await createTxMutation.mutateAsync(payload);

        // Si el usuario marcó guardar también como movimiento recurrente
        if (saveAsRecurring) {
          const recTitle =
            recurringName.trim() ||
            description.trim() ||
            finalTag ||
            (txType === 'EXPENSE' ? 'Gasto Recurrente' : 'Ingreso Recurrente');
          await createRecurringMutation.mutateAsync({
            name: recTitle,
            accountId: selectedAccountId,
            destinationAccountId:
              txType === 'TRANSFER' || txType === 'INVESTMENT' ? destinationAccountId : null,
            amount: parsedAmount,
            type: payload.type,
            category: finalTag || undefined,
            description: payload.description || recTitle,
            senderOrRecipient,
          });
        }

        const accName = currentAccount?.name || 'tu cuenta';
        let successMsg = '';
        if (txType === 'EXPENSE') {
          if (currentAccount?.type === 'CREDIT') {
            successMsg = `Gasto de ${formatCurrency(parsedAmount)} registrado. Se sumó a la deuda de ${accName}.`;
          } else {
            successMsg = `Gasto de ${formatCurrency(parsedAmount)} registrado. Se restó del saldo de ${accName}.`;
          }
        } else if (txType === 'INCOME') {
          successMsg = `Ingreso de ${formatCurrency(parsedAmount)} registrado y sumado a ${accName}.`;
        } else if (txType === 'INVESTMENT') {
          successMsg = `Fondeo exitoso: ${formatCurrency(parsedAmount)} enviados a ${destAccount?.name || 'tu broker'}.`;
        } else {
          successMsg = `Transferencia de ${formatCurrency(parsedAmount)} de ${accName} a ${destAccount?.name || 'cuenta destino'} realizada.`;
        }

        if (saveAsRecurring) {
          successMsg += ' Además se guardó en tus Movimientos Recurrentes.';
        }

        onSuccess(successMsg);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar el movimiento.');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                txType === 'EXPENSE'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : txType === 'INCOME'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : txType === 'INVESTMENT'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              }`}
            >
              {isEditing ? (
                <Pencil className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <>
                  {txType === 'EXPENSE' && <TrendingDown className="w-6 h-6 stroke-[2.5]" />}
                  {txType === 'INCOME' && <TrendingUp className="w-6 h-6 stroke-[2.5]" />}
                  {txType === 'TRANSFER' && <ArrowLeftRight className="w-6 h-6 stroke-[2.5]" />}
                  {txType === 'INVESTMENT' && <TrendingUp className="w-6 h-6 stroke-[2.5]" />}
                </>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                {isEditing
                  ? 'EDITAR MOVIMIENTO EXISTENTE'
                  : activeRecurringId
                  ? 'MOVIMIENTO RECURRENTE PRECARGADO'
                  : txType === 'INVESTMENT'
                  ? 'FONDEO DE INVERSIÓN'
                  : 'NUEVO MOVIMIENTO'}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {isEditing
                  ? 'Modificar Movimiento y Ajustar Saldo'
                  : txType === 'EXPENSE'
                  ? 'Registrar Gasto o Compra'
                  : txType === 'INCOME'
                  ? 'Registrar Ingreso o Depósito'
                  : txType === 'TRANSFER'
                  ? 'Registrar Transferencia entre Cuentas'
                  : 'Mandar Dinero a Invertir (Fondeo Broker)'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Autocompletado Rápido con Movimientos Recurrentes (solo al crear) */}
        {!isEditing && recurringList.length > 0 && (
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" />
                <span>Rellenar con Movimiento Recurrente:</span>
              </span>
              {activeRecurringId && (
                <span className="text-[10px] font-bold text-emerald-400">
                  Datos rellenados — ajusta el monto si varió
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {recurringList.map((rec) => {
                const isSelected = String(activeRecurringId) === String(rec.id);
                const isExp = rec.type === 'EXPENSE';
                const isInc = rec.type === 'INCOME';
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => applyRecurringTemplate(rec)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 flex-shrink-0 border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isExp ? 'bg-rose-400' : isInc ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                    />
                    <span>{rec.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({formatCurrency(Number(rec.amount) || 0)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pestañas para cambiar tipo de movimiento */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTxType('EXPENSE')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              txType === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gasto</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('INCOME')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              txType === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingreso</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('TRANSFER')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              txType === 'TRANSFER'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Traspaso</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('INVESTMENT')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              txType === 'INVESTMENT'
                ? 'bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 text-emerald-300 border border-emerald-500/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Invertir</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto Grande */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monto *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-white font-mono font-black text-2xl focus:outline-none focus:border-emerald-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Selector de Cuenta Origen / Destino según tipo */}
          {txType === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-400" />
                <span>¿De dónde gastaste ese dinero? (Obligatorio) *</span>
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-rose-500 transition"
              >
                <option value="">-- Seleccionar cuenta de pago --</option>

                {debitAccounts.length > 0 && (
                  <optgroup label="Cuentas de Débito (Se restará del saldo)">
                    {debitAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {cashAccounts.length > 0 && (
                  <optgroup label="Efectivo (Se restará del efectivo)">
                    {cashAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {creditAccounts.length > 0 && (
                  <optgroup label="Tarjetas de Crédito (Se SUMARÁ a la deuda)">
                    {creditAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Deuda actual: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {otherAccounts.length > 0 && (
                  <optgroup label="Otras Cuentas">
                    {otherAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Explicación en tiempo real */}
              {currentAccount && !isEditing && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-medium">
                  {currentAccount.type === 'CREDIT' ? (
                    <span className="text-rose-300">
                      <strong>Tarjeta de Crédito:</strong> Al registrar este gasto de{' '}
                      {formatCurrency(parsedAmount)}, la deuda aumentará automáticamente a{' '}
                      {formatCurrency((Number(currentAccount.currentBalance) || 0) + parsedAmount)}.
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      <strong>
                        {currentAccount.type === 'CASH' ? 'Efectivo' : 'Cuenta de Débito'}:
                      </strong>{' '}
                      Al registrar este gasto, el saldo disponible pasará de{' '}
                      {formatCurrency(Number(currentAccount.currentBalance) || 0)} a{' '}
                      {formatCurrency((Number(currentAccount.currentBalance) || 0) - parsedAmount)}.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {txType === 'INCOME' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¿A qué cuenta entró el dinero? (Obligatorio) *</span>
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">-- Seleccionar cuenta destino --</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) — Saldo actual:{' '}
                      {formatCurrency(Number(a.currentBalance) || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* ¿Quién la mandó? */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>¿Quién mandó el dinero?</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSenderOption('myself')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                      senderOption === 'myself'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Yo mismo (Fondos propios)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderOption('other')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                      senderOption === 'other'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Alguien más
                  </button>
                </div>
                {senderOption === 'other' && (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nombre de la persona, cliente o empresa"
                    className="mt-2 w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                  />
                )}
              </div>
            </div>
          )}

          {txType === 'TRANSFER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cuenta Origen (Sale dinero) *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">-- Cuenta origen --</option>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(Number(a.currentBalance) || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cuenta Destino (Entra dinero) *
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">-- Cuenta destino --</option>
                  {activeAccounts
                    .filter((a) => String(a.id) !== String(selectedAccountId))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(Number(a.currentBalance) || 0)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {txType === 'INVESTMENT' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cuenta Bancaria Origen (Sale dinero) *
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="">-- Cuenta bancaria o débito --</option>
                    {activeAccounts
                      .filter((a) => a.type !== 'INVESTMENT')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type}) — Saldo:{' '}
                          {formatCurrency(Number(a.currentBalance) || 0)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Broker / Cuenta de Inversión Destino *
                  </label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="">-- Seleccionar Broker --</option>
                    {investmentAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Líquido: {formatCurrency(Number(a.currentBalance) || 0)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {investmentAccounts.length === 0 && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Aún no tienes una cuenta de tipo INVERSIÓN (ej. GBM+, Bursanet, Cetesdirecto).
                    Puedes crear una en la sección Cuentas o Inversiones.
                  </span>
                </div>
              )}

              {destAccount && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                  <span className="font-bold">Pool de liquidez:</span> Este dinero se sumará al
                  efectivo disponible de <strong className="text-white">{destAccount.name}</strong>{' '}
                  para comprar acciones o ETFs en el módulo de Inversiones.
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Descripción {txType === 'EXPENSE' ? 'del gasto' : 'del movimiento'}</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                txType === 'EXPENSE'
                  ? 'Ej. Pago de Metro, Cena en restaurante, Spotify...'
                  : txType === 'INCOME'
                  ? 'Ej. Depósito quincena, Transferencia de cliente...'
                  : txType === 'INVESTMENT'
                  ? 'Ej. Fondeo GBM para compra de acciones NVDA / VOO...'
                  : 'Ej. Traspaso a cuenta de ahorro...'
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Categorías / Etiquetas Generales (No obligatorias) */}
          {txType !== 'TRANSFER' && txType !== 'INVESTMENT' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Etiqueta / Categoría (Opcional)</span>
                </label>
                {category && (
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Chips sugeridos */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(txType === 'EXPENSE' ? COMMON_EXPENSE_TAGS : COMMON_INCOME_TAGS).map((tag) => {
                  const isSelected = category === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                        isSelected
                          ? txType === 'EXPENSE'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* O escribir etiqueta personalizada */}
              <input
                type="text"
                value={customTag}
                onChange={(e) => {
                  setCustomTag(e.target.value);
                  if (e.target.value) setCategory('');
                }}
                placeholder="O escribe una etiqueta personalizada..."
                className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          )}

          {/* Fecha y Hora (automática, editable) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fecha y hora del movimiento (Automática, puedes modificarla)</span>
            </label>
            <input
              type="datetime-local"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Opción para guardar como Movimiento Recurrente (solo al crear uno nuevo y cuando no viene de uno ya existente) */}
          {!isEditing && !activeRecurringId && (
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsRecurring}
                  onChange={(e) => setSaveAsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Guardar también como Movimiento Recurrente (para próximas veces)</span>
                </span>
              </label>

              {saveAsRecurring && (
                <input
                  type="text"
                  value={recurringName}
                  onChange={(e) => setRecurringName(e.target.value)}
                  placeholder="Nombre corto para el botón rápido (ej. Metro, Nómina, Netflix)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                />
              )}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                txType === 'EXPENSE'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white'
                  : txType === 'INCOME'
                  ? 'btn-emerald text-white'
                  : txType === 'INVESTMENT'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : isEditing ? (
                <>
                  <span>Guardar Cambios ({formatCurrency(parsedAmount)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>
                    {txType === 'EXPENSE' && `Registrar Gasto de ${formatCurrency(parsedAmount)}`}
                    {txType === 'INCOME' && `Registrar Ingreso de ${formatCurrency(parsedAmount)}`}
                    {txType === 'TRANSFER' && `Transferir ${formatCurrency(parsedAmount)}`}
                    {txType === 'INVESTMENT' && `Mandar a Invertir ${formatCurrency(parsedAmount)}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
