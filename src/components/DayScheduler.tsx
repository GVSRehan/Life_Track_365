import { useState, useEffect } from 'react';
import { Plus, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import TaskForm from '@/components/TaskForm';
import TaskBlock from '@/components/TaskBlock';
import TaskNotification from '@/components/TaskNotification';
import PomodoroSuggestion from '@/components/PomodoroSuggestion';
import AnalogPomodoroTimer from '@/components/AnalogPomodoroTimer';
import SleepReminderSuggestion from '@/components/SleepReminderSuggestion';
import { formatDateForDisplay, toYmdDateString } from '@/utils/dateUtils';
import { useServerTime } from '@/hooks/useServerTime';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useSleepReminder } from '@/hooks/useSleepReminder';
import { usePomodoroSession } from '@/hooks/usePomodoroSession';

interface DaySchedulerProps {
  selectedDate: Date;
}

const DayScheduler = ({ selectedDate }: DaySchedulerProps) => {
  const { user } = useAuth();
  const { 
    currentDateTime, 
    getRemainingTimeInDay, 
    isDayComplete,
    canAddTaskAtTime,
    isLoading: isTimeLoading 
  } = useServerTime();
  
  const dateString = toYmdDateString(selectedDate);
  const { 
    tasks, 
    isLoading: isTasksLoading, 
    createTask, 
    updateTask: updateTaskMutation, 
    deleteTask: deleteTaskMutation,
    isCreating,
    isUpdating 
  } = useTasks(dateString);
  
  const { addReminder } = useSleepReminder();
  const { session, startSession, endSession } = usePomodoroSession();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeNotification, setActiveNotification] = useState<{
    task: Task;
    type: 'before' | 'after';
  } | null>(null);
  
  // Pomodoro state
  const [pendingTask, setPendingTask] = useState<Omit<Task, 'id' | 'createdAt'> | null>(null);
  const [showPomodoroSuggestion, setShowPomodoroSuggestion] = useState(false);
  
  // Check if there's an active pomodoro session (not minimized)
  const showPomodoroTimer = session && !session.isMinimized;
  
  // Sleep reminder state
  const [showSleepSuggestion, setShowSleepSuggestion] = useState(false);
  const [pendingSleepTask, setPendingSleepTask] = useState<{ id: string; title: string; endTime: string } | null>(null);

  // Compare dates as strings (YYYY-MM-DD format ensures correct comparison)
  const isPastDate = dateString < currentDateTime.dateString;
  const isToday = dateString === currentDateTime.dateString;
  const isFutureDate = dateString > currentDateTime.dateString;
  const dayStatus = isDayComplete(dateString);
  const remainingTime = isToday ? getRemainingTimeInDay() : null;
  const serverNowHHMM = `${currentDateTime.time.hour.toString().padStart(2, '0')}:${currentDateTime.time.minute.toString().padStart(2, '0')}`;
  
  // Debug log to help troubleshoot date issues
  console.log('Date comparison:', {
    selectedDate: dateString,
    serverDate: currentDateTime.dateString,
    isPastDate,
    isToday,
    isFutureDate,
    dayStatus
  });

  // Notification system
  useEffect(() => {
    if (isPastDate) return;

    const checkNotifications = () => {
      const now = new Date();
      
      tasks.forEach(task => {
        if (task.acknowledged) return;

        const [startHour, startMinute] = task.startTime.split(':').map(Number);
        const [endHour, endMinute] = task.endTime.split(':').map(Number);
        
        const taskStart = new Date();
        taskStart.setHours(startHour, startMinute, 0, 0);
        
        const taskEnd = new Date();
        taskEnd.setHours(endHour, endMinute, 0, 0);

        let beforeMinutes = 5;
        if (['meditate', 'yoga', 'sleep'].includes(task.category)) {
          beforeMinutes = 15;
        }

        const beforeNotificationTime = new Date(taskStart.getTime() - beforeMinutes * 60000);
        const afterNotificationTime = new Date(taskEnd.getTime() + 5 * 60000);

        if (now >= beforeNotificationTime && now < taskStart && !activeNotification) {
          setActiveNotification({ task, type: 'before' });
        }

        if (now >= afterNotificationTime && now < new Date(taskEnd.getTime() + 10 * 60000) && !activeNotification) {
          setActiveNotification({ task, type: 'after' });
        }
      });
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [tasks, isPastDate, activeNotification]);

  // Handle adding a new task
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // Check if study task - suggest Pomodoro
    if (taskData.category === 'study') {
      setPendingTask(taskData);
      setShowPomodoroSuggestion(true);
      setShowTaskForm(false);
      return;
    }
    
    createTask(taskData, {
      onSuccess: (newTask) => {
        setShowTaskForm(false);
        // Check if sleep task - suggest wake-up reminder
        if (taskData.category === 'sleep' && newTask) {
          setPendingSleepTask({ 
            id: newTask.id, 
            title: taskData.title, 
            endTime: taskData.endTime 
          });
          setShowSleepSuggestion(true);
        }
      }
    });
  };
  
  // Handle Pomodoro acceptance
  const handlePomodoroAccept = (minutes: number) => {
    if (pendingTask) {
      createTask(pendingTask, {
        onSuccess: () => {
          // Start pomodoro session in context
          startSession(pendingTask.title, minutes);
        }
      });
    }
    setShowPomodoroSuggestion(false);
    setPendingTask(null);
  };
  
  const handlePomodoroDecline = () => {
    if (pendingTask) {
      createTask(pendingTask);
    }
    setShowPomodoroSuggestion(false);
    setPendingTask(null);
  };
  
  // Handle sleep reminder
  const handleSleepReminderAccept = (wakeUpTime: string) => {
    if (pendingSleepTask) {
      addReminder(pendingSleepTask.id, pendingSleepTask.title, wakeUpTime, dateString, 5);
    }
    setShowSleepSuggestion(false);
    setPendingSleepTask(null);
  };
  
  const handleSleepReminderDecline = () => {
    setShowSleepSuggestion(false);
    setPendingSleepTask(null);
  };

  // Handle updating an existing task
  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;
    
    updateTaskMutation({
      ...taskData,
      id: editingTask.id,
      createdAt: editingTask.createdAt
    }, {
      onSuccess: () => {
        setEditingTask(null);
      }
    });
  };

  // Handle deleting a task
  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation(taskId);
  };

  // Handle task acknowledgement
  const handleTaskAcknowledge = (taskId: string, response: 'going' | 'not-going') => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTaskMutation({
        ...task,
        acknowledged: response
      });
    }
    setActiveNotification(null);
  };

  // Check if a time slot is in the past - ONLY for today's date
  // Keep the current hour usable (because user can still schedule later minutes within the same hour)
  const isTimeSlotPastToday = (hour: number) => {
    if (!isToday) return false;
    return hour < currentDateTime.time.hour;
  };

  // Generate 24-hour grid
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Show loading state
  if (isTimeLoading || isTasksLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border p-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!user) {
    return (
      <div className="bg-card rounded-lg shadow-sm border p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in Required</h3>
          <p className="text-muted-foreground">Please sign in to manage your tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Daily Schedule
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm sm:text-base text-muted-foreground">
                {formatDateForDisplay(selectedDate)}
              </p>
              {isPastDate && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Past Date</span>
              )}
              {isToday && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">
                  Today - {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}
                </span>
              )}
            </div>
            {/* Remaining time display */}
            {isToday && remainingTime && (
              <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {remainingTime.hours}h {remainingTime.minutes}m remaining today
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
            disabled={isPastDate || (isToday && dayStatus.isComplete) || isCreating}
            size="default"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="p-4 sm:p-6">
        {/* Past date message - only show for dates BEFORE today */}
        {isPastDate && (
          <div className="mb-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-xs sm:text-sm font-medium">
              This day has already passed. You cannot add new tasks.
            </p>
          </div>
        )}
        
        {/* Today with end of day warning */}
        {isToday && dayStatus.isComplete && (
          <div className="mb-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-xs sm:text-sm font-medium">
              {dayStatus.reason}. You cannot add new tasks.
            </p>
          </div>
        )}
        
        {/* Today - can still add tasks for future time slots */}
        {isToday && !dayStatus.isComplete && (
          <div className="mb-4 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-primary text-xs sm:text-sm">
              Current server time: {currentDateTime.time.hour12}:{currentDateTime.time.minute.toString().padStart(2, '0')} {currentDateTime.time.ampm}. 
              You can add tasks for future time slots only.
            </p>
          </div>
        )}
        
        <div className="space-y-0.5 sm:space-y-1">
          {hours.map(hour => {
            const isPastTimeSlot = isTimeSlotPastToday(hour);
            return (
              <div key={hour} className="flex">
                {/* Time Label */}
                <div className="w-14 sm:w-20 flex-shrink-0 text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 font-medium">
                  <span className="font-semibold">{hour.toString().padStart(2, '0')}:00</span>
                  <div className="text-[10px] sm:text-xs opacity-60">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                </div>
                
                {/* Task Area */}
                <div className={cn(
                  "flex-1 min-h-[50px] sm:min-h-[60px] border-l border-border pl-3 sm:pl-6 relative",
                  isPastTimeSlot && "bg-muted/30 opacity-60"
                )}>
                  {tasks
                    .filter(task => {
                      const startHour = parseInt(task.startTime.split(':')[0]);
                      return startHour === hour;
                    })
                      .map(task => {
                        const isPastTaskTime = isToday && task.startTime <= serverNowHHMM;
                        const isLocked = isPastDate || isPastTaskTime;

                        return (
                          <TaskBlock
                            key={task.id}
                            task={task}
                            onEdit={() => setEditingTask(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            disabled={isLocked}
                            canEdit={!isPastDate && !isPastTaskTime}
                            canDelete={!isPastDate}
                          />
                        );
                      })
                  }
                  
                  {/* Hour line */}
                  <div className="absolute left-0 top-0 w-full h-px bg-border opacity-30" />
                  
                  {/* Past time indicator - ONLY show for today */}
                  {isPastTimeSlot && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs text-muted-foreground bg-background px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border">
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

      {/* Task Form Modal - allow for today (even if some hours passed) but not for past dates */}
      {(showTaskForm || editingTask) && !isPastDate && !(isToday && dayStatus.isComplete) && (
        <TaskForm
          task={editingTask}
          date={dateString}
          onSave={editingTask ? handleUpdateTask : handleAddTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          isToday={isToday}
          currentTime={serverNowHHMM}
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

      {/* Pomodoro Suggestion */}
      {showPomodoroSuggestion && pendingTask && (
        <PomodoroSuggestion
          taskTitle={pendingTask.title}
          onAccept={handlePomodoroAccept}
          onDecline={handlePomodoroDecline}
        />
      )}

      {/* Analog Pomodoro Timer - Shows when session is active and not minimized */}
      {showPomodoroTimer && (
        <AnalogPomodoroTimer
          onClose={() => endSession()}
        />
      )}

      {/* Sleep Reminder Suggestion */}
      {showSleepSuggestion && pendingSleepTask && (
        <SleepReminderSuggestion
          taskTitle={pendingSleepTask.title}
          sleepEndTime={pendingSleepTask.endTime}
          onAccept={handleSleepReminderAccept}
          onDecline={handleSleepReminderDecline}
        />
      )}
    </div>
  );
};

export default DayScheduler;
