import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { YearlyEvent, EventCategory, EVENT_CATEGORIES } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventFormProps {
  event?: YearlyEvent | null;
  onSave: (event: Omit<YearlyEvent, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  day: number;
  month: number;
  category: EventCategory;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EventForm = ({ event, onSave, onCancel }: EventFormProps) => {
  const form = useForm<FormData>({
    defaultValues: {
      name: event?.name || '',
      day: event?.day || 1,
      month: event?.month || 0,
      category: event?.category || 'birthday'
    }
  });

  const selectedMonth = form.watch('month');
  
  // Calculate days in selected month
  const getDaysInMonth = (month: number) => {
    // Use a non-leap year to get standard days (February = 28)
    return new Date(2023, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth);

  const onSubmit = (data: FormData) => {
    onSave({
      name: data.name.trim(),
      day: data.day,
      month: data.month,
      category: data.category
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {event ? 'Edit Event' : 'Add Yearly Event'}
        </h3>
        
        <div className="mb-4 p-3 bg-accent/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🔄 This event will repeat every year automatically.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Event name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John's Birthday" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        onChange={(e) => {
                          const newMonth = parseInt(e.target.value);
                          field.onChange(newMonth);
                          // Reset day if it exceeds days in new month
                          const newDaysInMonth = getDaysInMonth(newMonth);
                          if (form.getValues('day') > newDaysInMonth) {
                            form.setValue('day', newDaysInMonth);
                          }
                        }}
                        value={field.value}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {months.map((month, index) => (
                          <option key={month} value={index}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(EVENT_CATEGORIES).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => field.onChange(key as EventCategory)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2",
                          config.bgColor,
                          config.color,
                          field.value === key 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span>{config.icon}</span>
                        {config.name}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {event ? 'Update Event' : 'Add Event'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EventForm;
