
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Expense, Member } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { formatCurrency, formatDate, getInitials, getCurrencySymbol } from "@/lib/utils";
import { PlusCircle, Receipt, MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";

import FilterSort from "@/components/FilterSort";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
  currency: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  members, 
  onAddExpense,
  currency
}) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filters, setFilters] = useState({
    sort: "date-desc",
    category: "all",
    dateRange: { from: undefined, to: undefined },
    amountRange: { min: undefined, max: undefined },
  });
  const removeExpense = useAppStore((state) => state.removeExpense);
  const categories = useAppStore((state) => state.categories);
  
  const filteredAndSortedExpenses = expenses
    .filter((expense) => {
      const { category, dateRange, amountRange } = filters;
      if (category !== "all" && expense.categoryId !== category) return false;
      if (dateRange.from && new Date(expense.date) < dateRange.from) return false;
      if (dateRange.to && new Date(expense.date) > dateRange.to) return false;
      if (amountRange.min && expense.amount < amountRange.min) return false;
      if (amountRange.max && expense.amount > amountRange.max) return false;
      return true;
    })
    .sort((a, b) => {
      const { sort } = filters;
      switch (sort) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "date-desc":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Group expenses by date
  const groupedExpenses: Record<string, Expense[]> = {};
  
  filteredAndSortedExpenses.forEach((expense) => {
    const date = formatDate(expense.date);
    if (!groupedExpenses[date]) {
      groupedExpenses[date] = [];
    }
    groupedExpenses[date].push(expense);
  });
  
  // Get member by ID
  const getMember = (id: string): Member | undefined => {
    return members.find((member) => member.id === id);
  };
  
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditDialog(true);
  };
  
  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await removeExpense(expenseToDelete.id);
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setExpenseToDelete(null);
    }
  };
  
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 p-4 rounded-full bg-muted text-muted-foreground">
          <Receipt className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-medium mb-2">No expenses yet</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-xs">
          Start tracking expenses by adding your first expense
        </p>
        <Button onClick={onAddExpense} className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add an Expense
        </Button>
      </div>
    );
  }
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };
  
  return (
    <div>
      <FilterSort filters={filters} setFilters={setFilters} />
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {Object.entries(groupedExpenses).map(([date, dateExpenses], index) => (
          <div key={`${date}-${index}`}>
            <div className="sticky top-16 z-10 flex items-center py-2 bg-background/80 backdrop-blur-sm">
              <h3 className="text-sm font-medium">{date}</h3>
              <div className="ml-4 h-px flex-1 bg-border"></div>
            </div>
            
            <div className="space-y-3 mt-2">
              {dateExpenses.map((expense, index) => {
                const paidBy = getMember(expense.paidBy);
                const category = categories.find(c => c.id === expense.categoryId);
                // Create a unique key that combines the expense ID with the index to prevent duplicates
                const uniqueKey = `${expense.id}-${index}`;
                return (
                  <motion.div
                    key={uniqueKey}
                    variants={item}
                    whileHover={{ y: -2 }}
                    className="glass-panel rounded-lg overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{category?.icon}</span>
                          <h4 className="font-medium">{expense.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            <span>{getCurrencySymbol(currency)}</span>
                            {formatCurrency(expense.amount, currency)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteExpense(expense)} className="text-red-500">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <span className="mr-1">Paid by</span>
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: paidBy?.avatarColor }}
                          >
                            {paidBy ? getInitials(paidBy.name) : '?'}
                          </div>
                          <span className="ml-1">{paidBy?.name || 'Unknown'}</span>
                        </span>
                        
                        <span className="mx-2">•</span>
                        
                        <span>
                          Split {expense.split === 'equal' ? 'equally' : 'custom'}
                        </span>
                      </div>
                      
                      {expense.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>
      
      <EditExpenseDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        members={members}
        expense={editingExpense}
        onComplete={() => {
          setShowEditDialog(false);
          setEditingExpense(null);
        }}
      />

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Expense
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the expense "{expenseToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDeleteExpense}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default ExpenseList;