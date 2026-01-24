export interface YearlyEvent {
  id: string;
  name: string;
  day: number; // 1-31
  month: number; // 0-11 (JavaScript month index)
  category: EventCategory;
  createdAt: Date;
}

export type EventCategory = 'birthday' | 'anniversary' | 'festival' | 'other';

export interface EventCategoryConfig {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const EVENT_CATEGORIES: Record<EventCategory, EventCategoryConfig> = {
  birthday: {
    name: 'Birthday',
    icon: '🎂',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100'
  },
  anniversary: {
    name: 'Anniversary',
    icon: '💍',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100'
  },
  festival: {
    name: 'Festival',
    icon: '🎉',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100'
  },
  other: {
    name: 'Other',
    icon: '📅',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  }
};

// Helper to check if an event is today
export const isEventToday = (event: YearlyEvent, currentDate: Date): boolean => {
  return event.day === currentDate.getDate() && event.month === currentDate.getMonth();
};

// Helper to get days until event
export const getDaysUntilEvent = (event: YearlyEvent, currentDate: Date): number => {
  const currentYear = currentDate.getFullYear();
  let eventDate = new Date(currentYear, event.month, event.day);
  
  // If the event has already passed this year, calculate for next year
  if (eventDate < currentDate) {
    eventDate = new Date(currentYear + 1, event.month, event.day);
  }
  
  const diffTime = eventDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
