
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task, TASK_CATEGORIES, TaskCategory } from '@/types/task';
import TaskForm from '@/components/TaskForm';
import TaskBlock from '@/components/TaskBlock';
import TaskNotification from '@/components/TaskNotification';

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

  const dateString = selectedDate.toISOString().split('T')[0];

  // Load tasks for the selected date
  useEffect(() => {
    const storedTasks = localStorage.getItem('lifetrack-tasks');
    if (storedTasks) {
      const allTasks: Task[] = JSON.parse(storedTasks);
      const dayTasks = allTasks.filter(task => task.date === dateString);
      setTasks(dayTasks);
    }
  }, [dateString]);

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
              {formatDate(selectedDate)}
            </p>
          </div>
          <Button 
            onClick={() => setShowTaskForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="p-6">
        <div className="space-y-1">
          {hours.map(hour => (
            <div key={hour} className="flex">
              {/* Time Label */}
              <div className="w-20 flex-shrink-0 text-sm text-muted-foreground py-4 font-medium">
                {hour.toString().padStart(2, '0')}:00
              </div>
              
              {/* Task Area */}
              <div className="flex-1 min-h-[60px] border-l border-border pl-6 relative">
                {tasks
                  .filter(task => {
                    const startHour = parseInt(task.startTime.split(':')[0]);
                    return startHour === hour;
                  })
                  .map(task => (
                    <TaskBlock
                      key={task.id}
                      task={task}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))
                }
                
                {/* Hour line */}
                <div className="absolute left-0 top-0 w-full h-px bg-border opacity-30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskForm
          task={editingTask}
          date={dateString}
          onSave={editingTask ? updateTask : addTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
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
