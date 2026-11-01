import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  User,
  Users,
  UserPlus,
  Receipt,
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Repeat,
  Pencil,
  Unlink,
} from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useDebtors, useDebtTickets } from '../../hooks/useDebts';
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
  autoAttachTicket?: boolean;
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
  'Préstamo / Encargo',
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
  autoAttachTicket = false,
  onClose,
  onSuccess,
}) => {
  const { data: accounts = [] } = useAccounts();
  const { data: recurringList = [] } = useRecurringTransactions();
  const { data: debtors = [] } = useDebtors();
  const { data: tickets = [] } = useDebtTickets();

  const createTxMutation = useCreateTransaction();
  const updateTxMutation = useUpdateTransaction();
  const createRecurringMutation = useCreateRecurringTransaction();

  const isEditing = Boolean(transactionToEdit);

  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');
  const [senderOption, setSenderOption] = useState<'myself' | 'other'>('myself');
  const [senderName, setSenderName] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [saveAsRecurring, setSaveAsRecurring] = useState<boolean>(false);
  const [recurringName, setRecurringName] = useState<string>('');
  const [activeRecurringId, setActiveRecurringId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para Adjuntar Gasto a Ticket de Deuda ---
  const [attachToTicket, setAttachToTicket] = useState<boolean>(false);
  const [editTicketAction, setEditTicketAction] = useState<'KEEP' | 'CHANGE' | 'DETACH'>('KEEP');
  const [ticketMode, setTicketMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [targetTicketId, setTargetTicketId] = useState<string>('');
  const [debtorSelectionMode, setDebtorSelectionMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('');
  const [newDebtorName, setNewDebtorName] = useState<string>('');
  const [newDebtorContact, setNewDebtorContact] = useState<string>('');
  const [ticketDescription, setTicketDescription] = useState<string>('');
  const [ticketItemConcept, setTicketItemConcept] = useState<string>('');
  const [customTicketAmount, setCustomTicketAmount] = useState<string>('');

  const activeAccounts = accounts.filter((a) => a.active !== false);
  const pendingTickets = tickets.filter((t) => !t.isPaid && t.status !== 'PAID');

  // Cuentas agrupadas para mayor claridad
  const debitAccounts = activeAccounts.filter((a) => a.type === 'DEBIT' || a.type === 'VALES');
  const cashAccounts = activeAccounts.filter((a) => a.type === 'CASH');
  const creditAccounts = activeAccounts.filter(
    (a) => a.type === 'CREDIT' || String(a.type) === 'CREDIT_CARD'
  );
  const investmentAccounts = activeAccounts.filter((a) => a.type === 'INVESTMENT');
  const otherAccounts = activeAccounts.filter(
    (a) =>
      a.type !== 'DEBIT' &&
      a.type !== 'VALES' &&
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

  /**
   * Convierte el valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
   * a formato ISO local para LocalDateTime en Java ("YYYY-MM-DDTHH:mm:00")
   * sin desplazar la zona horaria a UTC ni agregar 'Z'.
   */
  const toBackendLocalDateTime = (localInput?: string): string | undefined => {
    if (!localInput || !localInput.trim()) return undefined;
    const clean = localInput.trim();
    if (clean.length === 16) {
      return `${clean}:00`;
    }
    return clean;
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
    setSelectedAccountId(rec.accountId ? String(rec.accountId) : '');
    setDestinationAccountId(rec.destinationAccountId ? String(rec.destinationAccountId) : '');

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

  // Inicializar formulario al abrir el modal o cambiar el movimiento a editar
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaveAsRecurring(false);
    setRecurringName('');

    // Reset de campos de ticket
    setEditTicketAction('KEEP');
    setTicketItemConcept('');
    setCustomTicketAmount('');
    setTicketDescription('');
    setNewDebtorName('');
    setNewDebtorContact('');
    setTicketMode(pendingTickets.length > 0 ? 'EXISTING' : 'NEW');
    setTargetTicketId(pendingTickets.length > 0 ? String(pendingTickets[0].id) : '');
    setDebtorSelectionMode(debtors.length > 0 ? 'EXISTING' : 'NEW');
    setSelectedDebtorId(debtors.length > 0 ? String(debtors[0].id) : '');

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
      setSelectedAccountId(transactionToEdit.accountId ? String(transactionToEdit.accountId) : '');
      setDestinationAccountId(
        transactionToEdit.destinationAccountId ? String(transactionToEdit.destinationAccountId) : ''
      );

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

      if (transactionToEdit.debtTicketId && resolvedType === 'EXPENSE') {
        setAttachToTicket(true);
        setTargetTicketId(String(transactionToEdit.debtTicketId));
      } else {
        setAttachToTicket(Boolean(autoAttachTicket));
      }
    } else if (prefillRecurring) {
      // Modo pre-llenado desde un movimiento recurrente
      setAttachToTicket(Boolean(autoAttachTicket));
      setTransactionDate(toLocalDateTimeInput());
      applyRecurringTemplate(prefillRecurring);
    } else {
      // Modo creación limpia
      setActiveRecurringId(null);
      setAttachToTicket(Boolean(autoAttachTicket));
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
        if (defaultAcc) setSelectedAccountId(String(defaultAcc.id));
      } else if (initialType === 'INCOME') {
        const defaultAcc = debitAccounts[0] || cashAccounts[0] || activeAccounts[0];
        if (defaultAcc) setSelectedAccountId(String(defaultAcc.id));
      } else if (initialType === 'INVESTMENT') {
        const defaultOrigin = debitAccounts[0] || cashAccounts[0] || activeAccounts[0];
        if (defaultOrigin) setSelectedAccountId(String(defaultOrigin.id));
        if (investmentAccounts.length > 0) {
          setDestinationAccountId(String(investmentAccounts[0].id));
        }
      } else {
        if (activeAccounts.length > 0) setSelectedAccountId(String(activeAccounts[0].id));
        if (activeAccounts.length > 1) setDestinationAccountId(String(activeAccounts[1].id));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialType, transactionToEdit?.id, prefillRecurring?.id, autoAttachTicket]);

  // Asegurar selecciones por defecto cuando cargan cuentas, tickets o deudores
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedAccountId && activeAccounts.length > 0 && !transactionToEdit) {
      setSelectedAccountId(String(activeAccounts[0].id));
    }
    if (!targetTicketId && pendingTickets.length > 0) {
      setTargetTicketId(String(pendingTickets[0].id));
    }
    if (!selectedDebtorId && debtors.length > 0) {
      setSelectedDebtorId(String(debtors[0].id));
    }
  }, [isOpen, activeAccounts, pendingTickets, debtors, selectedAccountId, targetTicketId, selectedDebtorId, transactionToEdit]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const parsedTicketAmount = customTicketAmount.trim()
    ? parseFloat(customTicketAmount) || 0
    : parsedAmount;

  const currentAccount = activeAccounts.find((a) => String(a.id) === String(selectedAccountId));
  const destAccount = activeAccounts.find((a) => String(a.id) === String(destinationAccountId));
  const selectedExistingTicket = pendingTickets.find((t) => String(t.id) === String(targetTicketId));
  const linkedTicket = transactionToEdit?.debtTicketId
    ? tickets.find((t) => String(t.id) === String(transactionToEdit.debtTicketId))
    : null;

  const isSubmitting = createTxMutation.isPending || updateTxMutation.isPending;

  const handleSwitchType = (newType: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'INVESTMENT') => {
    setTxType(newType);
    if (newType === 'INVESTMENT') {
      if (investmentAccounts.length > 0) {
        setDestinationAccountId(String(investmentAccounts[0].id));
      }
      if (currentAccount?.type === 'INVESTMENT') {
        const nonInv = debitAccounts[0] || cashAccounts[0] || activeAccounts.find((a) => a.type !== 'INVESTMENT');
        if (nonInv) setSelectedAccountId(String(nonInv.id));
      }
    } else if (newType === 'TRANSFER') {
      if (!destinationAccountId || String(destinationAccountId) === String(selectedAccountId)) {
        const otherAcc = activeAccounts.find((a) => String(a.id) !== String(selectedAccountId));
        if (otherAcc) setDestinationAccountId(String(otherAcc.id));
      }
    }
  };

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

    // Validaciones si es un GASTO y se activó adjuntar a un ticket
    const alreadyHasTicket = Boolean(isEditing && transactionToEdit?.debtTicketId);
    const shouldAttachNewOrChange =
      txType === 'EXPENSE' &&
      ((!alreadyHasTicket && attachToTicket) ||
        (alreadyHasTicket && editTicketAction === 'CHANGE'));

    if (shouldAttachNewOrChange) {
      if (parsedTicketAmount <= 0) {
        setError('El monto a cargar en el ticket debe ser mayor a 0.');
        return;
      }
      if (ticketMode === 'EXISTING') {
        if (!targetTicketId) {
          setError('Selecciona el ticket pendiente al que deseas agregar este gasto, o elige "Crear Ticket Nuevo".');
          return;
        }
      } else {
        if (debtorSelectionMode === 'EXISTING' && !selectedDebtorId) {
          setError('Selecciona un deudor existente o elige "+ Nuevo Deudor".');
          return;
        }
        if (debtorSelectionMode === 'NEW' && !newDebtorName.trim()) {
          setError('Ingresa el nombre del nuevo deudor para crear su ticket.');
          return;
        }
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
    } else if (isEditing && transactionToEdit?.senderOrRecipient) {
      senderOrRecipient = transactionToEdit.senderOrRecipient;
    }

    const payload: import('../../types').TransactionRequest = {
      accountId: Number(selectedAccountId),
      destinationAccountId:
        txType === 'TRANSFER' || txType === 'INVESTMENT' ? Number(destinationAccountId) : null,
      amount: parsedAmount,
      type: (txType === 'INVESTMENT' ? 'TRANSFER' : txType) as 'EXPENSE' | 'INCOME' | 'TRANSFER',
      category: finalTag || undefined,
      description:
        description.trim() ||
        (txType === 'INVESTMENT' ? 'Fondeo de cuenta de inversión' : undefined),
      senderOrRecipient: senderOrRecipient,
      debtTicketId: transactionToEdit?.debtTicketId ? Number(transactionToEdit.debtTicketId) : null,
      transactionDate: toBackendLocalDateTime(transactionDate),
    };

    if (txType === 'EXPENSE') {
      if (alreadyHasTicket) {
        if (editTicketAction === 'DETACH') {
          payload.detachFromTicket = true;
          payload.attachToTicket = false;
          payload.debtTicketId = null;
        } else if (editTicketAction === 'CHANGE') {
          payload.attachToTicket = true;
          payload.ticketMode = ticketMode;
          payload.ticketItemConcept = ticketItemConcept.trim() || undefined;
          payload.ticketItemAmount = parsedTicketAmount;
          if (ticketMode === 'EXISTING') {
            payload.targetTicketId = Number(targetTicketId);
          } else {
            payload.ticketDescription = ticketDescription.trim() || undefined;
            if (debtorSelectionMode === 'EXISTING') {
              payload.debtorId = Number(selectedDebtorId);
            } else {
              payload.newDebtorName = newDebtorName.trim();
              payload.newDebtorContact = newDebtorContact.trim() || undefined;
            }
          }
        } else {
          // KEEP: sincronizar monto y concepto con el ticket actual
          payload.attachToTicket = true;
          payload.ticketMode = 'EXISTING';
          payload.targetTicketId = Number(transactionToEdit!.debtTicketId);
          payload.ticketItemConcept = ticketItemConcept.trim() || description.trim() || undefined;
          payload.ticketItemAmount = parsedTicketAmount;
        }
      } else if (attachToTicket) {
        payload.attachToTicket = true;
        payload.ticketMode = ticketMode;
        payload.ticketItemConcept = ticketItemConcept.trim() || undefined;
        payload.ticketItemAmount = parsedTicketAmount;
        if (ticketMode === 'EXISTING') {
          payload.targetTicketId = Number(targetTicketId);
        } else {
          payload.ticketDescription = ticketDescription.trim() || undefined;
          if (debtorSelectionMode === 'EXISTING') {
            payload.debtorId = Number(selectedDebtorId);
          } else {
            payload.newDebtorName = newDebtorName.trim();
            payload.newDebtorContact = newDebtorContact.trim() || undefined;
          }
        }
      }
    }

    try {
      if (isEditing && transactionToEdit) {
        await updateTxMutation.mutateAsync({
          id: transactionToEdit.id,
          data: payload,
        });
        let editSuccessMsg = `Movimiento actualizado a ${formatCurrency(parsedAmount)}. Los saldos de tus cuentas se ajustaron automáticamente.`;
        if (payload.detachFromTicket) {
          editSuccessMsg += ' Se desvinculó el gasto del ticket de deuda.';
        } else if (payload.attachToTicket) {
          editSuccessMsg += ` Se sincronizó el cargo de ${formatCurrency(parsedTicketAmount)} en el ticket por cobrar.`;
        }
        onSuccess(editSuccessMsg);
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
            accountId: Number(selectedAccountId),
            destinationAccountId:
              txType === 'TRANSFER' || txType === 'INVESTMENT' ? Number(destinationAccountId) : null,
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
          if (attachToTicket) {
            if (ticketMode === 'NEW') {
              const debName =
                debtorSelectionMode === 'NEW'
                  ? newDebtorName.trim()
                  : debtors.find((d) => String(d.id) === String(selectedDebtorId))?.name || 'el deudor';
              successMsg += ` Además se creó un nuevo ticket pendiente por cobrar a ${debName} por ${formatCurrency(parsedTicketAmount)}.`;
            } else {
              const tDesc = selectedExistingTicket?.description || `Ticket #${targetTicketId}`;
              successMsg += ` Además se sumaron ${formatCurrency(parsedTicketAmount)} al ticket "${tDesc}" en pendiente por cobrar.`;
            }
          }
        } else if (txType === 'INCOME') {
          successMsg = `Ingreso de ${formatCurrency(parsedAmount)} registrado y sumado a ${accName}.`;
        } else if (txType === 'INVESTMENT') {
          successMsg = `Fondeo exitoso: ${formatCurrency(parsedAmount)} enviados a ${destAccount?.name || 'tu broker'}.`;
        } else {
          successMsg = `Transferencia de ${formatCurrency(parsedAmount)} de ${accName} a ${destAccount?.name || 'cuenta destino'} realizada.`;
        }

        if (saveAsRecurring) {
          successMsg += ' Guardado también en tus Movimientos Recurrentes.';
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
                  ? `EDITAR MOVIMIENTO #${transactionToEdit?.id}`
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
            onClick={() => handleSwitchType('EXPENSE')}
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
            onClick={() => handleSwitchType('INCOME')}
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
            onClick={() => handleSwitchType('TRANSFER')}
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
            onClick={() => handleSwitchType('INVESTMENT')}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monto *</span>
              </label>
              {isEditing && transactionToEdit && (
                <span className="text-[10px] font-bold text-slate-400">
                  Monto original:{' '}
                  <strong className="font-mono text-white">
                    {formatCurrency(Number(transactionToEdit.amount) || 0)}
                  </strong>
                </span>
              )}
            </div>
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
                  <optgroup label="Cuentas de Débito / Vales (Se restará del saldo)">
                    {debitAccounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {cashAccounts.length > 0 && (
                  <optgroup label="Efectivo (Se restará del efectivo)">
                    {cashAccounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {creditAccounts.length > 0 && (
                  <optgroup label="Tarjetas de Crédito (Se SUMARÁ a la deuda)">
                    {creditAccounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} — Deuda actual: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {investmentAccounts.length > 0 && (
                  <optgroup label="Cuentas de Inversión">
                    {investmentAccounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} — Líquido: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}

                {otherAccounts.length > 0 && (
                  <optgroup label="Otras Cuentas">
                    {otherAccounts.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} ({a.type}) — Saldo: {formatCurrency(Number(a.currentBalance) || 0)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Explicación en tiempo real */}
              {currentAccount && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-medium">
                  {isEditing && transactionToEdit ? (
                    <span className="text-cyan-300">
                      <strong>Ajuste automático de saldo:</strong> Se revertirá el movimiento anterior de{' '}
                      <strong className="font-mono">{formatCurrency(Number(transactionToEdit.amount) || 0)}</strong> y se aplicará el nuevo monto de{' '}
                      <strong className="font-mono">{formatCurrency(parsedAmount)}</strong> en{' '}
                      <strong>{currentAccount.name}</strong>.
                    </span>
                  ) : currentAccount.type === 'CREDIT' ? (
                    <span className="text-rose-300">
                      <strong>Tarjeta de Crédito:</strong> Al registrar este gasto de{' '}
                      <strong className="font-mono">{formatCurrency(parsedAmount)}</strong>, la deuda aumentará automáticamente a{' '}
                      <strong className="font-mono">
                        {formatCurrency((Number(currentAccount.currentBalance) || 0) + parsedAmount)}
                      </strong>
                      .
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      <strong>
                        {currentAccount.type === 'CASH' ? 'Efectivo' : 'Cuenta de Débito'}:
                      </strong>{' '}
                      Al registrar este gasto, el saldo disponible pasará de{' '}
                      <strong className="font-mono">
                        {formatCurrency(Number(currentAccount.currentBalance) || 0)}
                      </strong>{' '}
                      a{' '}
                      <strong className="font-mono">
                        {formatCurrency((Number(currentAccount.currentBalance) || 0) - parsedAmount)}
                      </strong>
                      .
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
                    <option key={a.id} value={String(a.id)}>
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
                    <option key={a.id} value={String(a.id)}>
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
                      <option key={a.id} value={String(a.id)}>
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
                        <option key={a.id} value={String(a.id)}>
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
                      <option key={a.id} value={String(a.id)}>
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
                  ? 'Ej. Compra en Amazon, Cena en restaurante,Pago con tarjeta...'
                  : txType === 'INCOME'
                  ? 'Ej. Depósito quincena, Transferencia de cliente...'
                  : txType === 'INVESTMENT'
                  ? 'Ej. Fondeo GBM para compra de acciones NVDA / VOO...'
                  : 'Ej. Traspaso a cuenta de ahorro...'
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* SECCIÓN: ADJUNTAR GASTO A TICKET DE DEUDA (NUEVO O EXISTENTE) */}
          {txType === 'EXPENSE' && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
              {/* Caso 1: Editando un gasto que YA estaba vinculado a un ticket */}
              {isEditing && transactionToEdit?.debtTicketId ? (
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                          GASTO VINCULADO A TICKET POR COBRAR
                        </span>
                        <p className="text-xs font-bold text-white">
                          Ticket #{transactionToEdit.debtTicketId}
                          {linkedTicket
                            ? ` — ${linkedTicket.debtorName || 'Deudor'}: ${linkedTicket.description}`
                            : transactionToEdit.debtTicketDescription
                            ? ` — ${transactionToEdit.debtTicketDebtorName || ''}: ${transactionToEdit.debtTicketDescription}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditTicketAction('KEEP')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition border flex items-center justify-center gap-1 ${
                        editTicketAction === 'KEEP'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sincronizar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTicketAction('CHANGE')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition border flex items-center justify-center gap-1 ${
                        editTicketAction === 'CHANGE'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Cambiar Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTicketAction('DETACH')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition border flex items-center justify-center gap-1 ${
                        editTicketAction === 'DETACH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Desvincular</span>
                    </button>
                  </div>

                  {editTicketAction === 'KEEP' && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      Si modificas el monto o la descripción de este gasto, el concepto dentro del Ticket #{transactionToEdit.debtTicketId} se actualizará automáticamente.
                    </p>
                  )}
                  {editTicketAction === 'DETACH' && (
                    <p className="text-[11px] text-rose-300 font-medium">
                      Al guardar, se quitará este cargo del Ticket #{transactionToEdit.debtTicketId} y el gasto quedará únicamente como gasto propio.
                    </p>
                  )}
                </div>
              ) : (
                /* Caso 2: Creando un gasto nuevo o editando uno sin ticket previo */
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={attachToTicket}
                    onChange={(e) => setAttachToTicket(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                      <span>¿Hiciste este gasto por alguien más? Adjuntar a Ticket por Cobrar</span>
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">
                      El gasto se cargará hoy a tu tarjeta o cuenta, y al mismo tiempo se agregará automáticamente a un ticket pendiente por cobrar para no perder ese dinero.
                    </p>
                  </div>
                </label>
              )}

              {/* Formulario desplegable para elegir Ticket Existente o Crear Ticket Nuevo */}
              {((!transactionToEdit?.debtTicketId && attachToTicket) ||
                (transactionToEdit?.debtTicketId && editTicketAction === 'CHANGE')) && (
                <div className="pt-2.5 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
                  {/* Selector de Modo: Ticket Existente vs Ticket Nuevo */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTicketMode('EXISTING')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        ticketMode === 'EXISTING'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ticket Existente ({pendingTickets.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketMode('NEW')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        ticketMode === 'NEW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Ticket Nuevo</span>
                    </button>
                  </div>

                  {ticketMode === 'EXISTING' ? (
                    <div className="space-y-2">
                      {pendingTickets.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                          <p className="text-xs text-slate-400 font-medium">
                            No tienes tickets pendientes por cobrar abiertos en este momento.
                          </p>
                          <button
                            type="button"
                            onClick={() => setTicketMode('NEW')}
                            className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Crear un Ticket Nuevo aquí mismo</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                              Selecciona el Ticket Pendiente *
                            </label>
                            <select
                              value={targetTicketId}
                              onChange={(e) => setTargetTicketId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition"
                            >
                              <option value="">-- Seleccionar ticket abierto --</option>
                              {pendingTickets.map((t) => {
                                const deb = debtors.find((d) => String(d.id) === String(t.debtorId));
                                const debName = t.debtorName || deb?.name || `Deudor #${t.debtorId}`;
                                return (
                                  <option key={t.id} value={String(t.id)}>
                                    {debName} — {t.description} (Actual: {formatCurrency(Number(t.totalAmount) || 0)})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {selectedExistingTicket && (
                            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 flex items-center justify-between text-[11px]">
                              <span className="text-slate-300 font-medium">
                                Nuevo total pendiente en el ticket:
                              </span>
                              <span className="font-mono font-black text-cyan-300">
                                {formatCurrency(Number(selectedExistingTicket.totalAmount) || 0)} +{' '}
                                {formatCurrency(parsedTicketAmount)} ={' '}
                                <strong className="text-emerald-400">
                                  {formatCurrency(
                                    (Number(selectedExistingTicket.totalAmount) || 0) +
                                      parsedTicketAmount
                                  )}
                                </strong>
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    /* Modo: CREAR TICKET NUEVO */
                    <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¿A quién se lo vas a cobrar? (Deudor) *</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDebtorSelectionMode('EXISTING')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                              debtorSelectionMode === 'EXISTING'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            Existente ({debtors.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDebtorSelectionMode('NEW')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border flex items-center gap-1 ${
                              debtorSelectionMode === 'NEW'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Nuevo Deudor</span>
                          </button>
                        </div>
                      </div>

                      {debtorSelectionMode === 'EXISTING' && debtors.length > 0 ? (
                        <select
                          value={selectedDebtorId}
                          onChange={(e) => setSelectedDebtorId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                        >
                          <option value="">-- Seleccionar deudor --</option>
                          {debtors.map((d) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name} {d.contactInfo ? `(${d.contactInfo})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newDebtorName}
                            onChange={(e) => setNewDebtorName(e.target.value)}
                            placeholder="Nombre del deudor (ej. Mamá, Carlos) *"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                          />
                          <input
                            type="text"
                            value={newDebtorContact}
                            onChange={(e) => setNewDebtorContact(e.target.value)}
                            placeholder="Contacto / Teléfono (opcional)"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Título del Nuevo Ticket (Opcional)
                        </label>
                        <input
                          type="text"
                          value={ticketDescription}
                          onChange={(e) => setTicketDescription(e.target.value)}
                          placeholder="Ej. Compras con tarjeta (si lo dejas vacío usa la descripción del gasto)"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* Concepto y Monto a cargar en el Ticket */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Concepto en el ticket (Opcional)
                      </label>
                      <input
                        type="text"
                        value={ticketItemConcept}
                        onChange={(e) => setTicketItemConcept(e.target.value)}
                        placeholder={description.trim() || 'Usa la descripción del gasto'}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Monto a cobrar en el ticket
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          $
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={customTicketAmount}
                          onChange={(e) => setCustomTicketAmount(e.target.value)}
                          placeholder={parsedAmount > 0 ? String(parsedAmount) : '100% del gasto'}
                          className="w-full pl-6 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categorías / Etiquetas Generales (No obligatorias) */}
          {txType !== 'TRANSFER' && txType !== 'INVESTMENT' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Etiqueta / Categoría (Opcional)</span>
                </label>
                {(category || customTag) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('');
                      setCustomTag('');
                    }}
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
                    {txType === 'EXPENSE' &&
                      (attachToTicket
                        ? `Registrar Gasto y Cargar a Ticket (${formatCurrency(parsedAmount)})`
                        : `Registrar Gasto de ${formatCurrency(parsedAmount)}`)}
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
