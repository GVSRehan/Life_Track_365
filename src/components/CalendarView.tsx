
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TASK_CATEGORIES, Task } from '@/types/task';
import { getCurrentDateTime, toYmdDateString } from '@/utils/dateUtils';

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView = ({ selectedDate, onDateSelect }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Today: {today.toLocaleDateString()} - {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-24"></div>;
            }

            const tasks = getTasksForDate(date);
            const hasActiveTasks = tasks.length > 0;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "h-24 border rounded-lg p-2 cursor-pointer transition-all hover:border-primary/50",
                  isSelected(date) && "border-primary bg-primary/5",
                  isToday(date) && "bg-accent",
                  !hasActiveTasks && "hover:bg-accent/50"
                )}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex flex-col h-full">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {/* Task indicators */}
                  <div className="flex-1 mt-1 space-y-1">
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
