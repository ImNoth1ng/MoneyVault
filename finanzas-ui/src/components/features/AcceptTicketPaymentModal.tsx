import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, DollarSign, Wallet, Calendar, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { DebtTicket } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { usePayTicket } from '../../hooks/useDebts';
import { formatCurrency } from '../../utils/formatters';

interface AcceptTicketPaymentModalProps {
  isOpen: boolean;
  ticket: DebtTicket | null;
  debtorName?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AcceptTicketPaymentModal: React.FC<AcceptTicketPaymentModalProps> = ({
  isOpen,
  ticket,
  debtorName,
  onClose,
  onSuccess,
}) => {
  const { data: accounts = [] } = useAccounts();
  const payTicketMutation = usePayTicket();

  const [selectedAccountId, setSelectedAccountId] = useState<string | number>('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Lista de cuentas activas
  const activeAccounts = accounts.filter((a) => a.active !== false);

  useEffect(() => {
    if (ticket && isOpen) {
      const ticketTotal = Number(ticket.totalAmount) || 0;
      setAmountReceived(ticketTotal > 0 ? String(ticketTotal) : '');
      
      // Fecha actual en formato YYYY-MM-DDTHH:mm
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setPaymentDate(localIso);
      setNotes('');
      setError(null);

      // Preseleccionar primera cuenta de débito o efectivo, o la primera disponible
      const defaultAccount = activeAccounts.find((a) => a.type === 'DEBIT' || a.type === 'CASH') || activeAccounts[0];
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      }
    }
  }, [ticket, isOpen, accounts]);

  if (!isOpen || !ticket) return null;

  const ticketTotal = Number(ticket.totalAmount) || 0;
  const receivedNum = parseFloat(amountReceived) || 0;
  const surplus = receivedNum - ticketTotal;
  const isSurplus = surplus > 0.001;
  const isShortfall = surplus < -0.001;

  const selectedAccount = activeAccounts.find((a) => String(a.id) === String(selectedAccountId));
  const displayDebtor = debtorName || ticket.debtorName || `Deudor #${ticket.debtorId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError('Por favor selecciona la cuenta donde recibiste el dinero.');
      return;
    }

    if (isNaN(receivedNum) || receivedNum <= 0) {
      setError('El monto recibido debe ser un número mayor a 0.');
      return;
    }

    try {
      await payTicketMutation.mutateAsync({
        id: ticket.id,
        paymentData: {
          accountId: selectedAccountId,
          amountReceived: receivedNum,
          paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        },
      });

      const accountName = selectedAccount?.name || 'tu cuenta';
      const msg = isSurplus
        ? `¡Ticket cobrado con éxito! Se depositaron ${formatCurrency(receivedNum)} en ${accountName} (incluyendo ${formatCurrency(surplus)} de excedente).`
        : `¡Ticket liquidado con éxito! Se depositaron ${formatCurrency(receivedNum)} en ${accountName}.`;

      onSuccess(msg);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al procesar el pago del ticket.');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                RECEPCIÓN DE FONDOS
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Aceptar Pago de Ticket #{ticket.id}
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

        {/* Resumen del Ticket a Liquidar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Deudor</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{displayDebtor}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total del Ticket</p>
              <p className="text-base font-black text-emerald-400">{formatCurrency(ticketTotal)}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] uppercase font-bold text-slate-400">Concepto / Descripción</p>
            <p className="text-xs font-semibold text-slate-300 mt-0.5">{ticket.description}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Selector de Cuenta Destino */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>¿A qué cuenta te transfirieron / depositaron? *</span>
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="">-- Seleccionar cuenta destino --</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — Saldo actual: {formatCurrency(Number(acc.currentBalance) || 0)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              El dinero recibido se sumará automáticamente al saldo de esta cuenta.
            </p>
          </div>

          {/* Monto Recibido (Editable para capturar excedente) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monto que te transfirieron (Editable) *</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-bold">Total ticket: {formatCurrency(ticketTotal)}</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono font-black text-lg focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Alerta de Excedente / Diferencia */}
            {isSurplus && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>¡Excedente a favor detectado: +{formatCurrency(surplus)}!</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-tight">
                  Se depositarán los <strong>{formatCurrency(receivedNum)}</strong> completos en {selectedAccount ? selectedAccount.name : 'la cuenta seleccionada'}, cubriendo el ticket de {formatCurrency(ticketTotal)} y sumando el extra de {formatCurrency(surplus)}.
                </p>
              </div>
            )}

            {isShortfall && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>El monto ingresado es menor al total del ticket (-{formatCurrency(Math.abs(surplus))}). Se liquidará el ticket y se sumarán {formatCurrency(receivedNum)} a tu cuenta.</span>
              </div>
            )}
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fecha y hora del pago</span>
            </label>
            <input
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Notas u Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nota / Referencia de transferencia (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia SPEI Banorte con redondeo"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={payTicketMutation.isPending}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={payTicketMutation.isPending}
              className="px-5 py-2.5 btn-emerald rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {payTicketMutation.isPending ? (
                <span>Procesando abono...</span>
              ) : (
                <>
                  <span>Confirmar y Depositar {formatCurrency(receivedNum)}</span>
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
