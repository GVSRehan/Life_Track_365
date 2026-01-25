import { useState } from 'react';
import { format } from 'date-fns';
import { X, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { useExpenseGroups } from '@/hooks/useExpenseGroups';
import { useAuth } from '@/hooks/useAuth';
import { CURRENCY_SYMBOLS, ExpenseCategory } from '@/types/expense';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExpenseFormProps {
  onClose: () => void;
  selectedDate: string;
  editExpense?: {
    id: string;
    amount: number;
    categoryId: string | null;
    note: string | null;
    isGroupExpense: boolean;
    groupId: string | null;
  };
}

const ExpenseForm = ({ onClose, selectedDate, editExpense }: ExpenseFormProps) => {
  const { user } = useAuth();
  const { categories, settings, createExpense, updateExpense, isCreating, isUpdating } = useExpenses();
  const { groups } = useExpenseGroups();
  
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(editExpense?.categoryId || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [note, setNote] = useState(editExpense?.note || '');
  const [isGroupExpense, setIsGroupExpense] = useState(editExpense?.isGroupExpense || false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(editExpense?.groupId || null);
  const [step, setStep] = useState<'amount' | 'category' | 'details'>('amount');
  
  const currencySymbol = settings ? CURRENCY_SYMBOLS[settings.preferredCurrency] : '₹';
  const currency = settings?.preferredCurrency || 'INR';

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const finalCategoryId = selectedSubcategory || selectedCategory;

    try {
      if (editExpense) {
        await updateExpense({
          id: editExpense.id,
          userId: user!.id,
          amount: parseFloat(amount),
          categoryId: finalCategoryId,
          currency,
          note: note || null,
          expenseDate: selectedDate,
          expenseTime: format(new Date(), 'HH:mm:ss'),
          isGroupExpense,
          groupId: isGroupExpense ? selectedGroup : null,
          createdAt: '',
          updatedAt: '',
        });
        toast.success('Expense updated!');
      } else {
        await createExpense({
          userId: user!.id,
          amount: parseFloat(amount),
          categoryId: finalCategoryId,
          currency,
          note: note || null,
          expenseDate: selectedDate,
          expenseTime: format(new Date(), 'HH:mm:ss'),
          isGroupExpense,
          groupId: isGroupExpense ? selectedGroup : null,
        });
        toast.success('Expense added!');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save expense');
      console.error(error);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editExpense ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-6">
            {/* Amount Input */}
            <div className="text-center">
              <Label className="text-sm text-muted-foreground">Amount</Label>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-4xl font-bold text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-4xl font-bold text-center border-0 border-b-2 rounded-none w-40 focus-visible:ring-0"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(qa.toString())}
                  className={cn(
                    amount === qa.toString() && "border-primary bg-primary/10"
                  )}
                >
                  {currencySymbol}{qa}
                </Button>
              ))}
            </div>

            <Button 
              className="w-full" 
              onClick={() => setStep('category')}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'category' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('amount')}>
                ← Back
              </Button>
              <span className="text-lg font-semibold">{currencySymbol}{amount}</span>
            </div>

            <Label>Select Category</Label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1",
                    selectedCategory === category.id && "border-primary bg-primary/10"
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubcategory(null);
                  }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs">{category.name}</span>
                </Button>
              ))}
            </div>

            {/* Subcategories */}
            {selectedCategoryData?.subcategories && selectedCategoryData.subcategories.length > 0 && (
              <div className="space-y-2">
                <Label>Subcategory (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryData.subcategories.map((sub) => (
                    <Button
                      key={sub.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        selectedSubcategory === sub.id && "border-primary bg-primary/10"
                      )}
                      onClick={() => setSelectedSubcategory(
                        selectedSubcategory === sub.id ? null : sub.id
                      )}
                    >
                      {sub.icon} {sub.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={() => setStep('details')}
              disabled={!selectedCategory}
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('category')}>
                ← Back
              </Button>
              <div className="text-right">
                <span className="text-lg font-semibold">{currencySymbol}{amount}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedCategoryData?.icon} {selectedCategoryData?.name}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was this expense for?"
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Group Toggle */}
            {groups.length > 0 && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label htmlFor="group-toggle" className="cursor-pointer">
                    Group/Shared Expense
                  </Label>
                  <Switch
                    id="group-toggle"
                    checked={isGroupExpense}
                    onCheckedChange={setIsGroupExpense}
                  />
                </div>

                {isGroupExpense && (
                  <Select value={selectedGroup || ''} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              <Check className="h-4 w-4 mr-2" />
              {editExpense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
