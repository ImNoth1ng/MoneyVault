import React, { useState } from 'react';
import { Users, Plus, CheckCircle2, Trash2, Edit2, DollarSign, FileText, AlertCircle, RefreshCw, Zap, Play, RotateCcw, Share2 } from 'lucide-react';
import {
  useDebtors,
  useCreateDebtor,
  useUpdateDebtor,
  useDeleteDebtor,
  useDebtTickets,
  useCreateDebtTicket,
  useUpdateTicket,
  useMarkTicketPaid,
  useDeleteTicket,
} from '../hooks/useDebts';
import { Debtor, DebtTicket, TicketItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { recurringService, RecurringServiceItem } from '../services/recurringService';
import { TicketReviewModal } from '../components/features/TicketReviewModal';

export default function DebtorsPage() {
  const { data: debtors = [], isLoading: loadingDebtors, isError: errorDebtors, refetch: refetchDebtors } = useDebtors();
  const { data: tickets = [], isLoading: loadingTickets, isError: errorTickets, refetch: refetchTickets } = useDebtTickets();

  const createDebtor = useCreateDebtor();
  const updateDebtor = useUpdateDebtor();
  const deleteDebtor = useDeleteDebtor();

  const createTicket = useCreateDebtTicket();
  const updateTicket = useUpdateTicket();
  const markPaid = useMarkTicketPaid();
  const deleteTicket = useDeleteTicket();

  // Tab State: tickets_pending | tickets_paid | debtors | recurring
  const [activeTab, setActiveTab] = useState<'tickets_pending' | 'tickets_paid' | 'debtors' | 'recurring'>('tickets_pending');

  // Recurring services local state & editing
  const [recurringItems, setRecurringItems] = useState<RecurringServiceItem[]>(() => recurringService.getAll());
  const [editingRecurring, setEditingRecurring] = useState<RecurringServiceItem | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recDebtorId, setRecDebtorId] = useState<string | number>('');
  const [recServiceName, setRecServiceName] = useState('');
  const [recDayOfMonth, setRecDayOfMonth] = useState<number>(14);
  const [recAmount, setRecAmount] = useState<string>('550');

  // Modals & form state
  const [showDebtorModal, setShowDebtorModal] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [debtorName, setDebtorName] = useState('');
  const [debtorContact, setDebtorContact] = useState('');

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<DebtTicket | null>(null);
  const [ticketDebtorId, setTicketDebtorId] = useState<string | number>('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([{ concept: '', amount: '' }]);

  // Ficha de Cobro / Snapshot Review Modal
  const [reviewTicket, setReviewTicket] = useState<DebtTicket | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper para verificar si un ticket está pagado
  const isTicketPaid = (t: DebtTicket) => Boolean(t.isPaid || t.status === 'PAID');

  // Debtor Handlers
  const handleOpenDebtorModal = (debtor?: Debtor) => {
    if (debtor) {
      setEditingDebtor(debtor);
      setDebtorName(debtor.name);
      setDebtorContact(debtor.contactInfo || '');
    } else {
      setEditingDebtor(null);
      setDebtorName('');
      setDebtorContact('');
    }
    setShowDebtorModal(true);
  };

  const handleSaveDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtorName.trim()) {
      triggerFeedback('error', 'El nombre del deudor es obligatorio.');
      return;
    }

    try {
      if (editingDebtor) {
        await updateDebtor.mutateAsync({
          id: editingDebtor.id,
          debtor: { name: debtorName.trim(), contactInfo: debtorContact.trim() },
        });
        triggerFeedback('success', 'Deudor actualizado correctamente');
      } else {
        await createDebtor.mutateAsync({
          name: debtorName.trim(),
          contactInfo: debtorContact.trim(),
        });
        triggerFeedback('success', 'Deudor creado con éxito');
      }
      setShowDebtorModal(false);
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al guardar el deudor');
    }
  };

  const handleDeleteDebtor = async (id: string | number) => {
    if (!window.confirm('¿Eliminar este deudor? Sus tickets asociados también podrían ser afectados.')) return;
    try {
      await deleteDebtor.mutateAsync(id);
      triggerFeedback('success', 'Deudor eliminado');
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'No se pudo eliminar el deudor');
    }
  };

  // Ticket Handlers
  const handleOpenTicketModal = (debtorIdSelect?: string | number, ticketToEdit?: DebtTicket) => {
    if (ticketToEdit) {
      setEditingTicket(ticketToEdit);
      setTicketDebtorId(ticketToEdit.debtorId);
      setTicketDescription(ticketToEdit.description);
      setTicketItems(
        ticketToEdit.items && ticketToEdit.items.length > 0
          ? ticketToEdit.items.map((i) => ({ concept: i.concept, amount: String(i.amount) }))
          : [{ concept: 'Concepto principal', amount: String(ticketToEdit.totalAmount || '') }]
      );
    } else {
      setEditingTicket(null);
      setTicketDebtorId(debtorIdSelect || (debtors.length > 0 ? debtors[0].id : ''));
      setTicketDescription('');
      setTicketItems([{ concept: 'Préstamo principal', amount: '' }]);
    }
    setShowTicketModal(true);
  };

  const handleAddItemRow = () => {
    setTicketItems([...ticketItems, { concept: '', amount: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (ticketItems.length === 1) return;
    setTicketItems(ticketItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'concept' | 'amount', value: string) => {
    const next = [...ticketItems];
    next[index][field] = value;
    setTicketItems(next);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDebtorId) {
      triggerFeedback('error', 'Selecciona un deudor.');
      return;
    }
    if (!ticketDescription.trim()) {
      triggerFeedback('error', 'Ingresa una descripción para el ticket.');
      return;
    }
    const validItems = ticketItems.filter((i) => i.concept.trim() && Number(i.amount) > 0);
    if (validItems.length === 0) {
      triggerFeedback('error', 'Agrega al menos un concepto con monto mayor a 0.');
      return;
    }

    const payload = {
      debtorId: ticketDebtorId,
      description: ticketDescription.trim(),
      items: validItems.map((i) => ({ concept: i.concept.trim(), amount: Number(i.amount) })),
    };

    try {
      if (editingTicket) {
        await updateTicket.mutateAsync({
          id: editingTicket.id,
          ticket: payload,
        });
        triggerFeedback('success', 'Ticket de deuda actualizado correctamente');
      } else {
        await createTicket.mutateAsync(payload);
        triggerFeedback('success', 'Ticket de deuda creado correctamente');
      }
      setShowTicketModal(false);
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al guardar ticket de deuda');
    }
  };

  const handleTogglePaid = async (ticket: DebtTicket) => {
    const paid = isTicketPaid(ticket);
    const actionLabel = paid ? 'desmarcar como pagado y mover a PENDIENTES' : 'marcar como PAGADO y mover a HISTÓRICO';
    if (!window.confirm(`¿Deseas ${actionLabel} este ticket?`)) return;

    try {
      await markPaid.mutateAsync(ticket.id);
      triggerFeedback(
        'success',
        paid ? 'Ticket movido nuevamente a Pendientes' : 'Ticket marcado como pagado y movido a Histórico'
      );
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'No se pudo actualizar el estado del ticket');
    }
  };

  const handleDeleteTicket = async (id: string | number) => {
    if (!window.confirm('¿Eliminar este ticket de deuda?')) return;
    try {
      await deleteTicket.mutateAsync(id);
      triggerFeedback('success', 'Ticket eliminado');
    } catch (err: any) {
      triggerFeedback('error', err.response?.data?.message || 'Error al eliminar el ticket');
    }
  };

  // RECURRING SERVICES HANDLERS
  const handleOpenRecurringModal = (recToEdit?: RecurringServiceItem) => {
    if (recToEdit) {
      setEditingRecurring(recToEdit);
      setRecDebtorId(recToEdit.debtorId);
      setRecServiceName(recToEdit.serviceName);
      setRecDayOfMonth(recToEdit.dayOfMonth);
      setRecAmount(String(recToEdit.amount));
    } else {
      setEditingRecurring(null);
      setRecDebtorId(debtors.length > 0 ? debtors[0].id : '');
      setRecServiceName('Telmex Internet');
      setRecDayOfMonth(14);
      setRecAmount('550');
    }
    setShowRecurringModal(true);
  };

  const handleSaveRecurringService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDebtorId) {
      triggerFeedback('error', 'Selecciona un deudor.');
      return;
    }
    if (!recServiceName.trim()) {
      triggerFeedback('error', 'Ingresa el nombre del servicio.');
      return;
    }

    const debtor = debtors.find((d) => String(d.id) === String(recDebtorId));
    const debtorName = debtor ? debtor.name : 'Deudor';

    if (editingRecurring) {
      recurringService.update(editingRecurring.id, {
        debtorId: recDebtorId,
        debtorName: debtorName,
        serviceName: recServiceName.trim(),
        dayOfMonth: Number(recDayOfMonth) || 1,
        amount: Number(recAmount) || 0,
        currency: 'MXN',
      });
      triggerFeedback('success', `Servicio recurrente '${recServiceName}' actualizado correctamente`);
    } else {
      recurringService.add({
        debtorId: recDebtorId,
        debtorName: debtorName,
        serviceName: recServiceName.trim(),
        dayOfMonth: Number(recDayOfMonth) || 1,
        amount: Number(recAmount) || 0,
        currency: 'MXN',
      });
      triggerFeedback('success', `Servicio recurrente '${recServiceName}' guardado correctamente`);
    }

    setRecurringItems(recurringService.getAll());
    setShowRecurringModal(false);
  };

  const handleDeleteRecurringService = (id: string) => {
    recurringService.remove(id);
    setRecurringItems(recurringService.getAll());
    triggerFeedback('success', 'Servicio recurrente eliminado');
  };

  const handleChargeRecurringToTicket = async (rec: RecurringServiceItem) => {
    try {
      const openTicket = tickets.find((t) => String(t.debtorId) === String(rec.debtorId) && !isTicketPaid(t));

      if (openTicket) {
        const existingItems = openTicket.items.map((i) => ({ concept: i.concept, amount: Number(i.amount) }));
        const updatedItems = [...existingItems, { concept: `${rec.serviceName} (Día ${rec.dayOfMonth})`, amount: Number(rec.amount) }];

        await updateTicket.mutateAsync({
          id: openTicket.id,
          ticket: {
            debtorId: rec.debtorId,
            description: openTicket.description,
            items: updatedItems,
          },
        });
        triggerFeedback('success', `Servicio '${rec.serviceName}' ($${rec.amount} MXN) agregado al ticket de ${rec.debtorName}`);
      } else {
        await createTicket.mutateAsync({
          debtorId: rec.debtorId,
          description: `Ticket de ${rec.debtorName}`,
          items: [{ concept: `${rec.serviceName} (Día ${rec.dayOfMonth})`, amount: Number(rec.amount) }],
        });
        triggerFeedback('success', `Nuevo ticket creado para ${rec.debtorName} con el servicio '${rec.serviceName}'`);
      }
    } catch (err: any) {
      console.error(err);
      triggerFeedback('error', 'Error al cargar el servicio al ticket de deuda');
    }
  };

  // Filtered lists
  const pendingTicketsList = tickets.filter((t) => !isTicketPaid(t));
  const paidTicketsList = tickets.filter((t) => isTicketPaid(t));
  const totalPendingDebt = pendingTicketsList.reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Deudores, Tickets y Servicios</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">Gestión de cobranza, préstamos y cobros periódicos por deudor</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenRecurringModal()}
            className="px-3.5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Nuevo Servicio</span>
          </button>
          <button
            onClick={() => handleOpenTicketModal()}
            className="px-4 py-2 btn-emerald text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Minimal Dark */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Pendiente por Cobrar</p>
            <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(totalPendingDebt)}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Deudores Registrados</p>
            <p className="text-2xl font-black text-white tracking-tight">{debtors.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Servicios Recurrentes</p>
            <p className="text-2xl font-black text-white tracking-tight">{recurringItems.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('tickets_pending')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex-shrink-0 ${
            activeTab === 'tickets_pending' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Tickets Pendientes ({pendingTicketsList.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets_paid')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex-shrink-0 ${
            activeTab === 'tickets_paid' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Histórico Pagados ({paidTicketsList.length})
        </button>
        <button
          onClick={() => setActiveTab('debtors')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex-shrink-0 ${
            activeTab === 'debtors' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Directorio de Deudores ({debtors.length})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex-shrink-0 ${
            activeTab === 'recurring' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Servicios Recurrentes ({recurringItems.length})
        </button>
      </div>

      {/* TAB CONTENT: TICKETS PENDIENTES */}
      {activeTab === 'tickets_pending' && (
        <div className="space-y-4">
          {loadingTickets ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">Cargando tickets pendientes...</div>
          ) : errorTickets ? (
            <div className="py-8 text-center text-rose-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-bold">Error al cargar los tickets de deuda</p>
              <button onClick={() => refetchTickets()} className="text-xs underline text-slate-400">Reintentar</button>
            </div>
          ) : pendingTicketsList.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base mb-1">No hay tickets pendientes por cobrar</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">¡Estás al día! O crea un nuevo ticket para registrar un préstamo</p>
              <button
                onClick={() => handleOpenTicketModal()}
                className="px-4 py-2.5 btn-emerald rounded-xl text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Ticket</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTicketsList.map((ticket) => {
                const debtor = debtors.find((d) => String(d.id) === String(ticket.debtorId));

                return (
                  <div key={ticket.id} className="glass-card rounded-2xl border border-slate-800 hover:border-emerald-500/30 p-5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            PENDIENTE
                          </span>
                          <h4 className="font-extrabold text-white text-base tracking-tight">{ticket.description}</h4>
                          <p className="text-xs text-slate-300 font-semibold mt-0.5">
                            Deudor: <span className="font-extrabold text-emerald-400">{debtor ? debtor.name : ticket.debtorName || `ID ${ticket.debtorId}`}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                          <p className="text-xl font-black tracking-tight text-white">{formatCurrency(Number(ticket.totalAmount) || 0)}</p>
                        </div>
                      </div>

                      {ticket.items && ticket.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desglose de Conceptos:</p>
                          {ticket.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300 font-semibold">
                              <span>• {item.concept}</span>
                              <span className="font-mono text-emerald-400 font-bold">{formatCurrency(Number(item.amount) || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleTogglePaid(ticket)}
                        className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Marcar Pagado</span>
                      </button>
                      
                      {/* BOTÓN COMPARTIR / FICHA SS */}
                      <button
                        onClick={() => setReviewTicket(ticket)}
                        className="px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Ver Ficha para Compartir por WhatsApp / PDF"
                      >
                        <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Compartir</span>
                      </button>

                      <button
                        onClick={() => handleOpenTicketModal(ticket.debtorId, ticket)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-700/60"
                        title="Editar Ticket"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Eliminar Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTÓRICO TICKETS PAGADOS */}
      {activeTab === 'tickets_paid' && (
        <div className="space-y-4">
          {paidTicketsList.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base mb-1">No hay tickets liquidados en el histórico</h3>
              <p className="text-xs text-slate-400 font-medium">Los tickets que me marques como pagados aparecerán archivados en esta sección.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paidTicketsList.map((ticket) => {
                const debtor = debtors.find((d) => String(d.id) === String(ticket.debtorId));

                return (
                  <div key={ticket.id} className="glass-card rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            PAGADO / LIQUIDADO
                          </span>
                          <h4 className="font-extrabold text-white text-base tracking-tight">{ticket.description}</h4>
                          <p className="text-xs text-slate-300 font-semibold mt-0.5">
                            Deudor: <span className="font-extrabold text-cyan-300">{debtor ? debtor.name : ticket.debtorName || `ID ${ticket.debtorId}`}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Liquidado</p>
                          <p className="text-xl font-black tracking-tight text-cyan-300">{formatCurrency(Number(ticket.totalAmount) || 0)}</p>
                        </div>
                      </div>

                      {ticket.items && ticket.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desglose de Conceptos:</p>
                          {ticket.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300 font-semibold">
                              <span>• {item.concept}</span>
                              <span className="font-mono text-cyan-400 font-bold">{formatCurrency(Number(item.amount) || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleTogglePaid(ticket)}
                        className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Desmarcar pagado si te equivocaste y mover a Pendientes"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Desmarcar Pagado</span>
                      </button>

                      {/* BOTÓN COMPARTIR / FICHA SS */}
                      <button
                        onClick={() => setReviewTicket(ticket)}
                        className="px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Ver Ficha para Compartir por WhatsApp / PDF"
                      >
                        <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Compartir</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Eliminar Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DEBTORS */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          {loadingDebtors ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">Cargando deudores...</div>
          ) : errorDebtors ? (
            <div className="py-8 text-center text-rose-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-bold">Error al obtener deudores</p>
              <button onClick={() => refetchDebtors()} className="text-xs underline text-slate-400">Reintentar</button>
            </div>
          ) : debtors.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base mb-1">No hay deudores registrados</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">Agrega deudores para asociarles préstamos y conceptos</p>
              <button
                onClick={() => handleOpenDebtorModal()}
                className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Agregar Deudor</span>
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0b0f19] border-b border-slate-800 text-emerald-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Deudor</th>
                      <th className="py-3.5 px-4">Contacto</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {debtors.map((debtor) => (
                      <tr key={debtor.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-black text-white">{debtor.name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-semibold">{debtor.contactInfo || <span className="text-slate-500">Sin contacto</span>}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenTicketModal(debtor.id)}
                              className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-[11px] font-bold transition"
                            >
                              + Nuevo Ticket
                            </button>
                            <button
                              onClick={() => handleOpenDebtorModal(debtor)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDebtor(debtor.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SERVICIOS RECURRENTES */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Servicios Recurrentes Mensuales</h3>
              <p className="text-xs text-slate-400">Configura servicios que ayudas a pagar (ej: Telmex, Luz, Netflix) para agregarlos automáticamente a tickets.</p>
            </div>
            <button
              onClick={() => handleOpenRecurringModal()}
              className="px-3.5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-500/25 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Servicio</span>
            </button>
          </div>

          {recurringItems.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-slate-800">
              <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base mb-1">No hay servicios recurrentes registrados</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">Ejemplo: Mamá, Telmex, cada 14 del mes, 550 MXN</p>
              <button
                onClick={() => handleOpenRecurringModal()}
                className="px-4 py-2.5 btn-emerald rounded-xl text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Primer Servicio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recurringItems.map((rec) => (
                <div key={rec.id} className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          COBRO RECURRENTE
                        </span>
                        <h4 className="font-extrabold text-white text-base">{rec.serviceName}</h4>
                        <p className="text-xs text-cyan-400 font-bold mt-0.5">
                          Deudor: <span className="text-white">{rec.debtorName}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-black text-white">{formatCurrency(rec.amount)}</p>
                        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Día {rec.dayOfMonth} de cada mes</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleChargeRecurringToTicket(rec)}
                      className="px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-white hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>Cargar a Ticket del Mes</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenRecurringModal(rec)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                        title="Editar servicio"
                      >
                        <Edit2 className="w-4 h-4 text-cyan-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecurringService(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL FICHA SS / REVIEW PARA CAPTURA Y COMPARTIR */}
      {reviewTicket && (
        <TicketReviewModal
          ticket={reviewTicket}
          debtorName={debtors.find((d) => String(d.id) === String(reviewTicket.debtorId))?.name}
          onClose={() => setReviewTicket(null)}
        />
      )}

      {/* MODAL: PROGRAMAR / EDITAR SERVICIO RECURRENTE */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#0f172a]/95 rounded-2xl border border-emerald-500/30 w-full max-w-md p-6 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-black text-white mb-4">
              {editingRecurring ? 'Editar Servicio Recurrente' : 'Programar Servicio Recurrente'}
            </h3>
            <form onSubmit={handleSaveRecurringService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Deudor *</label>
                <select
                  required
                  value={recDebtorId}
                  onChange={(e) => setRecDebtorId(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-[#0f172a] text-white font-semibold"
                >
                  <option value="" disabled className="bg-[#0f172a] text-slate-400">Selecciona un deudor</option>
                  {debtors.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0f172a] text-white font-semibold">{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={recServiceName}
                  onChange={(e) => setRecServiceName(e.target.value)}
                  placeholder="Ej: Telmex, Luz, Netflix, Internet"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Día de Cobro (1-31) *</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={recDayOfMonth}
                    onChange={(e) => setRecDayOfMonth(Number(e.target.value))}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Monto Mensual *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    placeholder="550.00"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecurringModal(false)}
                  className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 btn-emerald rounded-xl text-xs transition flex items-center gap-2"
                >
                  <span>{editingRecurring ? 'Actualizar Servicio' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR DEUDOR */}
      {showDebtorModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#0f172a]/95 rounded-2xl border border-emerald-500/30 w-full max-w-md p-6 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-black text-white mb-4">{editingDebtor ? 'Editar Deudor' : 'Nuevo Deudor'}</h3>
            <form onSubmit={handleSaveDebtor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={debtorName}
                  onChange={(e) => setDebtorName(e.target.value)}
                  placeholder="Ej: Carlos López"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Contacto</label>
                <input
                  type="text"
                  value={debtorContact}
                  onChange={(e) => setDebtorContact(e.target.value)}
                  placeholder="Ej: carlos@email.com o 555-0192"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDebtorModal(false)}
                  className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createDebtor.isPending || updateDebtor.isPending}
                  className="px-4 py-2 btn-emerald rounded-xl text-xs transition flex items-center gap-2"
                >
                  {(createDebtor.isPending || updateDebtor.isPending) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingDebtor ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR TICKET DE DEUDA */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#0f172a]/95 rounded-2xl border border-emerald-500/30 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-3xl">
            <h3 className="text-lg font-black text-white mb-4">
              {editingTicket ? 'Editar Ticket de Deuda' : 'Nuevo Ticket de Deuda'}
            </h3>
            <form onSubmit={handleSaveTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Deudor *</label>
                <select
                  required
                  value={ticketDebtorId}
                  onChange={(e) => setTicketDebtorId(e.target.value)}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-[#0f172a] text-white font-semibold"
                >
                  <option value="" disabled className="bg-[#0f172a] text-slate-400">Selecciona un deudor</option>
                  {debtors.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0f172a] text-white font-semibold">{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Descripción del Préstamo / Ticket *</label>
                <input
                  type="text"
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Ej: Préstamo para equipo o gastos del mes"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-emerald-400 uppercase">Desglose de Conceptos *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                  >
                    + Agregar Concepto
                  </button>
                </div>

                <div className="space-y-2">
                  {ticketItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Concepto (ej: Telmex, Supermercado)"
                        required
                        value={item.concept}
                        onChange={(e) => handleItemChange(index, 'concept', e.target.value)}
                        className="glass-input flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        required
                        value={item.amount}
                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                        className="glass-input w-28 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-semibold"
                      />
                      {ticketItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTicket.isPending || updateTicket.isPending}
                  className="px-4 py-2 btn-emerald rounded-xl text-xs transition flex items-center gap-2"
                >
                  {(createTicket.isPending || updateTicket.isPending) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingTicket ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
