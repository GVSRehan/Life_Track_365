
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskNotificationProps {
  task: Task;
  type: 'before' | 'after';
  onAcknowledge: (taskId: string, response: 'going' | 'not-going') => void;
  onClose: () => void;
}

const TaskNotification = ({ task, type, onAcknowledge, onClose }: TaskNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const category = TASK_CATEGORIES[task.category];

  useEffect(() => {
    // Auto-close after 30 seconds if no response
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 30000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleResponse = (response: 'going' | 'not-going') => {
    onAcknowledge(task.id, response);
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-card border rounded-lg shadow-lg p-4 min-w-[300px] animate-in slide-in-from-right-2">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
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
        <h4 className="font-medium text-foreground mb-1">
          Are you going to do
        </h4>
        <p className="text-lg font-semibold text-foreground">
          {task.title}?
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {task.startTime} - {task.endTime}
        </p>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={() => handleResponse('going')}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          Going to do
        </Button>
        <Button
          onClick={() => handleResponse('not-going')}
          variant="destructive"
          className="flex-1"
        >
          Not going to do
        </Button>
      </div>
    </div>
  );
};

export default TaskNotification;
