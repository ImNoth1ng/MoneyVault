import apiClient from '../lib/apiClient';
import { Transaction, TransactionRequest } from '../types';

const client = apiClient.getClient();

export const transactionService = {
  getAll: async (type?: string): Promise<Transaction[]> => {
    const params: Record<string, any> = {};
    if (type && type !== 'ALL') {
      params.type = type;
    }
    const { data } = await client.get<Transaction[]>('/transactions', { params });
    return data;
  },

  getById: async (id: string | number): Promise<Transaction> => {
    const { data } = await client.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  create: async (transaction: TransactionRequest): Promise<Transaction> => {
    const { data } = await client.post<Transaction>('/transactions', transaction);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/transactions/${id}`);
  },
};
