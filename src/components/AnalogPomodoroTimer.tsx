import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee, BookOpen, X, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnalogClock from './AnalogClock';
import { useAlarm } from '@/hooks/useAlarm';
import { useTimerSettings, ClockStyle } from '@/hooks/useTimerSettings';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AnalogPomodoroTimerProps {
  totalStudyMinutes: number;
  onClose: () => void;
  taskTitle: string;
}

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const AnalogPomodoroTimer = ({ totalStudyMinutes, onClose, taskTitle }: AnalogPomodoroTimerProps) => {
  const { settings, updateSettings } = useTimerSettings();
  const { playAlarm, requestPermissions } = useAlarm();
  
  const WORK_DURATION = settings.workDuration * 60;
  const SHORT_BREAK = settings.shortBreakDuration * 60;
  const LONG_BREAK = settings.longBreakDuration * 60;
  const SESSIONS_BEFORE_LONG_BREAK = settings.sessionsBeforeLongBreak;

  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeStudied, setTotalTimeStudied] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const totalSessions = Math.ceil(totalStudyMinutes / settings.workDuration);

  const getCurrentDuration = useCallback(() => {
    switch (sessionType) {
      case 'work': return WORK_DURATION;
      case 'shortBreak': return SHORT_BREAK;
      case 'longBreak': return LONG_BREAK;
    }
  }, [sessionType, WORK_DURATION, SHORT_BREAK, LONG_BREAK]);

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
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, sessionType]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);

    // Play alarm
    if (settings.soundEnabled) {
      if (sessionType === 'work') {
        playAlarm('Focus Session Complete!', 'Great work! Time for a break.');
      } else {
        playAlarm('Break Over!', 'Ready to focus again?');
      }
    }

    if (sessionType === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Check if all sessions complete
      if (newCompleted >= totalSessions) {
        playAlarm('All Sessions Complete! 🎉', `You studied for ${totalStudyMinutes} minutes!`);
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
  }, [sessionType, completedSessions, totalSessions, settings.soundEnabled, playAlarm, WORK_DURATION, SHORT_BREAK, LONG_BREAK, SESSIONS_BEFORE_LONG_BREAK, totalStudyMinutes]);

  const toggleTimer = async () => {
    if (!isRunning) {
      await requestPermissions();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(WORK_DURATION);
    setSessionType('work');
  };

  const skipToNext = () => {
    setIsRunning(false);
    handleSessionComplete();
  };

  const allComplete = completedSessions >= totalSessions && sessionType !== 'work';

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 safe-area-inset">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <Sheet open={showSettings} onOpenChange={setShowSettings}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Timer Settings</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-6">
              {/* Clock Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Clock Style</Label>
                <div className="flex gap-3">
                  <Button
                    variant={settings.clockStyle === 'classic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ clockStyle: 'classic' })}
                    className="flex-1"
                  >
                    Classic
                  </Button>
                  <Button
                    variant={settings.clockStyle === 'neumorphic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ clockStyle: 'neumorphic' })}
                    className="flex-1"
                  >
                    Neumorphic
                  </Button>
                </div>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-sm font-medium">Sound</Label>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>

              {/* Vibration */}
              <div className="flex items-center justify-between">
                <Label htmlFor="vibration" className="text-sm font-medium">Vibration</Label>
                <Switch
                  id="vibration"
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) => updateSettings({ vibrationEnabled: checked })}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
        {/* Task title - Very subtle */}
        <p className="text-xs text-muted-foreground mb-2 text-center max-w-xs truncate">
          {taskTitle}
        </p>

        {/* Session indicator dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: Math.min(totalSessions, 8) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i < completedSessions
                  ? "bg-primary scale-100"
                  : i === completedSessions && sessionType === 'work'
                  ? "bg-primary/40 animate-pulse"
                  : "bg-muted"
              )}
            />
          ))}
          {totalSessions > 8 && (
            <span className="text-xs text-muted-foreground ml-1">+{totalSessions - 8}</span>
          )}
        </div>

        {/* Session type badge - Minimal */}
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 mb-8",
          sessionType === 'work' 
            ? "bg-primary/10 text-primary" 
            : "bg-green-500/10 text-green-600 dark:text-green-400"
        )}>
          {sessionType === 'work' ? (
            <>
              <BookOpen className="h-3 w-3" />
              Focus
            </>
          ) : (
            <>
              <Coffee className="h-3 w-3" />
              {sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </>
          )}
        </div>

        {/* Analog Clock - The main focus */}
        <AnalogClock
          timeLeft={timeLeft}
          totalTime={getCurrentDuration()}
          isRunning={isRunning}
          style={settings.clockStyle}
          sessionType={sessionType}
        />

        {/* Minimal session info */}
        <p className="text-xs text-muted-foreground mt-6">
          Session {Math.min(completedSessions + 1, totalSessions)} of {totalSessions}
        </p>
      </div>

      {/* Controls - Bottom */}
      <div className="px-4 pb-8 pt-4 safe-area-bottom">
        {!allComplete ? (
          <div className="flex justify-center items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimer}
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={toggleTimer}
              size="lg"
              className={cn(
                "h-16 w-16 rounded-full shadow-lg transition-all duration-300",
                isRunning 
                  ? "bg-muted hover:bg-muted/80" 
                  : sessionType === 'work' 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-green-500 hover:bg-green-600"
              )}
            >
              {isRunning ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-1" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipToNext}
              className="h-12 px-4 rounded-full text-xs"
            >
              Skip
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-lg font-semibold text-primary mb-4">All sessions complete!</p>
            <Button onClick={onClose} className="rounded-full px-8">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalogPomodoroTimer;
