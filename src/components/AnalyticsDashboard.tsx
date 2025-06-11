
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AnalyticsDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewPeriod, setViewPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  const getFilteredTasks = () => {
    const now = new Date(selectedDate);
    
    if (viewPeriod === 'day') {
      const dateString = now.toISOString().split('T')[0];
      return tasks.filter(task => task.date === dateString);
    } else if (viewPeriod === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      });
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      return tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= startOfMonth && taskDate <= endOfMonth;
      });
    }
  };

  const calculateTimeByCategory = () => {
    const filteredTasks = getFilteredTasks();
    const categoryTotals: Record<TaskCategory, number> = {
      sleep: 0, meditate: 0, yoga: 0, study: 0, work: 0, meet: 0, journey: 0
    };

    filteredTasks.forEach(task => {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;
      
      categoryTotals[task.category] += duration;
    });

    return Object.entries(categoryTotals).map(([category, minutes]) => ({
      category: TASK_CATEGORIES[category as TaskCategory].name,
      hours: Math.round((minutes / 60) * 10) / 10,
      color: TASK_CATEGORIES[category as TaskCategory].bgColor
    }));
  };

  const calculateEfficiency = () => {
    const filteredTasks = getFilteredTasks();
    const totalTasks = filteredTasks.length;
    const acknowledgedTasks = filteredTasks.filter(task => task.acknowledged === 'going').length;
    
    return totalTasks > 0 ? Math.round((acknowledgedTasks / totalTasks) * 100) : 0;
  };

  const chartData = calculateTimeByCategory();
  const efficiency = calculateEfficiency();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h2>
          <div className="flex space-x-2">
            {['day', 'week', 'month'].map((period) => (
              <Button
                key={period}
                variant={viewPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewPeriod(period as typeof viewPeriod)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
            <p className="text-2xl font-bold text-foreground">{getFilteredTasks().length}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Efficiency Rate</h3>
            <p className="text-2xl font-bold text-green-700">{efficiency}%</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Hours</h3>
            <p className="text-2xl font-bold text-blue-700">
              {Math.round(chartData.reduce((sum, item) => sum + item.hours, 0) * 10) / 10}h
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time by Category Bar Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Time by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
              <Bar dataKey="hours" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.filter(item => item.hours > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} hours`, 'Hours']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
