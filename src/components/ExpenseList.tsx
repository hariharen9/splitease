import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { PlusCircle, Receipt, MoreVertical, Pencil, Trash2, AlertTriangle, Calendar, Tag } from "lucide-react";
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div 
          className="mb-4 p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Receipt className="h-8 w-8" />
        </motion.div>
        <motion.h3 
          className="text-xl font-medium mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No expenses yet
        </motion.h3>
        <motion.p 
          className="text-muted-foreground mb-6 text-center max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Start tracking expenses by adding your first expense
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onAddExpense} 
            className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add an Expense
          </Button>
        </motion.div>
      </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FilterSort filters={filters} setFilters={setFilters} />
      </motion.div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {Object.entries(groupedExpenses).map(([date, dateExpenses], index) => (
          <motion.div 
            key={`${date}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="sticky top-16 z-10 flex items-center py-2 bg-background/80 backdrop-blur-sm">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{date}</h3>
              </motion.div>
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
                    whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.99 }}
                    className="glass-panel rounded-lg overflow-hidden border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <motion.div 
                          className="flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.span 
                            className="text-xl"
                            animate={{ 
                              scale: [1, 1.1, 1],
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          >
                            {category?.icon}
                          </motion.span>
                          <h4 className="font-medium">{expense.title}</h4>
                        </motion.div>
                        <div className="flex items-center gap-2">
                          <motion.span 
                            className="font-semibold"
                            whileHover={{ scale: 1.05 }}
                          >
                            <span>{getCurrencySymbol(currency)}</span>
                            {formatCurrency(expense.amount, currency)}
                          </motion.span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="backdrop-blur-lg bg-background/80 border-white/10">
                              <DropdownMenuItem 
                                onClick={() => handleEditExpense(expense)}
                                className="flex items-center gap-2"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteExpense(expense)}
                                className="flex items-center gap-2 text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <motion.div 
                        className="flex items-center justify-between text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          {paidBy && (
                            <div className="flex items-center gap-1">
                              {paidBy.avatarUrl ? (
                                <img 
                                  src={`${paidBy.avatarUrl}?${paidBy.id}`} 
                                  alt={paidBy.name} 
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                  style={{ backgroundColor: paidBy.avatarColor }}
                                >
                                  {getInitials(paidBy.name)}
                                </div>
                              )}
                              <span>{paidBy.name}</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>{expense.participants.length} participants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{category?.name || "Other"}</span>
                        </div>
                      </motion.div>
                      
                      {expense.description && (
                        <motion.div 
                          className="mt-2 text-sm text-muted-foreground"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                        >
                          <p>{expense.description}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {expenseToDelete && (
          <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
            <AlertDialogContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Confirm Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the expense "{expenseToDelete.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDeleteExpense}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
      
      {/* Edit Expense Dialog */}
      {editingExpense && (
        <EditExpenseDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          expense={editingExpense}
          members={members}
          onComplete={() => {
            setShowEditDialog(false);
            setEditingExpense(null);
          }}
          currency={currency}
        />
      )}
    </div>
  );
};

export default ExpenseList;