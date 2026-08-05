import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Share2, Printer, CheckCircle2, DollarSign, Receipt, FileText } from 'lucide-react';
import { DebtTicket } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TicketReviewModalProps {
  ticket: DebtTicket;
  debtorName?: string;
  onClose: () => void;
}

export const TicketReviewModal = ({ ticket, debtorName, onClose }: TicketReviewModalProps) => {
  const [copied, setCopied] = useState(false);

  const displayDebtor = debtorName || ticket.debtorName || `Deudor #${ticket.debtorId}`;
  const total = Number(ticket.totalAmount) || 0;
  const items = ticket.items || [];
  const isPaid = Boolean(ticket.isPaid || ticket.status === 'PAID');

  const generateShareText = () => {
    let text = `📋 *RECORDATORIO DE PAGO - MONEYVAULT*\n`;
    text += `👤 *Deudor:* ${displayDebtor}\n`;
    text += `📌 *Concepto:* ${ticket.description}\n\n`;
    text += `*Desglose de Conceptos:*\n`;

    items.forEach((item) => {
      text += `• ${item.concept}: ${formatCurrency(Number(item.amount) || 0)}\n`;
    });

    text += `\n💰 *TOTAL A PAGAR:* ${formatCurrency(total)}\n`;
    text += `----------------------------------------\n`;
    text += `Por favor confirma la recepción de este recordatorio o avísame cuando realices la transferencia. ¡Gracias!`;
    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar al portapapeles', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const useTwoColumns = items.length >= 6;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-[#0b0f19]/90 text-slate-100 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 backdrop-blur-2xl">
      {/* Contenedor Ficha de tamaño acotado y elegante para PC y Móviles (max-w-lg) */}
      <div className="w-full max-w-lg bg-[#0f172a]/95 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto backdrop-blur-3xl relative">
        
        {/* Encabezado Superior */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block">COMPROBANTE DE COBRO</span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-none tracking-tight">{displayDebtor}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isPaid
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isPaid ? 'LIQUIDADO' : 'PENDIENTE'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              title="Cerrar Ficha"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido Principal de la Ficha */}
        <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          
          {/* Descripción del Ticket */}
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> Concepto Principal
              </p>
              <p className="text-sm font-extrabold text-white mt-0.5">{ticket.description}</p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-medium hidden sm:block">
              <span>{items.length} {items.length === 1 ? 'Concepto' : 'Conceptos'}</span>
            </div>
          </div>

          {/* Lista de Conceptos */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Desglose Detallado
            </p>

            {items.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin desglose de conceptos</p>
            ) : (
              <div className={`grid gap-2 ${useTwoColumns ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-emerald-500/30 transition"
                  >
                    <span className="font-bold text-slate-200 truncate pr-2">• {item.concept}</span>
                    <span className="font-mono font-bold text-emerald-400 flex-shrink-0">
                      {formatCurrency(Number(item.amount) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Banner Ligado */}
          <div className="pt-2">
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/70 border border-emerald-500/30 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> TOTAL A LIQUIDAR
                </p>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none">
                  {formatCurrency(total)}
                </p>
              </div>
              <div className="text-right text-[9px] text-slate-400 font-medium hidden sm:block">
                <span className="block text-emerald-400 font-bold">MoneyVault</span>
                <span>Comprobante Oficial</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acciones */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 py-2 px-3 btn-emerald rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Enviar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            title="Imprimir o PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
