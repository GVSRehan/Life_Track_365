import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useExpenses } from '@/hooks/useExpenses';
import { CurrencyType, CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/types/expense';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ExpenseSettings = () => {
  const { settings, updateCurrency } = useExpenses();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    settings?.preferredCurrency || 'INR'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedCurrency === settings?.preferredCurrency) {
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrency(selectedCurrency);
      toast.success('Currency preference saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const currencies: CurrencyType[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'JPY', 'CNY'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Currency Preference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select your preferred currency for personal expenses
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {currencies.map((currency) => (
              <Button
                key={currency}
                variant="outline"
                className={cn(
                  "h-auto py-3 flex flex-col items-center gap-1 relative",
                  selectedCurrency === currency && "border-primary bg-primary/10"
                )}
                onClick={() => setSelectedCurrency(currency)}
              >
                <span className="text-xl font-bold">{CURRENCY_SYMBOLS[currency]}</span>
                <span className="text-xs">{currency}</span>
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {CURRENCY_NAMES[currency]}
                </span>
                {selectedCurrency === currency && (
                  <div className="absolute top-1 right-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </Button>
            ))}
          </div>

          {selectedCurrency !== settings?.preferredCurrency && (
            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={isSaving}
            >
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data & Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium text-sm">Offline Mode</p>
              <p className="text-xs text-muted-foreground">
                Expenses are saved locally and synced when online
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium text-sm">Cloud Sync</p>
              <p className="text-xs text-muted-foreground">
                Data syncs automatically with your account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Expense Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track personal and group expenses with full offline support. 
            Your data is stored securely and syncs across all your devices.
          </p>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p>• Unlimited expenses per day</p>
            <p>• Customizable categories</p>
            <p>• Group expense sharing</p>
            <p>• Detailed analytics & insights</p>
            <p>• Works offline on mobile</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSettings;
