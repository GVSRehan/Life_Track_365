
import { useState } from 'react';
import { Calendar, Clock, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarView from '@/components/CalendarView';
import DayScheduler from '@/components/DayScheduler';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

const Index = () => {
  const [activeView, setActiveView] = useState<'calendar' | 'scheduler' | 'analytics'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />;
      case 'scheduler':
        return <DayScheduler selectedDate={selectedDate} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">LifeTrack 365</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={activeView === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setActiveView('calendar')}
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </Button>
              <Button
                variant={activeView === 'scheduler' ? 'default' : 'ghost'}
                onClick={() => setActiveView('scheduler')}
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Daily Schedule</span>
              </Button>
              <Button
                variant={activeView === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveView('analytics')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default Index;
