import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentService } from '../services/investmentService';
import { InvestmentHoldingRequest } from '../types';

export const useInvestments = (accountId?: string | number) => {
  return useQuery({
    queryKey: ['investments', accountId || 'ALL'],
    queryFn: () => investmentService.getHoldings(accountId),
  });
};

export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['investments-summary'],
    queryFn: () => investmentService.getPortfolioSummary(),
  });
};

export const useStockQuotes = (symbols: string[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ['stock-quotes', symbols.sort().join(',')],
    queryFn: () => investmentService.getQuotes(symbols),
    enabled: enabled && symbols.length > 0,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });
};

export const useCreateHolding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: InvestmentHoldingRequest) => investmentService.createHolding(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUpdateHolding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number | string; request: InvestmentHoldingRequest }) =>
      investmentService.updateHolding(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteHolding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, refundToCash }: { id: number | string; refundToCash?: boolean }) =>
      investmentService.deleteHolding(id, refundToCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useRefreshedQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => investmentService.refreshQuotes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock-quotes'] });
    },
  });
};
