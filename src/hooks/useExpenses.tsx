import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  Expense, 
  ExpenseCategory, 
  CurrencyType,
  UserExpenseSettings,
  DailyExpenseSummary 
} from '@/types/expense';
import { format } from 'date-fns';

// Offline storage keys
const OFFLINE_EXPENSES_KEY = 'lifetrack-offline-expenses';
const PENDING_SYNC_KEY = 'lifetrack-pending-expense-sync';

interface OfflineExpense extends Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {
  tempId: string;
  pendingSync: boolean;
}

export const useExpenses = (date?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pending expenses when back online
  useEffect(() => {
    if (isOnline && user) {
      syncPendingExpenses();
    }
  }, [isOnline, user]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform to hierarchical structure
      const parentCategories = data
        .filter(c => c.parent_id === null)
        .map(c => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          icon: c.icon || '💰',
          isSystem: c.is_system || false,
          parentId: c.parent_id,
          createdAt: c.created_at,
          subcategories: data
            .filter(sub => sub.parent_id === c.id)
            .map(sub => ({
              id: sub.id,
              userId: sub.user_id,
              name: sub.name,
              icon: sub.icon || '💰',
              isSystem: sub.is_system || false,
              parentId: sub.parent_id,
              createdAt: sub.created_at,
            }))
        }));
      
      return parentCategories as ExpenseCategory[];
    },
    enabled: !!user,
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading, error } = useQuery({
    queryKey: ['expenses', date],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (
            id,
            name,
            icon,
            is_system,
            parent_id
          )
        `)
        .order('expense_date', { ascending: false })
        .order('expense_time', { ascending: false });
      
      if (date) {
        query = query.eq('expense_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(e => ({
        id: e.id,
        userId: e.user_id,
        groupId: e.group_id,
        categoryId: e.category_id,
        amount: parseFloat(String(e.amount)),
        currency: e.currency as CurrencyType,
        note: e.note,
        expenseDate: e.expense_date,
        expenseTime: e.expense_time,
        isGroupExpense: e.is_group_expense,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        category: e.expense_categories ? {
          id: e.expense_categories.id,
          name: e.expense_categories.name,
          icon: e.expense_categories.icon || '💰',
          isSystem: e.expense_categories.is_system,
          parentId: e.expense_categories.parent_id,
        } : undefined,
      })) as Expense[];
    },
    enabled: !!user,
  });

  // Fetch user settings
  const { data: settings } = useQuery({
    queryKey: ['expense-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_expense_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('user_expense_settings')
          .insert({ user_id: user!.id })
          .select()
          .single();
        
        if (createError) throw createError;
        
        return {
          id: newSettings.id,
          userId: newSettings.user_id,
          preferredCurrency: newSettings.preferred_currency as CurrencyType,
          createdAt: newSettings.created_at,
          updatedAt: newSettings.updated_at,
        } as UserExpenseSettings;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        preferredCurrency: data.preferred_currency as CurrencyType,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as UserExpenseSettings;
    },
    enabled: !!user,
  });

  // Save expense to offline storage
  const saveOfflineExpense = (expense: OfflineExpense) => {
    const stored = localStorage.getItem(OFFLINE_EXPENSES_KEY);
    const expenses: OfflineExpense[] = stored ? JSON.parse(stored) : [];
    expenses.push(expense);
    localStorage.setItem(OFFLINE_EXPENSES_KEY, JSON.stringify(expenses));
    
    // Add to pending sync
    const pending = localStorage.getItem(PENDING_SYNC_KEY);
    const pendingList: string[] = pending ? JSON.parse(pending) : [];
    pendingList.push(expense.tempId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingList));
  };

  // Sync pending expenses
  const syncPendingExpenses = async () => {
    const stored = localStorage.getItem(OFFLINE_EXPENSES_KEY);
    if (!stored) return;
    
    const offlineExpenses: OfflineExpense[] = JSON.parse(stored);
    const pendingExpenses = offlineExpenses.filter(e => e.pendingSync);
    
    for (const expense of pendingExpenses) {
      try {
        await supabase.from('expenses').insert({
          user_id: expense.userId,
          group_id: expense.groupId,
          category_id: expense.categoryId,
          amount: expense.amount,
          currency: expense.currency,
          note: expense.note,
          expense_date: expense.expenseDate,
          expense_time: expense.expenseTime,
          is_group_expense: expense.isGroupExpense,
        });
        
        // Remove from pending
        const index = offlineExpenses.findIndex(e => e.tempId === expense.tempId);
        if (index > -1) {
          offlineExpenses.splice(index, 1);
        }
      } catch (error) {
        console.error('Failed to sync expense:', error);
      }
    }
    
    localStorage.setItem(OFFLINE_EXPENSES_KEY, JSON.stringify(offlineExpenses));
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'category'>) => {
      if (!isOnline) {
        // Save offline
        const offlineExpense: OfflineExpense = {
          ...expense,
          tempId: `temp-${Date.now()}`,
          pendingSync: true,
        };
        saveOfflineExpense(offlineExpense);
        return offlineExpense;
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: expense.userId,
          group_id: expense.groupId,
          category_id: expense.categoryId,
          amount: expense.amount,
          currency: expense.currency,
          note: expense.note,
          expense_date: expense.expenseDate,
          expense_time: expense.expenseTime,
          is_group_expense: expense.isGroupExpense,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          category_id: expense.categoryId,
          amount: expense.amount,
          currency: expense.currency,
          note: expense.note,
          expense_date: expense.expenseDate,
          expense_time: expense.expenseTime,
          is_group_expense: expense.isGroupExpense,
          group_id: expense.groupId,
        })
        .eq('id', expense.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  // Update currency preference
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: CurrencyType) => {
      const { error } = await supabase
        .from('user_expense_settings')
        .update({ preferred_currency: currency })
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-settings'] });
    },
  });

  // Calculate daily summary
  const getDailySummary = useCallback((targetDate: string): DailyExpenseSummary => {
    const dayExpenses = expenses.filter(e => e.expenseDate === targetDate);
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    
    dayExpenses.forEach(e => {
      const categoryName = e.category?.name || 'Other';
      byCategory[categoryName] = (byCategory[categoryName] || 0) + e.amount;
    });
    
    return {
      date: targetDate,
      total,
      count: dayExpenses.length,
      byCategory,
    };
  }, [expenses]);

  // Get today's total
  const todayTotal = expenses
    .filter(e => e.expenseDate === format(new Date(), 'yyyy-MM-dd'))
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    expenses,
    categories,
    settings,
    isLoading: expensesLoading || categoriesLoading,
    error,
    isOnline,
    todayTotal,
    createExpense: createExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    updateCurrency: updateCurrencyMutation.mutateAsync,
    getDailySummary,
    isCreating: createExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
  };
};
