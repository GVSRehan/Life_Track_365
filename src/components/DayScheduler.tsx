import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import TaskForm from '@/components/TaskForm';
import TaskBlock from '@/components/TaskBlock';
import TaskNotification from '@/components/TaskNotification';
import { getCurrentDateTime, isTimeSlotPast, formatDateForDisplay } from '@/utils/dateUtils';

interface DaySchedulerProps {
  selectedDate: Date;
}

const DayScheduler = ({ selectedDate }: DaySchedulerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeNotification, setActiveNotification] = useState<{
    task: Task;
    type: 'before' | 'after';
  } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());

  const dateString = selectedDate.toISOString().split('T')[0];
  const isPastDate = dateString < currentDateTime.dateString;
  const isToday = dateString === currentDateTime.dateString;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load tasks for the selected date
  useEffect(() => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (storedTasks) {
      const allTasks: Task[] = JSON.parse(storedTasks);
      const dayTasks = allTasks.filter(task => task.date === dateString);
      setTasks(dayTasks);
    }
  }, [dateString]);

  // Notification system
  useEffect(() => {
    if (isPastDate) return; // Don't set notifications for past dates

    const checkNotifications = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      tasks.forEach(task => {
        if (task.acknowledged) return; // Skip if already acknowledged

        const [startHour, startMinute] = task.startTime.split(':').map(Number);
        const [endHour, endMinute] = task.endTime.split(':').map(Number);
        
        const taskStart = new Date();
        taskStart.setHours(startHour, startMinute, 0, 0);
        
        const taskEnd = new Date();
        taskEnd.setHours(endHour, endMinute, 0, 0);

        // Calculate notification times based on category
        let beforeMinutes = 5; // default
        if (['meditate', 'yoga', 'sleep'].includes(task.category)) {
          beforeMinutes = 15;
        }

        const beforeNotificationTime = new Date(taskStart.getTime() - beforeMinutes * 60000);
        const afterNotificationTime = new Date(taskEnd.getTime() + 5 * 60000); // 5 minutes after

        // Check if we should show "before" notification
        if (now >= beforeNotificationTime && now < taskStart && !activeNotification) {
          setActiveNotification({ task, type: 'before' });
        }

        // Check if we should show "after" notification
        if (now >= afterNotificationTime && now < new Date(taskEnd.getTime() + 10 * 60000) && !activeNotification) {
          setActiveNotification({ task, type: 'after' });
        }
      });
    };

    // Check immediately and then every minute
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [tasks, isPastDate, activeNotification]);

  const saveTasks = (newTasks: Task[]) => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    const allTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
    
    // Remove existing tasks for this date
    const otherTasks = allTasks.filter(task => task.date !== dateString);
    
    // Add new tasks for this date
    const updatedTasks = [...otherTasks, ...newTasks];
    
    localStorage.setItem('lifetrack-tasks', JSON.stringify(updatedTasks));
    setTasks(newTasks);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    const updatedTasks = [...tasks, newTask].sort((a, b) => a.startTime.localeCompare(b.startTime));
    saveTasks(updatedTasks);
    setShowTaskForm(false);
  };

  const updateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;
    
    const updatedTask: Task = {
      ...taskData,
      id: editingTask.id,
      createdAt: editingTask.createdAt
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? updatedTask : task
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const handleTaskAcknowledge = (taskId: string, response: 'going' | 'not-going') => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, acknowledged: response } : task
    );
    saveTasks(updatedTasks);
    setActiveNotification(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Check if a time slot is in the past - ONLY for today's date
  const isTimeSlotPastToday = (hour: number) => {
    // Only apply past time logic if the selected date is today
    if (!isToday) return false;
    return isTimeSlotPast(hour, currentDateTime.time.hour, currentDateTime.time.minute);
  };

  // Generate 24-hour grid
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-card rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Daily Schedule
            </h2>
            <p className="text-muted-foreground mt-1">
              {formatDateForDisplay(selectedDate)}
              {isPastDate && <span className="ml-2 text-sm bg-muted px-2 py-1 rounded">Past Date</span>}
              {isToday && (
                <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                  Today - {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => setShowTaskForm(true)}
            className="flex items-center space-x-2"
            disabled={isPastDate}
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="p-6">
        {isPastDate && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-muted-foreground">This is a past date. You can view tasks but cannot add new ones.</p>
          </div>
        )}
        {isToday && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-primary text-sm">
              Current time: {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}. 
              You can only add tasks for future time slots.
            </p>
          </div>
        )}
        <div className="space-y-1">
          {hours.map(hour => {
            const isPastTimeSlot = isTimeSlotPastToday(hour);
            return (
              <div key={hour} className="flex">
                {/* Time Label */}
                <div className="w-20 flex-shrink-0 text-sm text-muted-foreground py-4 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                  <div className="text-xs opacity-60">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                </div>
                
                {/* Task Area */}
                <div className={cn(
                  "flex-1 min-h-[60px] border-l border-border pl-6 relative",
                  isPastTimeSlot && "bg-muted/30 opacity-60"
                )}>
                  {tasks
                    .filter(task => {
                      const startHour = parseInt(task.startTime.split(':')[0]);
                      return startHour === hour;
                    })
                    .map(task => (
                      <TaskBlock
                        key={task.id}
                        task={task}
                        onEdit={() => !isPastDate && !isPastTimeSlot && setEditingTask(task)}
                        onDelete={() => !isPastDate && !isPastTimeSlot && deleteTask(task.id)}
                        disabled={isPastDate || isPastTimeSlot}
                      />
                    ))
                  }
                  
                  {/* Hour line */}
                  <div className="absolute left-0 top-0 w-full h-px bg-border opacity-30" />
                  
                  {/* Past time indicator - ONLY show for today */}
                  {isPastTimeSlot && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
                        Past Time
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && !isPastDate && (
        <TaskForm
          task={editingTask}
          date={dateString}
          onSave={editingTask ? updateTask : addTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          isToday={isToday}
        />
      )}

      {/* Task Notification */}
      {activeNotification && (
        <TaskNotification
          task={activeNotification.task}
          type={activeNotification.type}
          onAcknowledge={handleTaskAcknowledge}
          onClose={() => setActiveNotification(null)}
        />
      )}
    </div>
  );
};

export default DayScheduler;
