import { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YearlyEvent, EVENT_CATEGORIES, EventCategory } from '@/types/event';
import { useEvents } from '@/hooks/useEvents';
import { useServerTime } from '@/hooks/useServerTime';
import { cn } from '@/lib/utils';
import EventForm from './EventForm';

const EventsTicker = () => {
  const { events, getTodaysEvents, getUpcomingEvents, addEvent, deleteEvent } = useEvents();
  const { currentDateTime } = useServerTime();
  const [showEventForm, setShowEventForm] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  
  const todaysEvents = getTodaysEvents(currentDateTime.date);
  const upcomingEvents = getUpcomingEvents(currentDateTime.date, 14); // Next 14 days

  // Combine today's events and upcoming events for ticker
  type TickerItem = YearlyEvent & { isToday: boolean; daysUntil: number };
  const tickerItems: TickerItem[] = [
    ...todaysEvents.map(event => ({
      ...event,
      isToday: true,
      daysUntil: 0
    })),
    ...upcomingEvents.map(event => ({
      ...event,
      isToday: false
    }))
  ];

  const handleAddEvent = (eventData: Omit<YearlyEvent, 'id' | 'createdAt'>) => {
    addEvent(eventData);
    setShowEventForm(false);
  };

  if (tickerItems.length === 0) {
    return (
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg border border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No upcoming events. Add birthdays, anniversaries & festivals!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        </div>
        
        {showEventForm && (
          <EventForm 
            onSave={handleAddEvent}
            onCancel={() => setShowEventForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="text-lg">🎊</span>
          Events & Celebrations
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEventForm(true)}
          className="h-7 px-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Scrolling ticker for mobile */}
      <div 
        ref={tickerRef}
        className="flex overflow-x-auto gap-3 p-3 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tickerItems.map((event) => {
          const category = EVENT_CATEGORIES[event.category];
          return (
            <div 
              key={event.id}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap",
                event.isToday 
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : category.bgColor
              )}
            >
              <span>{category.icon}</span>
              <span className="font-medium">
                {event.isToday ? 'Today: ' : ''}
                {event.name}
              </span>
              {!event.isToday && (
                <span className="text-xs opacity-75">
                  in {event.daysUntil} day{event.daysUntil > 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => deleteEvent(event.id)}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {showEventForm && (
        <EventForm 
          onSave={handleAddEvent}
          onCancel={() => setShowEventForm(false)}
        />
      )}
    </div>
  );
};

export default EventsTicker;
