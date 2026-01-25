export type CurrencyType = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'JPY' | 'CNY';

export type GroupInviteStatus = 'pending' | 'accepted' | 'rejected';

export type GroupType = 'family' | 'roommates' | 'class' | 'friends' | 'work';

export interface ExpenseCategory {
  id: string;
  userId: string | null;
  name: string;
  icon: string;
  isSystem: boolean;
  parentId: string | null;
  createdAt: string;
  subcategories?: ExpenseCategory[];
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description: string | null;
  groupType: GroupType;
  createdBy: string;
  inviteCode: string;
  currency: CurrencyType;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  status: GroupInviteStatus;
  joinedAt: string | null;
  createdAt: string;
  userEmail?: string;
}

export interface Expense {
  id: string;
  userId: string;
  groupId: string | null;
  categoryId: string | null;
  amount: number;
  currency: CurrencyType;
  note: string | null;
  expenseDate: string;
  expenseTime: string;
  isGroupExpense: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory;
}

export interface UserExpenseSettings {
  id: string;
  userId: string;
  preferredCurrency: CurrencyType;
  createdAt: string;
  updatedAt: string;
}

export interface DailyExpenseSummary {
  date: string;
  total: number;
  count: number;
  byCategory: Record<string, number>;
}

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
};

export const CURRENCY_NAMES: Record<CurrencyType, string> = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
};
