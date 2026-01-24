import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Task, TaskCategory, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';
import { Moon } from 'lucide-react';

interface TaskFormProps {
  task?: Task | null;
  date: string;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isToday?: boolean;
  /** Server-synced current time in HH:MM (only used when isToday=true) */
  currentTime?: string;
}

interface FormData {
  title: string;
  startTime: string;
  endTime: string;
  category: TaskCategory;
}

const clampTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const hh = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
  const mm = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

const addMinutesToHHMM = (time: string, minutes: number) => {
  const [h, m] = clampTime(time).split(':').map(Number);
  const base = h * 60 + m;
  const next = Math.min(23 * 60 + 59, Math.max(0, base + minutes));
  const hh = Math.floor(next / 60);
  const mm = next % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
};

// Check if end time is before start time (crosses midnight)
const isOvernightTask = (startTime: string, endTime: string): boolean => {
  return endTime < startTime;
};

// Categories that commonly span overnight
const OVERNIGHT_CATEGORIES: TaskCategory[] = ['sleep', 'journey', 'work'];

const TaskForm = ({ task, date, onSave, onCancel, isToday = false, currentTime }: TaskFormProps) => {
  // Use server-synced time for "today" validation when available
  const getCurrentTime = () => {
    if (currentTime) return clampTime(currentTime);
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Minimum allowed time (only for today): strictly in the future
  const getMinTime = () => {
    if (!isToday) return '00:00';
    return addMinutesToHHMM(getCurrentTime(), 1);
  };

  const defaultStartTime = isToday ? getMinTime() : '09:00';
  const defaultEndTime = isToday ? addMinutesToHHMM(defaultStartTime, 60) : '10:00';

  const form = useForm<FormData>({
    defaultValues: {
      title: task?.title || '',
      startTime: task?.startTime || defaultStartTime,
      endTime: task?.endTime || defaultEndTime,
      category: task?.category || 'work'
    }
  });

  const watchStartTime = form.watch('startTime');
  const watchEndTime = form.watch('endTime');
  const watchCategory = form.watch('category');
  
  // Check if this is an overnight task
  const isOvernight = isOvernightTask(watchStartTime, watchEndTime);

  const onSubmit = (data: FormData) => {
    // Validate that start time is not in the past for today
    if (isToday) {
      const currentTime = getCurrentTime();
      if (data.startTime <= currentTime) {
        form.setError('startTime', {
          type: 'manual',
          message: 'Start time must be in the future'
        });
        return;
      }
    }

    // No validation error for overnight tasks - this is now allowed!
    // End time being before start time means it ends the next day

    onSave({
      ...data,
      date,
      acknowledged: task?.acknowledged || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h3>
        
        {isToday && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary">
              Note: You can only schedule tasks for future time slots.
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                rules={{ 
                  required: 'Start time is required',
                  validate: (value) => {
                    if (isToday) {
                      const currentTime = getCurrentTime();
                      if (value <= currentTime) {
                        return 'Start time must be in the future';
                      }
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        min={isToday ? getMinTime() : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                rules={{ 
                  required: 'End time is required'
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Overnight Task Indicator */}
            {isOvernight && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  🌙 Overnight task — ends next day
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TASK_CATEGORIES).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => field.onChange(key as TaskCategory)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                          config.bgColor,
                          config.color,
                          field.value === key 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {task ? 'Update Task' : 'Add Task'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TaskForm;
