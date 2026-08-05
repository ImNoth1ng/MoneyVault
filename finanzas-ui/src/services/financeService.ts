import apiClient from '../lib/apiClient';
import { CashInventory, BalanceSnapshot, AuditLog, PaginatedResponse, CurrencyBill } from '../types';

const client = apiClient.getClient();

export const cashService = {
  getCurrent: async (): Promise<CashInventory> => {
    const { data } = await client.get<CashInventory>('/cash-inventory');
    return data;
  },

  updateBills: async (bills: CurrencyBill[]): Promise<CashInventory> => {
    const { data } = await client.put<CashInventory>('/cash-inventory', { bills });
    return data;
  },

  getHistory: async (page = 0, size = 20): Promise<PaginatedResponse<CashInventory>> => {
    const { data } = await client.get<PaginatedResponse<CashInventory>>('/cash-inventory/history', {
      params: { page, size },
    });
    return data;
  },
};

export const balanceSnapshotService = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<BalanceSnapshot>> => {
    const { data } = await client.get<PaginatedResponse<BalanceSnapshot>>('/balance-snapshots', {
      params: { page, size },
    });
    return data;
  },

  getByDateRange: async (
    startDate: string,
    endDate: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<BalanceSnapshot>> => {
    const { data } = await client.get<PaginatedResponse<BalanceSnapshot>>('/balance-snapshots/range', {
      params: { startDate, endDate, page, size },
    });
    return data;
  },

  create: async (): Promise<BalanceSnapshot> => {
    const { data } = await client.post<BalanceSnapshot>('/balance-snapshots');
    return data;
  },
};

export const auditService = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await client.get<PaginatedResponse<AuditLog>>('/audit-logs', {
      params: { page, size },
    });
    return data;
  },

  getByDateRange: async (
    startDate: string,
    endDate: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await client.get<PaginatedResponse<AuditLog>>('/audit-logs/range', {
      params: { startDate, endDate, page, size },
    });
    return data;
  },

  getByEntityType: async (
    entityType: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await client.get<PaginatedResponse<AuditLog>>('/audit-logs/entity-type', {
      params: { entityType, page, size },
    });
    return data;
  },
};
