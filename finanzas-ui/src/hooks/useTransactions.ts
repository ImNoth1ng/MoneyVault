import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService, recurringTransactionService } from '../services/transactionService';
import { TransactionRequest, RecurringTransactionRequest } from '../types';

export const useTransactions = (type?: string) => {
  return useQuery({
    queryKey: ['transactions', type || 'ALL'],
    queryFn: () => transactionService.getAll(type),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transaction: TransactionRequest) => transactionService.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: TransactionRequest }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
};

export const useRecurringTransactions = () => {
  return useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: () => recurringTransactionService.getAll(),
  });
};

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: RecurringTransactionRequest) =>
      recurringTransactionService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: RecurringTransactionRequest }) =>
      recurringTransactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => recurringTransactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });
};
