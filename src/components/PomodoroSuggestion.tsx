import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Clock, Zap } from 'lucide-react';

interface PomodoroSuggestionProps {
  onAccept: (totalMinutes: number) => void;
  onDecline: () => void;
  taskTitle: string;
}

const QUICK_OPTIONS = [
  { label: '30 min', value: 30, sessions: 1 },
  { label: '1 hour', value: 60, sessions: 2 },
  { label: '2 hours', value: 120, sessions: 4 },
  { label: '3 hours', value: 180, sessions: 6 },
];

const PomodoroSuggestion = ({ onAccept, onDecline, taskTitle }: PomodoroSuggestionProps) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleAccept = () => {
    const minutes = selectedOption !== null ? selectedOption : (parseInt(customMinutes) || 30);
    onAccept(minutes);
  };

  const getSessions = (minutes: number) => Math.ceil(minutes / 25);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <BookOpen className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Use Pomodoro Technique?
            </h3>
            <p className="text-sm text-muted-foreground">
              Study efficiently with timed focus sessions
            </p>
          </div>
        </div>

        {/* Task info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">For task:</p>
          <p className="font-medium text-foreground">{taskTitle}</p>
        </div>

        {/* Pomodoro info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">How it works:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• 25 min focus → 5 min break</li>
                <li>• After 4 sessions → 15 min long break</li>
                <li>• Real-time countdown with notifications</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick options */}
        <Label className="text-sm font-medium mb-2 block">
          How long do you want to study?
        </Label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSelectedOption(opt.value);
                setCustomMinutes('');
              }}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                selectedOption === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                {opt.label}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {opt.sessions} session{opt.sessions > 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="mb-6">
          <Label htmlFor="custom" className="text-sm text-muted-foreground">
            Or enter custom minutes:
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="custom"
              type="number"
              min="15"
              max="480"
              placeholder="e.g., 90"
              value={customMinutes}
              onChange={(e) => {
                setCustomMinutes(e.target.value);
                setSelectedOption(null);
              }}
              className="flex-1"
            />
            <span className="flex items-center text-sm text-muted-foreground">
              min = {getSessions(parseInt(customMinutes) || 0)} sessions
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleAccept} className="flex-1">
            Start Pomodoro
          </Button>
          <Button variant="outline" onClick={onDecline} className="flex-1">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroSuggestion;
