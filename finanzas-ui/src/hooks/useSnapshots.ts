import { useQuery } from '@tanstack/react-query';
import { balanceSnapshotService } from '../services/financeService';
import dayjs from 'dayjs';

export const useBalanceSnapshots = (
  months = 12,
  page = 0,
  size = 100
) => {
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(months, 'months').format('YYYY-MM-DD');

  return useQuery({
    queryKey: ['balance-snapshots', startDate, endDate, page, size],
    queryFn: () =>
      balanceSnapshotService.getByDateRange(startDate, endDate, page, size),
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useLatestSnapshot = () => {
  return useQuery({
    queryKey: ['latest-snapshot'],
    queryFn: async () => {
      const result = await balanceSnapshotService.getAll(0, 1);
      return result.content[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10,
  });
};
