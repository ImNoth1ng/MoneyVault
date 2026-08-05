import apiClient from '../lib/apiClient';
import { Debtor, DebtTicket, TicketItem } from '../types';

const client = apiClient.getClient();

export const debtorService = {
  getAll: async (): Promise<Debtor[]> => {
    const { data } = await client.get<Debtor[]>('/debtors');
    return data;
  },

  getById: async (id: string | number): Promise<Debtor> => {
    const { data } = await client.get<Debtor>(`/debtors/${id}`);
    return data;
  },

  create: async (debtor: { name: string; contactInfo?: string }): Promise<Debtor> => {
    const { data } = await client.post<Debtor>('/debtors', debtor);
    return data;
  },

  update: async (id: string | number, debtor: { name: string; contactInfo?: string }): Promise<Debtor> => {
    const { data } = await client.put<Debtor>(`/debtors/${id}`, debtor);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/debtors/${id}`);
  },
};

export const ticketService = {
  getAll: async (): Promise<DebtTicket[]> => {
    const { data } = await client.get<DebtTicket[]>('/debt-tickets');
    return data;
  },

  getByDebtor: async (debtorId: string | number): Promise<DebtTicket[]> => {
    const { data } = await client.get<DebtTicket[]>(`/debt-tickets/debtor/${debtorId}`);
    return data;
  },

  getById: async (id: string | number): Promise<DebtTicket> => {
    const { data } = await client.get<DebtTicket>(`/debt-tickets/${id}`);
    return data;
  },

  create: async (ticket: {
    debtorId: string | number;
    description: string;
    items: TicketItem[];
  }): Promise<DebtTicket> => {
    const { data } = await client.post<DebtTicket>('/debt-tickets', ticket);
    return data;
  },

  update: async (
    id: string | number,
    ticket: {
      debtorId: string | number;
      description: string;
      items: TicketItem[];
    }
  ): Promise<DebtTicket> => {
    const { data } = await client.put<DebtTicket>(`/debt-tickets/${id}`, ticket);
    return data;
  },

  markPaid: async (id: string | number): Promise<DebtTicket> => {
    const { data } = await client.put<DebtTicket>(`/debt-tickets/${id}/mark-paid`);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/debt-tickets/${id}`);
  },
};
