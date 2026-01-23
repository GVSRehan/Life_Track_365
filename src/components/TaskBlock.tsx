import { Edit, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';
import { usePlatformStorage } from '@/hooks/usePlatformStorage';
import { useState, useEffect } from 'react';

interface TaskBlockProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  /** Visual state (muted/locked). Actions default to disabled when true unless overridden. */
  disabled?: boolean;
  /** Control whether the edit action is available (defaults to !disabled). */
  canEdit?: boolean;
  /** Control whether the delete action is available (defaults to !disabled). */
  canDelete?: boolean;
}

const TaskBlock = ({ task, onEdit, onDelete, disabled = false, canEdit, canDelete }: TaskBlockProps) => {
  const category = TASK_CATEGORIES[task.category];
  const allowEdit = canEdit ?? !disabled;
  const allowDelete = canDelete ?? !disabled;
  const { markTaskCompleted, getTaskCompletion } = usePlatformStorage();
  
  const [isCompleted, setIsCompleted] = useState(() => getTaskCompletion(task.id) === 1);
  
  useEffect(() => {
    setIsCompleted(getTaskCompletion(task.id) === 1);
  }, [task.id, getTaskCompletion]);
  
  const handleToggleComplete = async () => {
    const newStatus = isCompleted ? 0 : 1;
    await markTaskCompleted(task.id, newStatus);
    setIsCompleted(newStatus === 1);
  };
  
  const calculateDuration = () => {
    const [startHour, startMinute] = task.startTime.split(':').map(Number);
    const [endHour, endMinute] = task.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const duration = endMinutes - startMinutes;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getCompletionBorderColor = () => {
    if (isCompleted) return 'border-l-green-500';
    if (task.acknowledged === 'going') return 'border-l-primary';
    if (task.acknowledged === 'not-going') return 'border-l-red-500';
    return 'border-l-muted';
  };

  return (
    <div className={cn(
      "group relative bg-card border rounded-lg p-2.5 sm:p-3 mb-2 border-l-4 transition-all hover:shadow-sm",
      category.bgColor,
      getCompletionBorderColor(),
      disabled && "opacity-60",
      isCompleted && "bg-green-50/50 dark:bg-green-950/20"
    )}>
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Completion Toggle Button */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            "flex-shrink-0 mt-0.5 transition-colors",
            isCompleted ? "text-green-600" : "text-muted-foreground hover:text-primary"
          )}
          aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Circle className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", category.bgColor)} />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {category.name}
            </span>
          </div>
          <h4 className={cn(
            "text-sm sm:text-base font-medium text-foreground mb-1 truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>{task.startTime} - {task.endTime}</span>
            <span className="hidden sm:inline">({calculateDuration()})</span>
          </div>
          {(task.acknowledged || isCompleted) && (
            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
              {isCompleted && (
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Completed
                </span>
              )}
              {task.acknowledged && !isCompleted && (
                <span className={cn(
                  "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                  task.acknowledged === 'going' 
                    ? "bg-primary/10 text-primary" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {task.acknowledged === 'going' ? 'Committed' : 'Skipped'}
                </span>
              )}
            </div>
          )}
        </div>
        
        {(allowEdit || allowDelete) && (
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-0.5 sm:gap-1 flex-shrink-0">
            {allowEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {allowDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBlock;
