
import React from "react";
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
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { PlusCircle, Receipt } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onAddExpense: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  members, 
  onAddExpense 
}) => {
  // Sort expenses by date, newest first
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Group expenses by date
  const groupedExpenses: Record<string, Expense[]> = {};
  
  sortedExpenses.forEach((expense) => {
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
        <Button onClick={onAddExpense}>
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
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
          <div key={date}>
            <div className="sticky top-16 z-10 flex items-center py-2 bg-background/80 backdrop-blur-sm">
              <h3 className="text-sm font-medium">{date}</h3>
              <div className="ml-4 h-px flex-1 bg-border"></div>
            </div>
            
            <div className="space-y-3 mt-2">
              {dateExpenses.map((expense) => {
                const paidBy = getMember(expense.paidBy);
                return (
                  <motion.div
                    key={expense.id}
                    variants={item}
                    whileHover={{ y: -2 }}
                    className="glass-panel rounded-lg overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">{expense.title}</h4>
                        <span className="font-semibold">
                          {formatCurrency(expense.amount)}
                        </span>
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
    </div>
  );
};

export default ExpenseList;
