
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskCategory } from '@/types/task';
import { useAuth } from './useAuth';

export const useTasks = (date?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tasks for a specific date or all tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', user?.id, date],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      
      if (date) {
        query = query.eq('date', date);
      }
      
      const { data, error } = await query.order('start_time');
      
      if (error) throw error;
      
      // Transform the data to match our Task interface
      return data?.map(task => ({
        id: task.id,
        title: task.title,
        startTime: task.start_time,
        endTime: task.end_time,
        date: task.date,
        category: task.category as TaskCategory,
        acknowledged: task.acknowledged ? 'going' as const : null,
        createdAt: new Date(task.created_at)
      })) || [];
    },
    enabled: !!user
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          start_time: taskData.startTime,
          end_time: taskData.endTime,
          date: taskData.date,
          category: taskData.category,
          acknowledged: taskData.acknowledged ? new Date().toISOString() : null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: Task) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          start_time: taskData.startTime,
          end_time: taskData.endTime,
          date: taskData.date,
          category: taskData.category,
          acknowledged: taskData.acknowledged ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending
  };
};
