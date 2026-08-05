import apiClient from '../lib/apiClient';
import { Account } from '../types';

const client = apiClient.getClient();

export const accountService = {
  getAll: async (): Promise<Account[]> => {
    const { data } = await client.get<Account[]>('/accounts');
    return data;
  },

  getById: async (id: string | number): Promise<Account> => {
    const { data } = await client.get<Account>(`/accounts/${id}`);
    return data;
  },

  create: async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> => {
    const { data } = await client.post<Account>('/accounts', account);
    return data;
  },

  update: async (id: string | number, account: Partial<Account>): Promise<Account> => {
    const { data } = await client.put<Account>(`/accounts/${id}`, account);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await client.delete(`/accounts/${id}`);
  },

  createSnapshot: async (accountId: string | number, frequency: 'MONTHLY' | 'FIFTEEN_DAYS' | 'FORTNIGHTLY' = 'FIFTEEN_DAYS') => {
    const { data } = await client.post(`/accounts/${accountId}/snapshots`, { frequency });
    return data;
  },

  createGlobalSnapshot: async (customAmount: number, frequency: 'MONTHLY' | 'FIFTEEN_DAYS' | 'FORTNIGHTLY' = 'FIFTEEN_DAYS') => {
    const { data } = await client.post('/accounts/snapshots/global', {
      customAmount,
      frequency,
    });
    return data;
  },

  getSnapshots: async (accountId: string | number) => {
    const { data } = await client.get(`/accounts/${accountId}/snapshots`);
    return data;
  },

  getAllSnapshots: async () => {
    const { data } = await client.get('/accounts/snapshots/user');
    return data;
  },
};
