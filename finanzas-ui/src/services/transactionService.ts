import apiClient from '../lib/apiClient';
import {
  Transaction,
  TransactionRequest,
  RecurringTransaction,
  RecurringTransactionRequest,
} from '../types';

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

  update: async (id: string | number, transaction: TransactionRequest): Promise<Transaction> => {
    const { data } = await client.put<Transaction>(`/transactions/${id}`, transaction);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/transactions/${id}`);
  },
};

export const recurringTransactionService = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const { data } = await client.get<RecurringTransaction[]>('/recurring-transactions');
    return data;
  },

  create: async (request: RecurringTransactionRequest): Promise<RecurringTransaction> => {
    const { data } = await client.post<RecurringTransaction>('/recurring-transactions', request);
    return data;
  },

  update: async (
    id: string | number,
    request: RecurringTransactionRequest
  ): Promise<RecurringTransaction> => {
    const { data } = await client.put<RecurringTransaction>(`/recurring-transactions/${id}`, request);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/recurring-transactions/${id}`);
  },
};
