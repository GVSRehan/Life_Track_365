
import { useState } from 'react';
import { Calendar, Clock, BarChart3, Menu, LogOut, User } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeView, setActiveView] = useState<'calendar' | 'scheduler' | 'analytics'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user, signOut } = useAuth();

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

  const navigationItems = [
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'scheduler', label: 'Daily Schedule', icon: Clock },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
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
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.key}
                  variant={activeView === item.key ? 'default' : 'ghost'}
                  onClick={() => setActiveView(item.key as any)}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {navigationItems.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => setActiveView(item.key as any)}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderActiveView()}
      </main>

      {/* Android Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default Index;
