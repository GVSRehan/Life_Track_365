import { useState, useEffect } from 'react';

export type ClockStyle = 'classic' | 'neumorphic';

interface TimerSettings {
  clockStyle: ClockStyle;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  workDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  clockStyle: 'classic',
  soundEnabled: true,
  vibrationEnabled: true,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const STORAGE_KEY = 'pomodoro-timer-settings';

export const useTimerSettings = () => {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load timer settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save timer settings:', e);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
