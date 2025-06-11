
import { useState } from 'react';
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

interface TaskFormProps {
  task?: Task | null;
  date: string;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isToday?: boolean;
}

interface FormData {
  title: string;
  startTime: string;
  endTime: string;
  category: TaskCategory;
}

const TaskForm = ({ task, date, onSave, onCancel, isToday = false }: TaskFormProps) => {
  // Get current time for validation on today's date
  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Get minimum time allowed (current time if today, otherwise 00:00)
  const getMinTime = () => {
    if (isToday) {
      const now = new Date();
      const nextHour = now.getHours() + 1; // Allow from next hour onwards
      return `${nextHour.toString().padStart(2, '0')}:00`;
    }
    return '00:00';
  };

  const defaultStartTime = isToday ? getMinTime() : '09:00';
  const defaultEndTime = isToday ? 
    `${(parseInt(getMinTime().split(':')[0]) + 1).toString().padStart(2, '0')}:00` : 
    '10:00';

  const form = useForm<FormData>({
    defaultValues: {
      title: task?.title || '',
      startTime: task?.startTime || defaultStartTime,
      endTime: task?.endTime || defaultEndTime,
      category: task?.category || 'work'
    }
  });

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

    // Validate that end time is after start time
    if (data.endTime <= data.startTime) {
      form.setError('endTime', {
        type: 'manual',
        message: 'End time must be after start time'
      });
      return;
    }

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
                  required: 'End time is required',
                  validate: (value) => {
                    const startTime = form.getValues('startTime');
                    if (value <= startTime) {
                      return 'End time must be after start time';
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
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
            </div>

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
