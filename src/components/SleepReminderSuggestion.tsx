import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Moon, Bell, Clock } from 'lucide-react';

interface SleepReminderSuggestionProps {
  onAccept: (wakeUpTime: string) => void;
  onDecline: () => void;
  taskTitle: string;
  sleepEndTime: string; // When sleep task ends
}

const SleepReminderSuggestion = ({ 
  onAccept, 
  onDecline, 
  taskTitle, 
  sleepEndTime 
}: SleepReminderSuggestionProps) => {
  const [wakeUpTime, setWakeUpTime] = useState(sleepEndTime);
  const [reminderBefore, setReminderBefore] = useState(5);

  const handleAccept = () => {
    onAccept(wakeUpTime);
  };

  const calculateReminderTime = () => {
    const [h, m] = wakeUpTime.split(':').map(Number);
    const totalMins = h * 60 + m - reminderBefore;
    const adjustedMins = totalMins < 0 ? 24 * 60 + totalMins : totalMins;
    const hh = Math.floor(adjustedMins / 60) % 24;
    const mm = adjustedMins % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  const formatTime12h = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Moon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Set Wake-up Reminder?
            </h3>
            <p className="text-sm text-muted-foreground">
              Get a browser notification to wake up
            </p>
          </div>
        </div>

        {/* Task info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">For sleep task:</p>
          <p className="font-medium text-foreground">{taskTitle}</p>
        </div>

        {/* Wake up time */}
        <div className="mb-4">
          <Label htmlFor="wakeup" className="text-sm font-medium mb-2 block">
            Wake-up Time
          </Label>
          <Input
            id="wakeup"
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Suggested: End of your sleep task ({formatTime12h(sleepEndTime)})
          </p>
        </div>

        {/* Reminder offset */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Remind me before wake-up
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => setReminderBefore(mins)}
                className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  reminderBefore === mins
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Reminder preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-700">
            <Bell className="h-4 w-4" />
            <span className="font-medium text-sm">Reminder Preview</span>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            You'll receive a notification at{' '}
            <span className="font-bold">{formatTime12h(calculateReminderTime())}</span>
            {' '}({reminderBefore} min before {formatTime12h(wakeUpTime)})
          </p>
        </div>

        {/* Permission notice */}
        {'Notification' in window && Notification.permission === 'default' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
            <p>Browser will ask for notification permission when you accept.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleAccept} className="flex-1">
            <Bell className="h-4 w-4 mr-2" />
            Set Reminder
          </Button>
          <Button variant="outline" onClick={onDecline} className="flex-1">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SleepReminderSuggestion;
