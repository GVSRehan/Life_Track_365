
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';

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

  const getAcknowledgmentColor = () => {
    if (task.acknowledged === 'going') return 'border-l-green-500';
    if (task.acknowledged === 'not-going') return 'border-l-red-500';
    return 'border-l-gray-300';
  };

  return (
    <div className={cn(
      "group relative bg-card border rounded-lg p-3 mb-2 border-l-4 transition-all hover:shadow-sm",
      category.bgColor,
      getAcknowledgmentColor(),
      disabled && "opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full", category.bgColor)} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category.name}
            </span>
          </div>
          <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{task.startTime} - {task.endTime}</span>
            <span>({calculateDuration()})</span>
          </div>
          {task.acknowledged && (
            <div className="mt-2">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                task.acknowledged === 'going' 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              )}>
                {task.acknowledged === 'going' ? 'Committed' : 'Skipped'}
              </span>
            </div>
          )}
        </div>
        
        {(allowEdit || allowDelete) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            {allowEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {allowDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
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
