import apiClient from '../lib/apiClient';
import { InvestmentHolding, InvestmentHoldingRequest, PortfolioSummary, StockQuote } from '../types';

const client = apiClient.getClient();

export const investmentService = {
  getHoldings: async (accountId?: string | number): Promise<InvestmentHolding[]> => {
    const params: Record<string, any> = {};
    if (accountId && accountId !== 'ALL') {
      params.accountId = accountId;
    }
    const { data } = await client.get<InvestmentHolding[]>('/investments', { params });
    return data;
  },

  createHolding: async (request: InvestmentHoldingRequest): Promise<InvestmentHolding> => {
    const { data } = await client.post<InvestmentHolding>('/investments', request);
    return data;
  },

  updateHolding: async (id: number | string, request: InvestmentHoldingRequest): Promise<InvestmentHolding> => {
    const { data } = await client.put<InvestmentHolding>(`/investments/${id}`, request);
    return data;
  },

  deleteHolding: async (id: number | string, refundToCash: boolean = false): Promise<void> => {
    await client.delete(`/investments/${id}`, {
      params: { refundToCash },
    });
  },

  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const { data } = await client.get<PortfolioSummary>('/investments/summary');
    return data;
  },

  getQuotes: async (symbols: string[], refresh: boolean = false): Promise<Record<string, StockQuote>> => {
    if (!symbols.length) return {};
    const { data } = await client.get<Record<string, StockQuote>>('/investments/quotes', {
      params: {
        symbols: symbols.join(','),
        refresh,
      },
    });
    return data;
  },

  refreshQuotes: async (): Promise<{ message: string }> => {
    const { data } = await client.post<{ message: string }>('/investments/refresh');
    return data;
  },
};
