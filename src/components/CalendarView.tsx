import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES, Task } from '@/types/task';
import { toYmdDateString } from '@/utils/dateUtils';
import { useServerTime } from '@/hooks/useServerTime';

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView = ({ selectedDate, onDateSelect }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const { currentDateTime } = useServerTime();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (!storedTasks) return [];
    
    const allTasks: Task[] = JSON.parse(storedTasks);
    const dateString = toYmdDateString(date);
    return allTasks.filter(task => task.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const today = currentDateTime.date;
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground truncate">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
              Today: {today.toLocaleDateString('en-GB')} - {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-6">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-14 sm:h-24"></div>;
            }

            const tasks = getTasksForDate(date);
            const hasActiveTasks = tasks.length > 0;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "h-14 sm:h-24 border rounded-md sm:rounded-lg p-1.5 sm:p-2 cursor-pointer transition-all hover:border-primary/50",
                  isSelected(date) && "border-primary bg-primary/5 ring-1 ring-primary/20",
                  isToday(date) && "bg-accent",
                  !hasActiveTasks && "hover:bg-accent/50"
                )}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex flex-col h-full">
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
                    isToday(date) && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {/* Task indicators - Hidden on mobile, shown on desktop */}
                  <div className="hidden sm:flex sm:flex-1 mt-1 flex-wrap gap-0.5">
                    {tasks.slice(0, 3).map((task, taskIndex) => {
                      const category = TASK_CATEGORIES[task.category];
                      return (
                        <div
                          key={taskIndex}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            category.color === 'text-blue-700' && "bg-blue-500",
                            category.color === 'text-purple-700' && "bg-purple-500",
                            category.color === 'text-green-700' && "bg-green-500",
                            category.color === 'text-orange-700' && "bg-orange-500",
                            category.color === 'text-red-700' && "bg-red-500",
                            category.color === 'text-gray-700' && "bg-gray-500",
                            category.color === 'text-amber-700' && "bg-amber-500"
                          )}
                        />
                      );
                    })}
                    {tasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{tasks.length - 3}
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile: Simple task count indicator */}
                  {hasActiveTasks && (
                    <div className="sm:hidden mt-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
