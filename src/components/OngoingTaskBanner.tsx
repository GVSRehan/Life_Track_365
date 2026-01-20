import { Play, Pause, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePomodoroSession } from '@/hooks/usePomodoroSession';
import { cn } from '@/lib/utils';

const OngoingTaskBanner = () => {
  const { session, maximizeSession, updateSession } = usePomodoroSession();

  if (!session || !session.isMinimized) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = session.timeLeft / (session.sessionType === 'work' ? 25 * 60 : 5 * 60);

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80 cursor-pointer"
      onClick={maximizeSession}
    >
      <div className="bg-card border shadow-lg rounded-2xl p-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Mini progress circle */}
          <div className="relative h-12 w-12 flex-shrink-0">
            <svg className="h-12 w-12 -rotate-90 transform">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000",
                  session.sessionType === 'work' ? "text-primary" : "text-green-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {session.isRunning ? (
                <Clock className="h-4 w-4 text-primary" />
              ) : (
                <Play className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session.taskTitle}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                session.sessionType === 'work' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-green-500/10 text-green-600"
              )}>
                {session.sessionType === 'work' ? 'Focus' : 'Break'}
              </span>
              <span>{formatTime(session.timeLeft)}</span>
            </div>
          </div>

          {/* Quick control */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              updateSession({ isRunning: !session.isRunning });
            }}
          >
            {session.isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Tap hint */}
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Tap to expand
        </p>
      </div>
    </div>
  );
};

export default OngoingTaskBanner;
