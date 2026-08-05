import apiClient from '../lib/apiClient';
import { Transaction, PaginatedResponse } from '../types';

const client = apiClient.getClient();

export const transactionService = {
  getAll: async (accountId?: string, page = 0, size = 20): Promise<PaginatedResponse<Transaction>> => {
    const params: Record<string, any> = { page, size };
    if (accountId) {
      params.accountId = accountId;
    }
    const { data } = await client.get<PaginatedResponse<Transaction>>('/transactions', { params });
    return data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const { data } = await client.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  create: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const { data } = await client.post<Transaction>('/transactions', transaction);
    return data;
  },

  update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const { data } = await client.put<Transaction>(`/transactions/${id}`, transaction);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/transactions/${id}`);
  },

  getByDateRange: async (
    startDate: string,
    endDate: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await client.get<PaginatedResponse<Transaction>>('/transactions/range', {
      params: { startDate, endDate, page, size },
    });
    return data;
  },
};
