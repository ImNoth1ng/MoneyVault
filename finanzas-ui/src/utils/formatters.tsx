import { Wallet, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { AccountType } from '../types';
import dayjs from 'dayjs';

export const formatCurrency = (value: number | string, currency: string = 'MXN'): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numValue);
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatBigDecimal = (value: number | string): number => {
  return typeof value === 'string' ? parseFloat(value) : (value || 0);
};

export const getAccountTypeIcon = (type: string | AccountType) => {
  const iconClass = 'w-5 h-5 text-emerald-400';

  switch (type) {
    case AccountType.DEBIT:
    case 'CHECKING':
    case 'SAVINGS':
      return <Wallet className={iconClass} />;
    case AccountType.CREDIT:
    case 'CREDIT_CARD':
      return <CreditCard className={iconClass} />;
    case AccountType.INVESTMENT:
      return <TrendingUp className={iconClass} />;
    case AccountType.CASH:
      return <DollarSign className={iconClass} />;
    default:
      return <Wallet className={iconClass} />;
  }
};

export const getAccountTypeLabel = (type: string | AccountType): string => {
  const labels: Record<string, string> = {
    DEBIT: 'Cuenta de Débito',
    CREDIT: 'Tarjeta de Crédito',
    INVESTMENT: 'Inversión',
    CASH: 'Efectivo',
  };

  return labels[type] || type;
};

export const abbreviateNumber = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(2);
};
