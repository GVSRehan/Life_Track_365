import { useState, useEffect } from 'react';
import { Calendar, Clock, BarChart3, Menu, LogOut, User, Download, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CalendarView from '@/components/CalendarView';
import DayScheduler from '@/components/DayScheduler';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import InstallPrompt from '@/components/InstallPrompt';
import OngoingTaskBanner from '@/components/OngoingTaskBanner';
import EventsTicker from '@/components/EventsTicker';
import PlatformDownloadDialog from '@/components/PlatformDownloadDialog';
import { ExpenseDashboard } from '@/components/expenses';
import { useAuth } from '@/hooks/useAuth';
import { PomodoroProvider } from '@/hooks/usePomodoroSession';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type ViewType = 'calendar' | 'scheduler' | 'analytics' | 'expenses';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showGestureHint, setShowGestureHint] = useState(false);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Show gesture hint for first-time mobile users
  useEffect(() => {
    if (isMobile) {
      const hasSeenHint = localStorage.getItem('lifetrack-gesture-hint-seen');
      if (!hasSeenHint) {
        setShowGestureHint(true);
        setTimeout(() => {
          setShowGestureHint(false);
          localStorage.setItem('lifetrack-gesture-hint-seen', 'true');
        }, 4000);
      }
    }
  }, [isMobile]);

  // Handle date selection - automatically navigate to scheduler on mobile
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (isMobile) {
      setActiveView('scheduler');
    }
  };

  // Navigation order for swipe
  const viewOrder: ViewType[] = ['calendar', 'scheduler', 'analytics', 'expenses'];
  
  const navigateView = (direction: 'left' | 'right') => {
    const currentIndex = viewOrder.indexOf(activeView);
    if (direction === 'left' && currentIndex < viewOrder.length - 1) {
      setActiveView(viewOrder[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveView(viewOrder[currentIndex - 1]);
    }
  };

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => navigateView('left'),
    onSwipeRight: () => navigateView('right'),
    onSwipeUp: () => {
      if (activeView !== 'analytics') {
        setActiveView('analytics');
      }
    },
    threshold: 50
  });

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return (
          <div className="space-y-4">
            <CalendarView 
              selectedDate={selectedDate} 
              onDateSelect={handleDateSelect}
              onNavigateToSchedule={(date) => {
                setSelectedDate(date);
                setActiveView('scheduler');
              }}
              onNavigateToExpenses={() => setActiveView('expenses')}
            />
            <EventsTicker />
          </div>
        );
      case 'scheduler':
        return <DayScheduler selectedDate={selectedDate} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'expenses':
        return <ExpenseDashboard />;
      default:
        return (
          <CalendarView 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect}
            onNavigateToSchedule={(date) => {
              setSelectedDate(date);
              setActiveView('scheduler');
            }}
            onNavigateToExpenses={() => setActiveView('expenses')}
          />
        );
    }
  };

  const navigationItems = [
    { key: 'calendar' as ViewType, label: 'Calendar', icon: Calendar },
    { key: 'scheduler' as ViewType, label: 'Schedule', icon: Clock },
    { key: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
    { key: 'expenses' as ViewType, label: 'Expenses', icon: Wallet },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDownloadClick = () => {
    setShowDownloadDialog(true);
  };

  return (
    <PomodoroProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">LifeTrack 365</h1>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.key}
                    variant={activeView === item.key ? 'default' : 'ghost'}
                    onClick={() => setActiveView(item.key)}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                ))}
                
                {/* Download Button - Desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handleDownloadClick}
                >
                  <Download className="h-4 w-4" />
                  <span>Get App</span>
                </Button>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border shadow-lg z-50">
                    <DropdownMenuItem disabled>
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden flex items-center gap-2">
                {/* Download Button - Mobile */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-primary/50 text-primary"
                  onClick={handleDownloadClick}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border shadow-lg z-50">
                    {navigationItems.map((item) => (
                      <DropdownMenuItem
                        key={item.key}
                        onClick={() => setActiveView(item.key)}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile View Indicator & Navigation */}
        {isMobile && (
          <div className="sticky top-[73px] z-30 bg-card/95 backdrop-blur-sm border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateView('right')}
                disabled={activeView === 'calendar'}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                {viewOrder.map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      activeView === view 
                        ? "bg-primary w-6" 
                        : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateView('left')}
                disabled={activeView === 'analytics'}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Current view label */}
            <div className="text-center mt-1">
              <span className="text-xs font-medium text-muted-foreground">
                {navigationItems.find(item => item.key === activeView)?.label}
              </span>
            </div>
          </div>
        )}

        {/* Gesture Hint Overlay */}
        {showGestureHint && isMobile && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8">
            <div className="bg-card rounded-2xl p-6 max-w-xs text-center animate-in fade-in zoom-in duration-300">
              <div className="text-4xl mb-4">👆</div>
              <h3 className="text-lg font-semibold mb-2">Swipe to Navigate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Swipe left/right to switch between Calendar, Schedule, and Analytics.
              </p>
              <p className="text-xs text-muted-foreground">
                Tap any date to see its schedule
              </p>
            </div>
          </div>
        )}

        {/* Main Content with swipe support on mobile */}
        <main 
          className="container mx-auto px-4 py-6"
          {...(isMobile ? swipeHandlers : {})}
        >
          {renderActiveView()}
        </main>

        {/* Install Prompt */}
        <InstallPrompt />
        
        {/* Ongoing Task Banner - Shows when Pomodoro is minimized */}
        <OngoingTaskBanner />

        {/* Platform Download Dialog */}
        {showDownloadDialog && (
          <PlatformDownloadDialog onClose={() => setShowDownloadDialog(false)} />
        )}
      </div>
    </PomodoroProvider>
  );
};

export default Index;
