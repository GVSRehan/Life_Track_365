
import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TASK_CATEGORIES } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskBlockProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskBlock = ({ task, onEdit, onDelete }: TaskBlockProps) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const category = TASK_CATEGORIES[task.category];
  
  const calculateDuration = () => {
    const [startHour, startMin] = task.startTime.split(':').map(Number);
    const [endHour, endMin] = task.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className={cn(
      "rounded-lg p-3 mb-2 relative group border",
      category.bgColor,
      category.color,
      task.acknowledged === 'going' && "ring-2 ring-green-500",
      task.acknowledged === 'not-going' && "ring-2 ring-red-500"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs opacity-75 mt-1">
            {task.startTime} - {task.endTime} ({calculateDuration()})
          </p>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-white/50">
              {category.name}
            </span>
            {task.acknowledged && (
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                task.acknowledged === 'going' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {task.acknowledged === 'going' ? '✅ Committed' : '❌ Skipped'}
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
          
          {showMenu && (
            <div className="absolute right-0 top-6 bg-card border rounded-lg shadow-lg z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-t-lg flex items-center space-x-2"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-b-lg flex items-center space-x-2 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBlock;
