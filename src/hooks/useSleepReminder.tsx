import { useEffect, useRef, useCallback } from 'react';

interface SleepReminder {
  taskId: string;
  taskTitle: string;
  wakeUpTime: string; // HH:MM format
  date: string; // YYYY-MM-DD format
  reminderBefore: number; // minutes before wake-up
}

export const useSleepReminder = () => {
  const remindersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const storedRemindersRef = useRef<SleepReminder[]>([]);

  // Load reminders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sleepReminders');
    if (stored) {
      try {
        storedRemindersRef.current = JSON.parse(stored);
        // Re-schedule active reminders
        storedRemindersRef.current.forEach(reminder => {
          scheduleReminder(reminder);
        });
      } catch (e) {
        console.error('Failed to parse sleep reminders:', e);
      }
    }

    return () => {
      // Clear all timeouts on unmount
      remindersRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const saveReminders = () => {
    localStorage.setItem('sleepReminders', JSON.stringify(storedRemindersRef.current));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const showNotification = (title: string, wakeUpTime: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const formatTime12h = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
      };

      new Notification('⏰ Wake Up Reminder!', {
        body: `Time to wake up for: ${title}\nWake-up time: ${formatTime12h(wakeUpTime)}`,
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: 'wake-up-reminder'
      });
    }
  };

  const scheduleReminder = useCallback((reminder: SleepReminder) => {
    // Clear existing reminder for this task
    const existingTimeout = remindersRef.current.get(reminder.taskId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Calculate time until reminder
    const [wakeH, wakeM] = reminder.wakeUpTime.split(':').map(Number);
    const reminderTime = new Date();
    const [year, month, day] = reminder.date.split('-').map(Number);
    reminderTime.setFullYear(year, month - 1, day);
    reminderTime.setHours(wakeH, wakeM - reminder.reminderBefore, 0, 0);

    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeout = setTimeout(() => {
        showNotification(reminder.taskTitle, reminder.wakeUpTime);
        // Remove from stored reminders
        storedRemindersRef.current = storedRemindersRef.current.filter(
          r => r.taskId !== reminder.taskId
        );
        saveReminders();
        remindersRef.current.delete(reminder.taskId);
      }, delay);

      remindersRef.current.set(reminder.taskId, timeout);
    }
  }, []);

  const addReminder = async (
    taskId: string,
    taskTitle: string,
    wakeUpTime: string,
    date: string,
    reminderBefore: number = 5
  ) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return false;
    }

    const reminder: SleepReminder = {
      taskId,
      taskTitle,
      wakeUpTime,
      date,
      reminderBefore
    };

    // Add to stored reminders
    storedRemindersRef.current = storedRemindersRef.current.filter(
      r => r.taskId !== taskId
    );
    storedRemindersRef.current.push(reminder);
    saveReminders();

    // Schedule the reminder
    scheduleReminder(reminder);

    return true;
  };

  const removeReminder = (taskId: string) => {
    const timeout = remindersRef.current.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      remindersRef.current.delete(taskId);
    }

    storedRemindersRef.current = storedRemindersRef.current.filter(
      r => r.taskId !== taskId
    );
    saveReminders();
  };

  return {
    addReminder,
    removeReminder
  };
};
