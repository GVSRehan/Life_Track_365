import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';
import { usePlatformStorage } from '@/hooks/usePlatformStorage';

interface TaskNotificationProps {
  task: Task;
  type: 'before' | 'after';
  onAcknowledge: (taskId: string, response: 'going' | 'not-going') => void;
  onClose: () => void;
}

const TaskNotification = ({ task, type, onAcknowledge, onClose }: TaskNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const category = TASK_CATEGORIES[task.category];
  const { markTaskCompleted } = usePlatformStorage();

  useEffect(() => {
    // Auto-close after 30 seconds if no response
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 30000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleResponse = async (response: 'going' | 'not-going') => {
    // Mark task completion status (1 for going/completed, 0 for not going)
    await markTaskCompleted(task.id, response === 'going' ? 1 : 0);
    onAcknowledge(task.id, response);
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-card border rounded-lg shadow-lg p-4 sm:min-w-[300px] sm:max-w-[350px] animate-in slide-in-from-top-2 sm:slide-in-from-right-2">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", category.bgColor)} />
          <span className="font-medium text-sm">{category.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">
          {type === 'before' ? 'Are you going to do' : 'Did you complete'}
        </h4>
        <p className="text-base sm:text-lg font-semibold text-foreground">
          {task.title}?
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {task.startTime} - {task.endTime}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleResponse('going')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
          size="sm"
        >
          {type === 'before' ? 'Yes, doing it' : 'Completed ✓'}
        </Button>
        <Button
          onClick={() => handleResponse('not-going')}
          variant="outline"
          className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm"
          size="sm"
        >
          {type === 'before' ? 'Not now' : 'Incomplete'}
        </Button>
      </div>
    </div>
  );
};

export default TaskNotification;
