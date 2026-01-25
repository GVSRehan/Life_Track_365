import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Wallet, TrendingUp, Users, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseGroups } from '@/hooks/useExpenseGroups';
import { CURRENCY_SYMBOLS } from '@/types/expense';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseAnalytics from './ExpenseAnalytics';
import ExpenseGroups from './ExpenseGroups';
import ExpenseSettings from './ExpenseSettings';
import { cn } from '@/lib/utils';

const ExpenseDashboard = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('daily');
  
  const { expenses, settings, todayTotal, isLoading, isOnline } = useExpenses(selectedDate);
  const { groups } = useExpenseGroups();
  
  const currencySymbol = settings ? CURRENCY_SYMBOLS[settings.preferredCurrency] : '₹';

  return (
    <div className="space-y-4">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Offline mode - expenses will sync when connected
          </span>
        </div>
      )}

      {/* Today's Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent Today</p>
              <p className="text-3xl font-bold text-foreground">
                {currencySymbol}{todayTotal.toLocaleString()}
              </p>
            </div>
            <Button 
              size="lg" 
              className="rounded-full h-14 w-14 shadow-lg"
              onClick={() => setShowExpenseForm(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="daily" className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
            {groups.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 ml-1">
                {groups.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          {/* Date Selector */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(format(prev, 'yyyy-MM-dd'));
              }}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-background text-foreground"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(format(next, 'yyyy-MM-dd'));
              }}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>

          {/* Expense List */}
          <ExpenseList 
            expenses={expenses} 
            currencySymbol={currencySymbol}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ExpenseAnalytics />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <ExpenseGroups />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <ExpenseSettings />
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      {showExpenseForm && (
        <ExpenseForm 
          onClose={() => setShowExpenseForm(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default ExpenseDashboard;
