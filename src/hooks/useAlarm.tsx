import { useCallback, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface UseAlarmOptions {
  onComplete?: () => void;
}

export const useAlarm = (options: UseAlarmOptions = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrationRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    // Create a soft alarm sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    // Request notification permission for web
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Request permission for Capacitor local notifications
    if (Capacitor.isNativePlatform()) {
      try {
        const { display } = await LocalNotifications.requestPermissions();
        return display === 'granted';
      } catch (e) {
        console.log('Local notifications not available');
      }
    }
    
    return true;
  }, []);

  const playAlarm = useCallback(async (title: string = 'Timer Complete', body: string = 'Time for a break!') => {
    // Play sound using Web Audio API for a gentle bell
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a gentle bell sound
      const playBell = (startTime: number, frequency: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for bell-like sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 1.5);
      };

      // Play three gentle bells
      const now = audioContext.currentTime;
      playBell(now, 523.25); // C5
      playBell(now + 0.5, 659.25); // E5
      playBell(now + 1, 783.99); // G5
      
    } catch (e) {
      console.log('Audio playback not available');
    }

    // Vibration (if supported)
    if ('vibrate' in navigator) {
      // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Show notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'default',
              actionTypeId: '',
              extra: null,
            },
          ],
        });
      } catch (e) {
        console.log('Could not schedule notification');
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }

    options.onComplete?.();
  }, [options]);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  return {
    playAlarm,
    stopAlarm,
    requestPermissions,
  };
};
