import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ServerTime {
  timestamp: string;
  date: string;
  time: string;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}

interface CurrentDateTime {
  date: Date;
  dateString: string;
  time: {
    hour: number;
    minute: number;
    hour12: number;
    ampm: 'AM' | 'PM';
  };
}

export const useServerTime = () => {
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<CurrentDateTime>(() => {
    const now = new Date();
    return {
      date: now,
      dateString: now.toISOString().split('T')[0],
      time: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        hour12: now.getHours() > 12 ? now.getHours() - 12 : now.getHours() === 0 ? 12 : now.getHours(),
        ampm: now.getHours() >= 12 ? 'PM' : 'AM'
      }
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerTime = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_server_time');
      
      if (error) {
        console.error('Failed to fetch server time:', error);
        setError(error.message);
        // Fall back to local time
        return;
      }
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const serverData = data as unknown as ServerTime;
        setServerTime(serverData);
        
        // Convert to CurrentDateTime format
        const serverDate = new Date(serverData.timestamp);
        const hour = Number(serverData.hour);
        
        setCurrentDateTime({
          date: serverDate,
          dateString: serverData.date,
          time: {
            hour: hour,
            minute: Number(serverData.minute),
            hour12: hour > 12 ? hour - 12 : hour === 0 ? 12 : hour,
            ampm: hour >= 12 ? 'PM' : 'AM'
          }
        });
      }
    } catch (err) {
      console.error('Error fetching server time:', err);
      setError('Failed to sync with server time');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch server time initially
    fetchServerTime();
    
    // Refresh server time every minute to stay accurate
    const interval = setInterval(fetchServerTime, 60000);
    
    return () => clearInterval(interval);
  }, [fetchServerTime]);

  // Calculate remaining time in the day
  const getRemainingTimeInDay = useCallback(() => {
    const now = currentDateTime.date;
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const remainingMs = endOfDay.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
    
    return {
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds,
      totalSeconds: Math.floor(remainingMs / 1000),
      totalMinutes: Math.floor(remainingMs / (1000 * 60)),
      isEndOfDay: remainingHours === 0 && remainingMinutes < 30
    };
  }, [currentDateTime]);

  // Check if a specific time slot can accept new tasks
  const canAddTaskAtTime = useCallback((date: string, hour: number, minute: number = 0) => {
    const taskDateTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
    const now = currentDateTime.date;
    
    // Task must be in the future
    if (taskDateTime <= now) {
      return {
        canAdd: false,
        reason: 'Cannot add tasks in the past'
      };
    }
    
    return {
      canAdd: true,
      reason: null
    };
  }, [currentDateTime]);

  // Check if day is complete (no more time to add tasks)
  const isDayComplete = useCallback((date: string) => {
    const serverDateString = currentDateTime.dateString;
    
    // Compare dates properly (YYYY-MM-DD format)
    // If the selected date is before today's date, it's a past date
    if (date < serverDateString) {
      return {
        isComplete: true,
        reason: 'This day has already passed'
      };
    }
    
    // If it's today, check if we're at the very end of the day (less than 30 min left)
    if (date === serverDateString) {
      const remaining = getRemainingTimeInDay();
      if (remaining.isEndOfDay) {
        return {
          isComplete: true,
          reason: `Only ${remaining.minutes} minutes left today`
        };
      }
      // Today is NOT complete - user can still add tasks for future time slots
      return {
        isComplete: false,
        reason: null
      };
    }
    
    // Future date - definitely not complete
    return {
      isComplete: false,
      reason: null
    };
  }, [currentDateTime, getRemainingTimeInDay]);

  return {
    serverTime,
    currentDateTime,
    isLoading,
    error,
    refreshServerTime: fetchServerTime,
    getRemainingTimeInDay,
    canAddTaskAtTime,
    isDayComplete
  };
};
