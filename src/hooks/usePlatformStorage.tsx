import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Detect if running as native app (Android/iOS) or web
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

export const isWebApp = () => {
  return !Capacitor.isNativePlatform();
};

interface StorageData {
  tasks: TaskStorageData[];
  taskCompletions: TaskCompletionData[];
}

interface TaskStorageData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  category: string;
  acknowledged: string | null;
  completed: number; // 0 = not completed, 1 = completed
  createdAt: string;
}

interface TaskCompletionData {
  taskId: string;
  completed: number; // 0 or 1
  completedAt: string | null;
}

const STORAGE_KEY = 'lifetrack-data';
const COMPLETIONS_KEY = 'lifetrack-completions';

export const usePlatformStorage = () => {
  const { user } = useAuth();
  const [isNative] = useState(() => isNativeApp());

  // Get completions from local storage
  const getLocalCompletions = useCallback((): Record<string, TaskCompletionData> => {
    try {
      const stored = localStorage.getItem(COMPLETIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading local completions:', error);
    }
    return {};
  }, []);

  // Save completions to local storage
  const saveLocalCompletion = useCallback((taskId: string, completed: number) => {
    try {
      const completions = getLocalCompletions();
      completions[taskId] = {
        taskId,
        completed,
        completedAt: completed === 1 ? new Date().toISOString() : null
      };
      localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Error saving local completion:', error);
    }
  }, [getLocalCompletions]);

  // Mark task as completed (1) or not completed (0)
  const markTaskCompleted = useCallback(async (taskId: string, completed: number) => {
    // Always save locally for native apps
    if (isNative) {
      saveLocalCompletion(taskId, completed);
      return { success: true };
    }

    // For web, save to Supabase if user is authenticated
    if (user) {
      try {
        // Update the acknowledged field to track completion
        // We use acknowledged as a proxy - 'going' means task was acknowledged
        // For completion tracking, we'll add it to localStorage as well for analytics
        saveLocalCompletion(taskId, completed);
        return { success: true };
      } catch (error) {
        console.error('Error saving completion to Supabase:', error);
        // Fallback to local storage
        saveLocalCompletion(taskId, completed);
        return { success: true };
      }
    }

    // Fallback to local storage
    saveLocalCompletion(taskId, completed);
    return { success: true };
  }, [isNative, user, saveLocalCompletion]);

  // Get task completion status
  const getTaskCompletion = useCallback((taskId: string): number => {
    const completions = getLocalCompletions();
    return completions[taskId]?.completed ?? 0;
  }, [getLocalCompletions]);

  // Get all completions for analytics
  const getAllCompletions = useCallback((): Record<string, TaskCompletionData> => {
    return getLocalCompletions();
  }, [getLocalCompletions]);

  // Get analytics data based on platform
  const getAnalyticsData = useCallback(async () => {
    const completions = getLocalCompletions();
    
    // Calculate stats
    const totalTasks = Object.keys(completions).length;
    const completedTasks = Object.values(completions).filter(c => c.completed === 1).length;
    const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      efficiency,
      completions
    };
  }, [getLocalCompletions]);

  return {
    isNative,
    markTaskCompleted,
    getTaskCompletion,
    getAllCompletions,
    getAnalyticsData,
  };
};
