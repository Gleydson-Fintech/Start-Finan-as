export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface CategoryStat {
  category: string;
  total: number;
}

export interface Reminder {
  id: string;
  description: string;
  date: string;
  completed: boolean;
  category: string;
}

export interface FinancialAlert {
  id: string;
  type: 'low_balance' | 'high_spending' | 'budget_limit' | 'bill_due' | 'budget_near';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  reminders: boolean;
  alerts: boolean;
  tips: boolean;
  lowBalanceThreshold: number;
}

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  dueDay: number; // ex: 5 (vence todo dia 05)
  paidMonths: string[]; // ex: ['2026-08'] se pago no mês
  notes?: string;
}

