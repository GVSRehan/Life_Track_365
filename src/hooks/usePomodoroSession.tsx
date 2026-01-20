import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface PomodoroSession {
  taskTitle: string;
  totalStudyMinutes: number;
  timeLeft: number;
  isRunning: boolean;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  totalSessions: number;
  totalTimeStudied: number;
  isMinimized: boolean;
}

interface PomodoroContextType {
  session: PomodoroSession | null;
  startSession: (taskTitle: string, totalStudyMinutes: number) => void;
  updateSession: (updates: Partial<PomodoroSession>) => void;
  minimizeSession: () => void;
  maximizeSession: () => void;
  endSession: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<PomodoroSession | null>(() => {
    // Restore session from localStorage on mount
    const saved = localStorage.getItem('pomodoro-session');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Set to minimized if it was running
      if (parsed.isRunning || parsed.timeLeft > 0) {
        return { ...parsed, isMinimized: true };
      }
    }
    return null;
  });

  // Persist session to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem('pomodoro-session', JSON.stringify(session));
    } else {
      localStorage.removeItem('pomodoro-session');
    }
  }, [session]);

  // Background timer
  useEffect(() => {
    if (!session || !session.isRunning || session.timeLeft <= 0) return;

    const interval = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.timeLeft <= 0) return prev;
        
        const newTimeLeft = prev.timeLeft - 1;
        const newTotalTimeStudied = prev.sessionType === 'work' 
          ? prev.totalTimeStudied + 1 
          : prev.totalTimeStudied;

        if (newTimeLeft <= 0) {
          // Session complete - pause and wait for user
          return { ...prev, timeLeft: 0, isRunning: false, totalTimeStudied: newTotalTimeStudied };
        }

        return { ...prev, timeLeft: newTimeLeft, totalTimeStudied: newTotalTimeStudied };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.isRunning, session?.timeLeft]);

  const startSession = useCallback((taskTitle: string, totalStudyMinutes: number) => {
    const workDuration = 25 * 60; // 25 minutes default
    const totalSessions = Math.ceil(totalStudyMinutes / 25);
    
    setSession({
      taskTitle,
      totalStudyMinutes,
      timeLeft: workDuration,
      isRunning: false,
      sessionType: 'work',
      completedSessions: 0,
      totalSessions,
      totalTimeStudied: 0,
      isMinimized: false
    });
  }, []);

  const updateSession = useCallback((updates: Partial<PomodoroSession>) => {
    setSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const minimizeSession = useCallback(() => {
    setSession(prev => prev ? { ...prev, isMinimized: true } : null);
  }, []);

  const maximizeSession = useCallback(() => {
    setSession(prev => prev ? { ...prev, isMinimized: false } : null);
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
  }, []);

  return (
    <PomodoroContext.Provider value={{ 
      session, 
      startSession, 
      updateSession, 
      minimizeSession, 
      maximizeSession, 
      endSession 
    }}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoroSession = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroSession must be used within a PomodoroProvider');
  }
  return context;
};
