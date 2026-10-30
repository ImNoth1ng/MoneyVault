import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
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
} from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import {
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
} from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatters';
import { RecurringTransaction } from '../../types';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  recurringToEdit?: RecurringTransaction | null;
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

export const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({
  isOpen,
  recurringToEdit = null,
  onClose,
  onSuccess,
}) => {
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();

  const isEditing = Boolean(recurringToEdit);

  const [name, setName] = useState<string>('');
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | number>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string | number>('');
  const [category, setCategory] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');
  const [senderOption, setSenderOption] = useState<'myself' | 'other'>('myself');
  const [senderName, setSenderName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.active !== false);
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

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (recurringToEdit) {
      const isInv =
        recurringToEdit.type === 'TRANSFER' &&
        (recurringToEdit.destinationAccountType === 'INVESTMENT' ||
          recurringToEdit.category === 'Inversión');

      const resolvedType: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT' = isInv
        ? 'INVESTMENT'
        : (recurringToEdit.type as 'EXPENSE' | 'INCOME' | 'TRANSFER') || 'EXPENSE';

      setName(recurringToEdit.name || '');
      setTxType(resolvedType);
      setAmount(String(recurringToEdit.amount || ''));
      setDescription(recurringToEdit.description || '');
      setSelectedAccountId(recurringToEdit.accountId || '');
      setDestinationAccountId(recurringToEdit.destinationAccountId || '');

      const existingCat = recurringToEdit.category || '';
      const commonList = resolvedType === 'EXPENSE' ? COMMON_EXPENSE_TAGS : COMMON_INCOME_TAGS;
      if (commonList.includes(existingCat)) {
        setCategory(existingCat);
        setCustomTag('');
      } else {
        setCategory('');
        setCustomTag(existingCat);
      }

      if (
        !recurringToEdit.senderOrRecipient ||
        recurringToEdit.senderOrRecipient === 'Yo mismo (Fondos propios)'
      ) {
        setSenderOption('myself');
        setSenderName('');
      } else {
        setSenderOption('other');
        setSenderName(recurringToEdit.senderOrRecipient);
      }
    } else {
      setName('');
      setTxType('EXPENSE');
      setAmount('');
      setDescription('');
      setCategory('');
      setCustomTag('');
      setSenderOption('myself');
      setSenderName('');

      const defaultAcc =
        debitAccounts[0] || cashAccounts[0] || creditAccounts[0] || activeAccounts[0];
      if (defaultAcc) setSelectedAccountId(defaultAcc.id);
      if (activeAccounts.length > 1) setDestinationAccountId(activeAccounts[1].id);
    }
  }, [isOpen, recurringToEdit, accounts]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const isPending = createMutation.isPending || updateMutation.isPending;

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

    if (!name.trim()) {
      setError('Ingresa un nombre identificador para el recurrente (ej. Metro, Nómina, Netflix).');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Ingresa un monto predefinido mayor a 0.');
      return;
    }

    if (!selectedAccountId) {
      setError('Selecciona la cuenta predefinida para este movimiento.');
      return;
    }

    if (txType === 'TRANSFER' || txType === 'INVESTMENT') {
      if (!destinationAccountId) {
        setError('Selecciona la cuenta de destino.');
        return;
      }
      if (String(selectedAccountId) === String(destinationAccountId)) {
        setError('La cuenta de origen y destino deben ser distintas.');
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
      name: name.trim(),
      accountId: selectedAccountId,
      destinationAccountId:
        txType === 'TRANSFER' || txType === 'INVESTMENT' ? destinationAccountId : null,
      amount: parsedAmount,
      type: (txType === 'INVESTMENT' ? 'TRANSFER' : txType) as 'EXPENSE' | 'INCOME' | 'TRANSFER',
      category: finalTag || undefined,
      description: description.trim() || name.trim(),
      senderOrRecipient,
    };

    try {
      if (isEditing && recurringToEdit) {
        await updateMutation.mutateAsync({ id: recurringToEdit.id, data: payload });
        onSuccess(`Movimiento recurrente "${payload.name}" actualizado.`);
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess(`Movimiento recurrente "${payload.name}" creado y listo para usar.`);
      }
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Error al guardar el movimiento recurrente.'
      );
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border bg-cyan-500/15 border-cyan-500/30 text-cyan-400">
              <Repeat className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block">
                PLANTILLA DE ACCESO RÁPIDO
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {isEditing ? 'Editar Movimiento Recurrente' : 'Nuevo Movimiento Recurrente'}
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

        {/* Selector de Tipo */}
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
          {/* Nombre corto y Monto predefinido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nombre del Recurrente *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Metro, Nómina, Spotify..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monto Predefinido *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-black text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Cuenta predefinida */}
          {txType === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-400" />
                <span>Cuenta o Tarjeta de Pago Predefinida *</span>
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-rose-500 transition"
              >
                <option value="">-- Seleccionar cuenta de pago --</option>
                {debitAccounts.length > 0 && (
                  <optgroup label="Cuentas de Débito">
                    {debitAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {cashAccounts.length > 0 && (
                  <optgroup label="Efectivo">
                    {cashAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {creditAccounts.length > 0 && (
                  <optgroup label="Tarjetas de Crédito">
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
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {txType === 'INCOME' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cuenta Destino Predefinida *</span>
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
                      {a.name} ({a.type}) — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Remitente / Origen del Ingreso</span>
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
                    Empresa / Alguien más
                  </button>
                </div>
                {senderOption === 'other' && (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nombre de la empresa, nómina o persona"
                    className="mt-2 w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                  />
                )}
              </div>
            </div>
          )}

          {(txType === 'TRANSFER' || txType === 'INVESTMENT') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cuenta Origen *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">-- Cuenta origen --</option>
                  {activeAccounts
                    .filter((a) => (txType === 'INVESTMENT' ? a.type !== 'INVESTMENT' : true))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(Number(a.currentBalance) || 0)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {txType === 'INVESTMENT' ? 'Broker Destino *' : 'Cuenta Destino *'}
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">-- Cuenta destino --</option>
                  {(txType === 'INVESTMENT' ? investmentAccounts : activeAccounts)
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

          {/* Descripción que se rellenará */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Descripción del Movimiento (Opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Si lo dejas vacío, se usará el nombre del recurrente"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Etiqueta / Categoría */}
          {txType !== 'TRANSFER' && txType !== 'INVESTMENT' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Etiqueta Predefinida</span>
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

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 btn-emerald text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <span>{isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Recurrente'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

