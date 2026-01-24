import { useState, useEffect, useCallback } from 'react';
import { YearlyEvent, EventCategory, isEventToday, getDaysUntilEvent } from '@/types/event';

const EVENTS_STORAGE_KEY = 'lifetrack-events';

export const useEvents = () => {
  const [events, setEvents] = useState<YearlyEvent[]>([]);

  // Load events from localStorage
  useEffect(() => {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedEvents);
        setEvents(parsed.map((e: any) => ({
          ...e,
          createdAt: new Date(e.createdAt)
        })));
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
  }, []);

  // Save events to localStorage
  const saveEvents = useCallback((newEvents: YearlyEvent[]) => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
    setEvents(newEvents);
  }, []);

  // Add a new event
  const addEvent = useCallback((eventData: Omit<YearlyEvent, 'id' | 'createdAt'>) => {
    const newEvent: YearlyEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
    return newEvent;
  }, [events, saveEvents]);

  // Update an event
  const updateEvent = useCallback((id: string, eventData: Partial<Omit<YearlyEvent, 'id' | 'createdAt'>>) => {
    const newEvents = events.map(event => 
      event.id === id ? { ...event, ...eventData } : event
    );
    saveEvents(newEvents);
  }, [events, saveEvents]);

  // Delete an event
  const deleteEvent = useCallback((id: string) => {
    const newEvents = events.filter(event => event.id !== id);
    saveEvents(newEvents);
  }, [events, saveEvents]);

  // Get today's events
  const getTodaysEvents = useCallback((currentDate: Date): YearlyEvent[] => {
    return events.filter(event => isEventToday(event, currentDate));
  }, [events]);

  // Get upcoming events (next 30 days)
  const getUpcomingEvents = useCallback((currentDate: Date, days: number = 30): (YearlyEvent & { daysUntil: number })[] => {
    return events
      .map(event => ({
        ...event,
        daysUntil: getDaysUntilEvent(event, currentDate)
      }))
      .filter(event => event.daysUntil > 0 && event.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date): YearlyEvent[] => {
    const day = date.getDate();
    const month = date.getMonth();
    return events.filter(event => event.day === day && event.month === month);
  }, [events]);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getTodaysEvents,
    getUpcomingEvents,
    getEventsForDate
  };
};
