import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import { Account } from '../types';

export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useAccount = (id: string | number | null) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => (id ? accountService.getById(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
      accountService.create(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['balance-snapshots'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, account }: { id: string | number; account: Partial<Account> }) => accountService.update(id, account),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['balance-snapshots'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => accountService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['balance-snapshots'] });
    },
  });
};

export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, frequency }: { accountId: string | number; frequency?: 'MONTHLY' | 'FIFTEEN_DAYS' | 'FORTNIGHTLY' }) =>
      accountService.createSnapshot(accountId, frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-snapshots'] });
    },
  });
};

export const useCreateGlobalSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customAmount, frequency }: { customAmount: number; frequency?: 'MONTHLY' | 'FIFTEEN_DAYS' | 'FORTNIGHTLY' }) =>
      accountService.createGlobalSnapshot(customAmount, frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance-snapshots'] });
    },
  });
};

export const useAllSnapshots = () => {
  return useQuery({
    queryKey: ['balance-snapshots'],
    queryFn: () => accountService.getAllSnapshots(),
    staleTime: 1000 * 60 * 2,
  });
};
