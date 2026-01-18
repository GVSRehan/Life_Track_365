import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AnalogClockProps {
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  isRunning: boolean;
  style: 'classic' | 'neumorphic';
  sessionType: 'work' | 'shortBreak' | 'longBreak';
}

const AnalogClock = ({ timeLeft, totalTime, isRunning, style, sessionType }: AnalogClockProps) => {
  const [smoothAngle, setSmoothAngle] = useState(0);
  
  // Calculate progress (0 to 1)
  const progress = (totalTime - timeLeft) / totalTime;
  
  // Calculate hand angle (starts at 12 o'clock, moves clockwise)
  const targetAngle = progress * 360;
  
  // Smooth animation for the clock hand
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setSmoothAngle(prev => {
          const diff = targetAngle - prev;
          return prev + diff * 0.1;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setSmoothAngle(targetAngle);
    }
  }, [targetAngle, isRunning]);

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const isQuarter = i % 3 === 0;
      return { angle, isQuarter, index: i };
    });
  }, []);

  // Generate minute markers
  const minuteMarkers = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      if (i % 5 === 0) return null; // Skip hour positions
      const angle = (i * 6 - 90) * (Math.PI / 180);
      return { angle, index: i };
    }).filter(Boolean);
  }, []);

  const getSessionColor = () => {
    if (sessionType === 'work') return 'hsl(var(--primary))';
    return 'hsl(142, 76%, 36%)'; // Green for breaks
  };

  if (style === 'neumorphic') {
    return (
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto">
        {/* Outer neumorphic container */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted to-background shadow-[inset_8px_8px_16px_rgba(0,0,0,0.1),inset_-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[inset_8px_8px_16px_rgba(0,0,0,0.3),inset_-8px_-8px_16px_rgba(255,255,255,0.05)]" />
        
        {/* Inner clock face */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-background to-muted shadow-[8px_8px_20px_rgba(0,0,0,0.15),-8px_-8px_20px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.4),-8px_-8px_20px_rgba(255,255,255,0.05)]">
          {/* Progress arc */}
          <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={getSessionColor()}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
              className="transition-all duration-500"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>

          {/* Hour markers */}
          {hourMarkers.map(({ angle, isQuarter, index }) => {
            const innerRadius = isQuarter ? 32 : 35;
            const outerRadius = 40;
            const x1 = 50 + innerRadius * Math.cos(angle);
            const y1 = 50 + innerRadius * Math.sin(angle);
            const x2 = 50 + outerRadius * Math.cos(angle);
            const y2 = 50 + outerRadius * Math.sin(angle);
            return (
              <svg key={index} className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--foreground))"
                  strokeWidth={isQuarter ? 2.5 : 1.5}
                  strokeLinecap="round"
                  opacity={isQuarter ? 0.8 : 0.4}
                />
              </svg>
            );
          })}

          {/* Clock hand */}
          <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100">
            <defs>
              <filter id="handShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
              </filter>
            </defs>
            <line
              x1="50"
              y1="50"
              x2={50 + 32 * Math.sin(smoothAngle * Math.PI / 180)}
              y2={50 - 32 * Math.cos(smoothAngle * Math.PI / 180)}
              stroke={getSessionColor()}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#handShadow)"
              className="transition-all duration-75"
            />
            {/* Center dot */}
            <circle cx="50" cy="50" r="5" fill={getSessionColor()} filter="url(#handShadow)" />
            <circle cx="50" cy="50" r="3" fill="hsl(var(--background))" />
          </svg>
        </div>

        {/* Pulsing indicator when running */}
        {isRunning && (
          <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-gradient-to-br from-primary to-transparent" />
        )}
      </div>
    );
  }

  // Classic style
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-muted bg-card shadow-lg" />
      
      {/* Inner clock face */}
      <div className="absolute inset-3 rounded-full bg-background border border-border">
        {/* Progress arc */}
        <svg className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={getSessionColor()}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            className="transition-all duration-500"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>

        {/* Hour markers */}
        {hourMarkers.map(({ angle, isQuarter, index }) => {
          const innerRadius = isQuarter ? 34 : 38;
          const outerRadius = 43;
          const x1 = 50 + innerRadius * Math.cos(angle);
          const y1 = 50 + innerRadius * Math.sin(angle);
          const x2 = 50 + outerRadius * Math.cos(angle);
          const y2 = 50 + outerRadius * Math.sin(angle);
          return (
            <svg key={index} className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" viewBox="0 0 100 100">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--foreground))"
                strokeWidth={isQuarter ? 2 : 1}
                strokeLinecap="round"
                opacity={isQuarter ? 0.9 : 0.4}
              />
            </svg>
          );
        })}

        {/* Minute markers */}
        {minuteMarkers.map((marker) => {
          if (!marker) return null;
          const { angle, index } = marker;
          const innerRadius = 40;
          const outerRadius = 43;
          const x1 = 50 + innerRadius * Math.cos(angle);
          const y1 = 50 + innerRadius * Math.sin(angle);
          const x2 = 50 + outerRadius * Math.cos(angle);
          const y2 = 50 + outerRadius * Math.sin(angle);
          return (
            <svg key={index} className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" viewBox="0 0 100 100">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>
          );
        })}

        {/* Clock hand */}
        <svg className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" viewBox="0 0 100 100">
          <defs>
            <filter id="classicHandShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 35 * Math.sin(smoothAngle * Math.PI / 180)}
            y2={50 - 35 * Math.cos(smoothAngle * Math.PI / 180)}
            stroke={getSessionColor()}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#classicHandShadow)"
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="4" fill={getSessionColor()} />
          <circle cx="50" cy="50" r="2" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* Subtle glow when running */}
      {isRunning && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full opacity-10 animate-pulse",
            sessionType === 'work' ? "bg-primary" : "bg-green-500"
          )} 
        />
      )}
    </div>
  );
};

export default AnalogClock;
