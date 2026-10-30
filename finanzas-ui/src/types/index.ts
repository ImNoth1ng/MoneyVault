// Tipos de enumeración del backend
export enum AccountType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  VALES = 'VALES',
  CASH = 'CASH',
  INVESTMENT = 'INVESTMENT',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  INTEREST = 'INTEREST',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  PARTIAL = 'PARTIAL',
}

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  PAYMENT = 'PAYMENT',
}

// Interfaces del usuario
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de autenticación
export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  userId: number | string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

// Interfaces de cuentas
export interface Account {
  id: string | number;
  userId?: string | number;
  name: string;
  type: AccountType;
  currentBalance: string | number;
  creditLimit?: string | number | null;
  usedCredit?: string | number;
  currency: string;
  active?: boolean;

  // Desglose de billetes en efectivo
  b1000Count?: number;
  b500Count?: number;
  b200Count?: number;
  b100Count?: number;
  b50Count?: number;
  b20Count?: number;

  createdAt?: string;
  updatedAt?: string;
}

// Interfaces de transacciones
export interface Transaction {
  id: string | number;
  userId?: string | number;
  accountId: string | number;
  accountName?: string;
  accountType?: string;
  destinationAccountId?: string | number | null;
  destinationAccountName?: string | null;
  destinationAccountType?: string | null;
  amount: string | number;
  type: TransactionType | string;
  status?: TransactionStatus;
  description?: string;
  category?: string;
  senderOrRecipient?: string;
  debtTicketId?: string | number | null;
  transactionDate?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionRequest {
  accountId: string | number;
  destinationAccountId?: string | number | null;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  category?: string;
  description?: string;
  senderOrRecipient?: string;
  debtTicketId?: string | number | null;
  transactionDate?: string;
}

export interface RecurringTransaction {
  id: number | string;
  userId?: number | string;
  name: string;
  accountId: number | string;
  accountName?: string;
  accountType?: string;
  destinationAccountId?: number | string | null;
  destinationAccountName?: string | null;
  destinationAccountType?: string | null;
  amount: number | string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | string;
  category?: string;
  description?: string;
  senderOrRecipient?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringTransactionRequest {
  name: string;
  accountId: number | string;
  destinationAccountId?: number | string | null;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  category?: string;
  description?: string;
  senderOrRecipient?: string;
}

export interface TicketPaymentRequest {
  accountId: string | number;
  amountReceived: number;
  paymentDate?: string;
  notes?: string;
}

// Interfaces de deudores
export interface Debtor {
  id: string | number;
  name: string;
  contactInfo?: string;
  totalDebt?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaces de tickets de deuda
export interface TicketItem {
  id?: string | number;
  concept: string;
  amount: string | number;
}

export interface DebtTicket {
  id: string | number;
  debtorId: string | number;
  debtorName?: string;
  description: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED';
  isPaid?: boolean;
  totalAmount?: string | number;
  items: TicketItem[];
  issueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaces de efectivo (cash inventory)
export interface CurrencyBill {
  denomination: number;
  quantity: number;
}

export interface CashInventory {
  id: string;
  userId: string;
  bills: CurrencyBill[];
  totalAmount: string | number;
  currency: string;
  lastUpdated: string;
}

// Interfaces de snapshots (balance histórico)
export interface BalanceSnapshot {
  id: string;
  userId: string;
  snapshotDate: string;
  totalAssets: string | number;
  totalLiabilities: string | number;
  netWorth: string | number;
  createdAt: string;
}

// Interfaces de auditoría
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Interfaces de respuestas paginadas
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

// Interfaces de errores
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Interfaces de Inversiones
export interface InvestmentHolding {
  id: number;
  accountId: number;
  accountName?: string;
  accountCurrency?: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  totalInvested: number;
  currency: string;
  assetType?: string;
  buyDate: string;
  notes?: string;

  // Cálculos y datos de mercado en vivo
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  dailyChangePercent?: number;
  currentValueInAccountCurrency?: number;
  totalInvestedInAccountCurrency?: number;
  gainLossInAccountCurrency?: number;
  isQuoteLive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentHoldingRequest {
  accountId: number | string;
  symbol: string;
  name?: string;
  quantity: number;
  buyPrice: number;
  currency?: string;
  assetType?: string;
  buyDate?: string;
  notes?: string;
  deductFromCash?: boolean;
}

export interface StockQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  currency?: string;
  exchangeName?: string;
  sparkline?: number[];
  isLive: boolean;
  fetchedAt?: string;
}

export interface AssetAllocation {
  name: string;
  symbol: string;
  type: string;
  valueMxn: number;
  percentage: number;
  color: string;
}

export interface BrokerSummary {
  accountId: number;
  accountName: string;
  currency: string;
  cashAvailable: number;
  investedValue: number;
  totalCost: number;
  totalPortfolioValue: number;
  gainLoss: number;
  gainLossPercent: number;
  holdingsCount: number;
  holdings: InvestmentHolding[];
}

export interface PortfolioSummary {
  totalPortfolioValueMxn: number;
  totalCashAvailableMxn: number;
  totalAssetsValueMxn: number;
  totalCostBasisMxn: number;
  totalGainLossMxn: number;
  totalGainLossPercent: number;
  usdToMxnRate: number;
  lastUpdated: string;
  brokers: BrokerSummary[];
  allocation: AssetAllocation[];
}

