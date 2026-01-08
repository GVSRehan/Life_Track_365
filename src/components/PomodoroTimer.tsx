import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  totalStudyMinutes: number;
  onClose: () => void;
  taskTitle: string;
}

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;

const PomodoroTimer = ({ totalStudyMinutes, onClose, taskTitle }: PomodoroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeStudied, setTotalTimeStudied] = useState(0);

  const totalSessions = Math.ceil(totalStudyMinutes / 25);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (sessionType === 'work') {
            setTotalTimeStudied((t) => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);

    if (sessionType === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete!', {
          body: `Session ${newCompleted} done! Time for a break.`,
          icon: '/favicon.ico'
        });
      }

      // Check if all sessions complete
      if (newCompleted >= totalSessions) {
        // All done!
        return;
      }

      // Determine break type
      if (newCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setSessionType('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setSessionType('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      // Break is over, start work
      setSessionType('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [sessionType, completedSessions, totalSessions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStudiedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const toggleTimer = () => {
    // Request notification permission on first start
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(WORK_DURATION);
    setSessionType('work');
  };

  const skipToNext = () => {
    handleSessionComplete();
  };

  const progress = sessionType === 'work' 
    ? ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100
    : sessionType === 'shortBreak'
    ? ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100
    : ((LONG_BREAK - timeLeft) / LONG_BREAK) * 100;

  const allComplete = completedSessions >= totalSessions && sessionType !== 'work';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">{taskTitle}</h2>
          <p className="text-sm text-muted-foreground">
            Pomodoro Technique • {totalStudyMinutes} min study plan
          </p>
        </div>

        {/* Session indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSessions }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i < completedSessions
                  ? "bg-primary"
                  : i === completedSessions && sessionType === 'work'
                  ? "bg-primary/50 animate-pulse"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Session type badge */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2",
            sessionType === 'work' 
              ? "bg-orange-100 text-orange-700" 
              : "bg-green-100 text-green-700"
          )}>
            {sessionType === 'work' ? (
              <>
                <BookOpen className="h-4 w-4" />
                Focus Time
              </>
            ) : (
              <>
                <Coffee className="h-4 w-4" />
                {sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </>
            )}
          </div>
        </div>

        {/* Timer display */}
        <div className="relative mb-8">
          {/* Progress ring */}
          <svg className="w-48 h-48 mx-auto transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
              className={cn(
                "transition-all duration-1000",
                sessionType === 'work' ? "text-primary" : "text-green-500"
              )}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold text-foreground">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Session {Math.min(completedSessions + 1, totalSessions)} of {totalSessions}
            </span>
          </div>
        </div>

        {/* Controls */}
        {!allComplete ? (
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              onClick={toggleTimer}
              size="lg"
              className="h-14 w-14 rounded-full"
            >
              {isRunning ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={skipToNext}
              className="h-12 px-4 rounded-full"
            >
              Skip
            </Button>
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-lg font-semibold text-primary">All sessions complete!</p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{completedSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatStudiedTime(totalTimeStudied)}</p>
              <p className="text-xs text-muted-foreground">Time Studied</p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <Button variant="outline" onClick={onClose} className="w-full">
          Close Timer
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
