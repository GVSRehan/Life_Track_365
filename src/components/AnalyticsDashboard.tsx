
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const AnalyticsDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate] = useState(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  const getFilteredTasks = () => {
    const now = new Date();
    const startDate = new Date();

    switch (timeFrame) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= startDate && taskDate <= now;
    });
  };

  const calculateCategoryStats = () => {
    const filteredTasks = getFilteredTasks();
    const stats: Record<TaskCategory, { total: number; completed: number; minutes: number }> = {
      sleep: { total: 0, completed: 0, minutes: 0 },
      meditate: { total: 0, completed: 0, minutes: 0 },
      yoga: { total: 0, completed: 0, minutes: 0 },
      study: { total: 0, completed: 0, minutes: 0 },
      work: { total: 0, completed: 0, minutes: 0 },
      meet: { total: 0, completed: 0, minutes: 0 },
      journey: { total: 0, completed: 0, minutes: 0 }
    };

    filteredTasks.forEach(task => {
      const [startHour, startMin] = task.startTime.split(':').map(Number);
      const [endHour, endMin] = task.endTime.split(':').map(Number);
      const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      stats[task.category].total++;
      stats[task.category].minutes += minutes;
      
      if (task.acknowledged === 'going') {
        stats[task.category].completed++;
      }
    });

    return stats;
  };

  const categoryStats = calculateCategoryStats();

  const pieData = Object.entries(categoryStats)
    .filter(([_, stats]) => stats.minutes > 0)
    .map(([category, stats]) => ({
      name: TASK_CATEGORIES[category as TaskCategory].name,
      value: Math.round(stats.minutes / 60 * 10) / 10, // Convert to hours
      category: category as TaskCategory
    }));

  const efficiencyData = Object.entries(categoryStats)
    .filter(([_, stats]) => stats.total > 0)
    .map(([category, stats]) => ({
      name: TASK_CATEGORIES[category as TaskCategory].name,
      efficiency: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      category: category as TaskCategory
    }));

  const getColorForCategory = (category: TaskCategory) => {
    const colorMap = {
      sleep: '#3b82f6',
      meditate: '#8b5cf6',
      yoga: '#10b981',
      study: '#f97316',
      work: '#ef4444',
      meet: '#6b7280',
      journey: '#f59e0b'
    };
    return colorMap[category];
  };

  const totalEfficiency = efficiencyData.length > 0 
    ? Math.round(efficiencyData.reduce((sum, item) => sum + item.efficiency, 0) / efficiencyData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h2>
          
          {/* Mobile: Fixed Bottom Tab Bar Style */}
          {isMobile ? (
            <div className="flex w-full bg-muted rounded-lg p-1">
              {['day', 'week', 'month'].map((frame) => (
                <button
                  key={frame}
                  onClick={() => setTimeFrame(frame as any)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium rounded-md transition-all capitalize",
                    timeFrame === frame 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {frame}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex space-x-2">
              {['day', 'week', 'month'].map((frame) => (
                <Button
                  key={frame}
                  variant={timeFrame === frame ? 'default' : 'outline'}
                  onClick={() => setTimeFrame(frame as any)}
                  className="capitalize"
                >
                  {frame}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-accent rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sleep</h3>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(categoryStats.sleep.minutes / 60)}h
            </p>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Efficiency</h3>
            <p className="text-2xl font-bold text-foreground">{totalEfficiency}%</p>
          </div>
          <div className="bg-accent rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Tasks Completed</h3>
            <p className="text-2xl font-bold text-foreground">
              {Object.values(categoryStats).reduce((sum, stats) => sum + stats.completed, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution Pie Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
          {pieData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorForCategory(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} hours`, 'Time']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available for the selected time frame
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((entry) => (
              <div key={entry.category} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColorForCategory(entry.category) }}
                />
                <span className="text-sm text-foreground">{entry.name}</span>
                <span className="text-sm text-muted-foreground">{entry.value}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Task Efficiency</h3>
          {efficiencyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Efficiency']} />
                  <Bar 
                    dataKey="efficiency" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No efficiency data available
            </div>
          )}
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(categoryStats)
            .filter(([_, stats]) => stats.total > 0)
            .map(([category, stats]) => {
              const config = TASK_CATEGORIES[category as TaskCategory];
              const efficiency = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const hours = Math.round(stats.minutes / 60 * 10) / 10;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColorForCategory(category as TaskCategory) }}
                    />
                    <span className="font-medium text-foreground">{config.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-muted-foreground">{hours}h</span>
                    <span className="text-muted-foreground">{stats.completed}/{stats.total} tasks</span>
                    <span className={cn(
                      "font-medium px-2 py-1 rounded",
                      efficiency >= 80 ? "bg-green-100 text-green-700" :
                      efficiency >= 60 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {efficiency}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
