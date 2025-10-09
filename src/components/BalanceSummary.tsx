import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member, Expense } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, ArrowRight, Users, TrendingUp, TrendingDown, CheckCircle, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store/index";
import { Badge } from "@/components/ui/badge";

interface BalanceSummaryProps {
  balances: Record<string, number>;
  members: Member[];
  totalExpenses: number;
  currency: string;
}

interface DetailedOwedAmount {
  from: string;
  to: string;
  amount: number;
  expenseTitle: string;
  expenseId: string;
  isSettled: boolean;
  settledAmount: number;
  totalOwed: number;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  balances,
  members,
  totalExpenses,
  currency
}) => {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const { getCurrentSession } = useAppStore();
  const session = getCurrentSession();
  
  // Get member by ID
  const getMember = (id: string): Member | undefined => {
    return members.find((member) => member.id === id);
  };
  
  // Calculate detailed owed amounts
  const calculateDetailedOwedAmounts = (): DetailedOwedAmount[] => {
    if (!session) return [];
    
    const owedAmounts: DetailedOwedAmount[] = [];
    
    session.expenses.forEach(expense => {
      const payer = getMember(expense.paidBy);
      if (!payer) return;
      
      if (expense.split === 'equal') {
        const amountPerPerson = expense.amount / expense.participants.length;
        expense.participants.forEach(participantId => {
          if (participantId !== expense.paidBy) {
            const participant = getMember(participantId);
            if (participant) {
              // Calculate settled amount between these two members
              const settledAmount = getSettledAmountBetween(participantId, expense.paidBy);
              const totalOwed = getTotalOwedAmountBetween(participantId, expense.paidBy);
              const isSettled = Math.abs(totalOwed - settledAmount) < 0.01; // Using epsilon for floating point comparison
              
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amountPerPerson,
                expenseTitle: expense.title,
                expenseId: expense.id,
                isSettled,
                settledAmount,
                totalOwed
              });
            }
          }
        });
      } else if (expense.customSplits && expense.split === 'percentage') {
        Object.entries(expense.customSplits).forEach(([participantId, percentage]) => {
          if (participantId !== expense.paidBy) {
            const participant = getMember(participantId);
            const amount = expense.amount * (percentage / 100);
            if (participant && amount > 0) {
              // Calculate settled amount between these two members
              const settledAmount = getSettledAmountBetween(participantId, expense.paidBy);
              const totalOwed = getTotalOwedAmountBetween(participantId, expense.paidBy);
              const isSettled = Math.abs(totalOwed - settledAmount) < 0.01; // Using epsilon for floating point comparison
              
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amount,
                expenseTitle: expense.title,
                expenseId: expense.id,
                isSettled,
                settledAmount,
                totalOwed
              });
            }
          }
        });
      } else if (expense.customSplits && expense.split === 'amount') {
        Object.entries(expense.customSplits).forEach(([participantId, amount]) => {
          if (participantId !== expense.paidBy) {
            const participant = getMember(participantId);
            if (participant && amount > 0) {
              // Calculate settled amount between these two members
              const settledAmount = getSettledAmountBetween(participantId, expense.paidBy);
              const totalOwed = getTotalOwedAmountBetween(participantId, expense.paidBy);
              const isSettled = Math.abs(totalOwed - settledAmount) < 0.01; // Using epsilon for floating point comparison
              
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amount,
                expenseTitle: expense.title,
                expenseId: expense.id,
                isSettled,
                settledAmount,
                totalOwed
              });
            }
          }
        });
      }
    });
    
    return owedAmounts;
  };
  
  // Calculate the total settled amount between two members
  const getSettledAmountBetween = (from: string, to: string): number => {
    if (!session || !session.settlementsCompleted) return 0;
    
    return session.settlementsCompleted
      .filter(settlement => 
        settlement.from === from && 
        settlement.to === to
      )
      .reduce((total, settlement) => total + settlement.amount, 0);
  };
  
  // Calculate the total owed amount between two members across all expenses
  const getTotalOwedAmountBetween = (from: string, to: string): number => {
    if (!session) return 0;
    
    return session.expenses.reduce((total, expense) => {
      let amount = 0;
      
      if (expense.paidBy === to) {
        if (expense.split === 'equal') {
          if (expense.participants.includes(from) && from !== to) {
            amount = expense.amount / expense.participants.length;
          }
        } else if (expense.customSplits) {
          if (expense.split === 'percentage' && expense.customSplits[from]) {
            amount = expense.amount * (expense.customSplits[from] / 100);
          } else if (expense.split === 'amount' && expense.customSplits[from]) {
            amount = expense.customSplits[from];
          }
        }
      }
      
      return total + amount;
    }, 0);
  };
  
  // Function to determine who should pay next based on balances
  const getPaymentSuggestion = (members: Member[], balances: Record<string, number>): string => {
    // If we don't have enough members or balance data, return a default message
    if (members.length < 2 || Object.keys(balances).length === 0) {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      return randomMember ? `${randomMember.name} should pay for the next expense.` : "Add members to get personalized suggestions.";
    }

    // Find the member who owes the most (most negative balance)
    let maxDebt = 0;
    let debtorId = "";
    
    // Find the member who is owed the most (most positive balance)
    let maxCredit = 0;
    let creditorId = "";
    
    Object.entries(balances).forEach(([memberId, balance]) => {
      if (balance < maxDebt) {
        maxDebt = balance;
        debtorId = memberId;
      }
      if (balance > maxCredit) {
        maxCredit = balance;
        creditorId = memberId;
      }
    });
    
    // Get member names
    const debtor = members.find(m => m.id === debtorId);
    const creditor = members.find(m => m.id === creditorId);
    
    // If we have a clear debtor, suggest they pay next
    if (debtor && maxDebt < -1) { // Only suggest if debt is significant (> 1 unit)
      return `${debtor.name} should pay for the next expense to reduce their balance.`;
    }
    
    // If we have a clear creditor, suggest someone else pays to balance things
    if (creditor && maxCredit > 1) { // Only suggest if credit is significant (> 1 unit)
      const otherMembers = members.filter(m => m.id !== creditorId);
      if (otherMembers.length > 0) {
        const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];
        return `${randomMember.name} should pay for the next expense to keep things balanced.`;
      }
    }
    
    // If balances are relatively even, suggest a random member
    const randomMember = members[Math.floor(Math.random() * members.length)];
    return `${randomMember.name} should pay for the next expense to maintain balance.`;
  };

  const memberBalances = Object.entries(balances)
    .map(([memberId, amount]) => ({
      member: getMember(memberId),
      amount,
    }))
    .filter((item) => item.member) // Only include existing members
    .sort((a, b) => b.amount - a.amount); // Sort by amount (highest first)
  
  if (members.length === 0) {
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
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Users className="h-8 w-8" />
        </motion.div>
        <motion.h3 
          className="text-xl font-medium mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No members yet
        </motion.h3>
        <motion.p 
          className="text-muted-foreground mb-6 text-center max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Add members to your group to start tracking balances
        </motion.p>
      </motion.div>
    );
  }
  
  const detailedOwedAmounts = calculateDetailedOwedAmounts();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-medium flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Balance Summary
        </h3>
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
        >
          <Label htmlFor="detailed-view" className="text-sm font-normal">
            {showDetailedView ? "Detailed View" : "Summary View"}
          </Label>
          <Switch
            id="detailed-view"
            checked={showDetailedView}
            onCheckedChange={setShowDetailedView}
          />
        </motion.div>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {!showDetailedView ? (
          // Summary view (existing implementation)
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Who Should Pay Next? Suggestion - AI Insight */}
            {members.length > 1 && (
              <motion.div
                className="mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-panel border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <motion.div
                        className="flex-shrink-0 mt-0.5"
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
                        <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          <span className="text-blue-400">Insights:</span> Suggestions to keep things balanced, just like THANOS wanted 😉
                        </p>
                        <motion.p 
                          className="text-xs text-muted-foreground mt-0.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {getPaymentSuggestion(members, balances)}
                        </motion.p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {memberBalances.map(({ member, amount }, index) => (
              <motion.div
                key={member?.id || `member-${amount}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }} // Add delay to account for the suggestion card
                whileHover={{ y: -2 }}
              >
                <Card className="glass-panel border-white/10 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {member && (
                          <motion.div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                            style={{ backgroundColor: member.avatarColor }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {getInitials(member.name)}
                          </motion.div>
                        )}
                        <div>
                          <div className="font-medium">{member?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {amount > 0 ? "is owed" : amount < 0 ? "owes" : "settled"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-semibold text-lg ${
                          amount > 0 ? "text-green-500" : 
                          amount < 0 ? "text-red-500" : "text-gray-500"
                        }`}>
                          {amount > 0 ? "+" : ""}
                          {getCurrencySymbol(currency)}
                          {formatCurrency(Math.abs(amount), currency)}
                        </div>
                        <div className="flex items-center justify-end">
                          {amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : amount < 0 ? (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Animated progress bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            amount > 0 ? "bg-green-500" : 
                            amount < 0 ? "bg-red-500" : "bg-gray-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.2 + index * 0.05 + 0.3 }} // Add delay to account for the suggestion card
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Detailed view with enhanced information
          <motion.div
            key="detailed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {detailedOwedAmounts.map((owed, index) => {
              const fromMember = getMember(owed.from);
              const toMember = getMember(owed.to);
              
              return (
                <motion.div
                  key={`${owed.from}-${owed.to}-${owed.expenseId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className={`glass-panel border-white/10 overflow-hidden ${
                    owed.isSettled ? "opacity-70" : ""
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {fromMember && (
                            <motion.div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: fromMember.avatarColor }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {getInitials(fromMember.name)}
                            </motion.div>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          {toMember && (
                            <motion.div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: toMember.avatarColor }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {getInitials(toMember.name)}
                            </motion.div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{owed.expenseTitle}</div>
                            <div className="flex items-center gap-1">
                              {owed.isSettled ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-500">Settled</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs text-yellow-500">Pending</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">
                            {getCurrencySymbol(currency)}
                            {formatCurrency(owed.amount, currency)}
                          </div>
                          {owed.settledAmount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {getCurrencySymbol(currency)}
                              {formatCurrency(owed.settledAmount, currency)} / {getCurrencySymbol(currency)}
                              {formatCurrency(owed.totalOwed, currency)} settled
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            
            {/* Summary of overall settlement status */}
            <motion.div
              className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Settlement Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailedOwedAmounts.filter(owed => owed.isSettled).length} of {detailedOwedAmounts.length} debts settled
                  </p>
                </div>
                <Badge variant="secondary">
                  {Math.round((detailedOwedAmounts.filter(owed => owed.isSettled).length / detailedOwedAmounts.length) * 100 || 0)}% Complete
                </Badge>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(detailedOwedAmounts.filter(owed => owed.isSettled).length / detailedOwedAmounts.length) * 100 || 0}%` 
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BalanceSummary;