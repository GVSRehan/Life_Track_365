import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Expense } from '@/types/expense';
import { useExpenses } from '@/hooks/useExpenses';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ExpenseForm from './ExpenseForm';

interface ExpenseListProps {
  expenses: Expense[];
  currencySymbol: string;
  isLoading: boolean;
}

const ExpenseList = ({ expenses, currencySymbol, isLoading }: ExpenseListProps) => {
  const { deleteExpense, isDeleting } = useExpenses();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteExpense(deleteId);
      toast.success('Expense deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  // Group expenses by time
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const hour = expense.expenseTime.split(':')[0];
    const period = parseInt(hour) < 12 ? 'Morning' : parseInt(hour) < 17 ? 'Afternoon' : 'Evening';
    
    if (!acc[period]) acc[period] = [];
    acc[period].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-4xl mb-2">💸</p>
          <p className="text-muted-foreground">No expenses recorded</p>
          <p className="text-sm text-muted-foreground">Tap + to add your first expense</p>
        </CardContent>
      </Card>
    );
  }

  const totalForDay = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Daily Total */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-muted-foreground">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </span>
        <span className="font-semibold">
          Total: {currencySymbol}{totalForDay.toLocaleString()}
        </span>
      </div>

      {/* Grouped Expenses */}
      {Object.entries(groupedExpenses).map(([period, periodExpenses]) => (
        <div key={period} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-2">{period}</h3>
          
          {periodExpenses.map((expense) => (
            <Card key={expense.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {expense.category?.icon || '💰'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {expense.category?.name || 'Other'}
                      </span>
                      {expense.isGroupExpense && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                          Group
                        </span>
                      )}
                    </div>
                    {expense.note && (
                      <p className="text-sm text-muted-foreground truncate">{expense.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(`2000-01-01T${expense.expenseTime}`), 'h:mm a')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-semibold text-lg">
                      {currencySymbol}{expense.amount.toLocaleString()}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditExpense(expense)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(expense.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Form */}
      {editExpense && (
        <ExpenseForm
          onClose={() => setEditExpense(null)}
          selectedDate={editExpense.expenseDate}
          editExpense={{
            id: editExpense.id,
            amount: editExpense.amount,
            categoryId: editExpense.categoryId,
            note: editExpense.note,
            isGroupExpense: editExpense.isGroupExpense,
            groupId: editExpense.groupId,
          }}
        />
      )}
    </div>
  );
};

export default ExpenseList;
