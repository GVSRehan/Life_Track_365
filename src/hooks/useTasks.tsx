
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        startTime: task.start_time,
        endTime: task.end_time,
        category: task.category as Task['category'],
        date: task.date,
        acknowledged: task.acknowledged ? 'going' : null,
        createdAt: new Date(task.created_at)
      }));

      setTasks(formattedTasks);
    } catch (error: any) {
      toast({
        title: 'Error fetching tasks',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          start_time: taskData.startTime,
          end_time: taskData.endTime,
          category: taskData.category,
          date: taskData.date,
          acknowledged: taskData.acknowledged ? new Date() : null
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        startTime: data.start_time,
        endTime: data.end_time,
        category: data.category,
        date: data.date,
        acknowledged: data.acknowledged ? 'going' : null,
        createdAt: new Date(data.created_at)
      };

      setTasks(prev => [...prev, newTask]);
      
      toast({
        title: 'Success',
        description: 'Task created successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateTask = async (taskId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          start_time: taskData.startTime,
          end_time: taskData.endTime,
          category: taskData.category,
          date: taskData.date,
          acknowledged: taskData.acknowledged ? new Date() : null
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        startTime: data.start_time,
        endTime: data.end_time,
        category: data.category,
        date: data.date,
        acknowledged: data.acknowledged ? 'going' : null,
        createdAt: new Date(data.created_at)
      };

      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      
      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};
