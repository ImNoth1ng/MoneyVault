import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtorService, ticketService } from '../services/debtService';
import { TicketItem } from '../types';

export const useDebtors = () => {
  return useQuery({
    queryKey: ['debtors'],
    queryFn: () => debtorService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateDebtor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (debtor: { name: string; contactInfo?: string }) => debtorService.create(debtor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};

export const useUpdateDebtor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, debtor }: { id: string | number; debtor: { name: string; contactInfo?: string } }) =>
      debtorService.update(id, debtor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};

export const useDeleteDebtor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => debtorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
    },
  });
};

export const useDebtTickets = () => {
  return useQuery({
    queryKey: ['debt-tickets'],
    queryFn: () => ticketService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateDebtTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticket: { debtorId: string | number; description: string; items: TicketItem[] }) =>
      ticketService.create(ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ticket }: { id: string | number; ticket: { debtorId: string | number; description: string; items: TicketItem[] } }) =>
      ticketService.update(id, ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};

export const useMarkTicketPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => ticketService.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => ticketService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
    },
  });
};
