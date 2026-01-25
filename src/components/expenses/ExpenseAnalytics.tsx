import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses } from '@/hooks/useExpenses';
import { CURRENCY_SYMBOLS } from '@/types/expense';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

const ExpenseAnalytics = () => {
  const { expenses, settings, categories } = useExpenses();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const currencySymbol = settings ? CURRENCY_SYMBOLS[settings.preferredCurrency] : '₹';

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (period) {
      case 'week':
        return { start: subDays(today, 7), end: today };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'year':
        return { start: subMonths(today, 12), end: today };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [period]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
  }, [expenses, dateRange]);

  // Daily spending trend data
  const dailyTrendData = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpenses = filteredExpenses.filter(e => e.expenseDate === dayStr);
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        date: format(day, period === 'week' ? 'EEE' : 'MMM d'),
        amount: total,
      };
    }).slice(-30); // Limit to last 30 days for readability
  }, [filteredExpenses, dateRange, period]);

  // Category-wise spending
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { name: string; icon: string; total: number }> = {};
    
    filteredExpenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Other';
      const categoryIcon = expense.category?.icon || '💰';
      
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { name: categoryName, icon: categoryIcon, total: 0 };
      }
      categoryTotals[categoryName].total += expense.amount;
    });
    
    return Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total)
      .map((cat, index) => ({
        ...cat,
        color: COLORS[index % COLORS.length],
      }));
  }, [filteredExpenses]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgDaily = dailyTrendData.length > 0 
      ? total / dailyTrendData.filter(d => d.amount > 0).length 
      : 0;
    const highestDay = dailyTrendData.reduce((max, d) => d.amount > max.amount ? d : max, { date: '-', amount: 0 });
    const highestCategory = categoryData[0] || { name: '-', total: 0 };
    
    return { total, avgDaily, highestDay, highestCategory };
  }, [filteredExpenses, dailyTrendData, categoryData]);

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border p-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold">{currencySymbol}{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Daily Average</p>
            <p className="text-xl font-bold">{currencySymbol}{Math.round(stats.avgDaily).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Highest Day</p>
            <p className="text-lg font-bold">{currencySymbol}{stats.highestDay.amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{stats.highestDay.date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Top Category</p>
            <p className="text-lg font-bold">{stats.highestCategory.name}</p>
            <p className="text-xs text-muted-foreground">
              {currencySymbol}{stats.highestCategory.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trend">Spending Trend</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Spending</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      className="fill-muted-foreground"
                      tickFormatter={(value) => `${currencySymbol}${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="total"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs truncate">{cat.icon} {cat.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {currencySymbol}{cat.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseAnalytics;
