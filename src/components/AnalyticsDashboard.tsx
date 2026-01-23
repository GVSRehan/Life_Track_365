import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlatformStorage } from '@/hooks/usePlatformStorage';
import { useTasks } from '@/hooks/useTasks';
import { CheckCircle2, XCircle, TrendingUp, Clock, Target } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('week');
  const isMobile = useIsMobile();
  const { getAllCompletions, isNative } = usePlatformStorage();
  const { tasks: supabaseTasks } = useTasks();
  
  // Get tasks from localStorage for local storage or from Supabase
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (storedTasks) {
      setLocalTasks(JSON.parse(storedTasks));
    }
  }, []);

  // Use Supabase tasks for web, localStorage for native
  const tasks = isNative ? localTasks : (supabaseTasks.length > 0 ? supabaseTasks : localTasks);
  const completions = getAllCompletions();

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
      
      // Check completion status from local storage (0 = not completed, 1 = completed)
      const completion = completions[task.id];
      if (completion?.completed === 1 || task.acknowledged === 'going') {
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
      value: Math.round(stats.minutes / 60 * 10) / 10,
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

  const totalTasks = Object.values(categoryStats).reduce((sum, stats) => sum + stats.total, 0);
  const totalCompleted = Object.values(categoryStats).reduce((sum, stats) => sum + stats.completed, 0);
  const totalEfficiency = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const totalHours = Object.values(categoryStats).reduce((sum, stats) => sum + stats.minutes, 0) / 60;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Analytics</h2>
            {isNative && (
              <span className="text-xs bg-accent text-muted-foreground px-2 py-1 rounded">
                Offline Data
              </span>
            )}
          </div>
          
          {/* Time Frame Selector - Tab Style for Mobile */}
          <div className="flex w-full bg-muted rounded-lg p-1">
            {['day', 'week', 'month'].map((frame) => (
              <button
                key={frame}
                onClick={() => setTimeFrame(frame as any)}
                className={cn(
                  "flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all capitalize",
                  timeFrame === frame 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {frame}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards - 2x2 Grid on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-accent rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tasks</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalTasks}</p>
          </div>
          
          <div className="bg-accent rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalTasks - totalCompleted} remaining
            </p>
          </div>
          
          <div className="bg-accent rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Efficiency</h3>
            </div>
            <p className={cn(
              "text-xl sm:text-2xl font-bold",
              totalEfficiency >= 80 ? "text-green-600" :
              totalEfficiency >= 60 ? "text-amber-600" :
              "text-red-600"
            )}>
              {totalEfficiency}%
            </p>
          </div>
          
          <div className="bg-accent rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Total Hours</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {Math.round(totalHours * 10) / 10}h
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Time Distribution Pie Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
          {pieData.length > 0 ? (
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    dataKey="value"
                    label={isMobile ? undefined : ({ name, value }) => `${name}: ${value}h`}
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
            <div className="h-56 sm:h-72 flex items-center justify-center text-muted-foreground text-sm">
              No data available for the selected time frame
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((entry) => (
              <div key={entry.category} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColorForCategory(entry.category) }}
                />
                <span className="text-xs sm:text-sm text-foreground truncate">{entry.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{entry.value}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Task Efficiency</h3>
          {efficiencyData.length > 0 ? (
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} layout={isMobile ? "vertical" : "horizontal"}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {isMobile ? (
                    <>
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        dataKey="name" 
                        type="category"
                        tick={{ fontSize: 10 }}
                        width={60}
                      />
                      <Bar 
                        dataKey="efficiency" 
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </>
                  ) : (
                    <>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis domain={[0, 100]} />
                      <Bar 
                        dataKey="efficiency" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  )}
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Efficiency']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-72 flex items-center justify-center text-muted-foreground text-sm">
              No efficiency data available
            </div>
          )}
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(categoryStats)
            .filter(([_, stats]) => stats.total > 0)
            .map(([category, stats]) => {
              const config = TASK_CATEGORIES[category as TaskCategory];
              const efficiency = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const hours = Math.round(stats.minutes / 60 * 10) / 10;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-accent rounded-lg gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div 
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColorForCategory(category as TaskCategory) }}
                    />
                    <span className="text-sm sm:text-base font-medium text-foreground truncate">{config.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
                    <span className="text-muted-foreground hidden sm:inline">{hours}h</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-muted-foreground">{stats.completed}/{stats.total}</span>
                    </div>
                    <span className={cn(
                      "font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs",
                      efficiency >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      efficiency >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {efficiency}%
                    </span>
                  </div>
                </div>
              );
            })}
          
          {Object.values(categoryStats).every(stats => stats.total === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks found for the selected time frame.
              <br />
              <span className="text-xs">Add some tasks to see your analytics.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
