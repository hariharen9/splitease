import React, { useState } from "react";
import { Member, Expense } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, ArrowRight, Users } from "lucide-react";
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
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amountPerPerson,
                expenseTitle: expense.title,
                expenseId: expense.id
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
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amount,
                expenseTitle: expense.title,
                expenseId: expense.id
              });
            }
          }
        });
      } else if (expense.customSplits && expense.split === 'amount') {
        Object.entries(expense.customSplits).forEach(([participantId, amount]) => {
          if (participantId !== expense.paidBy) {
            const participant = getMember(participantId);
            if (participant && amount > 0) {
              owedAmounts.push({
                from: participantId,
                to: expense.paidBy,
                amount: amount,
                expenseTitle: expense.title,
                expenseId: expense.id
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
  
  // Check if a specific expense amount is settled between two members
  const isExpenseSettled = (from: string, to: string, expenseAmount: number): boolean => {
    if (!session || !session.settlementsCompleted) return false;
    
    const settledAmount = getSettledAmountBetween(from, to);
    const totalOwed = getTotalOwedAmountBetween(from, to);
    
    // If the total settled amount covers the total owed, then this expense is settled
    return settledAmount >= totalOwed;
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 p-4 rounded-full bg-muted text-muted-foreground">
          <Users className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-medium mb-2">No members yet</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-xs">
          Add members to your group to start tracking balances
        </p>
      </div>
    );
  }
  
  const detailedOwedAmounts = calculateDetailedOwedAmounts();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Balance Summary</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="detailed-view" className="text-sm font-normal">
            {showDetailedView ? "Detailed View" : "Summary View"}
          </Label>
          <Switch
            id="detailed-view"
            checked={showDetailedView}
            onCheckedChange={setShowDetailedView}
          />
        </div>
      </div>
      
      {!showDetailedView ? (
        // Summary view (existing implementation)
        <div className="space-y-3">
          {memberBalances.map(({ member, amount }) => (
            <Card 
              key={member?.id || `member-${amount}`} 
              className="glass-panel border-white/10 overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                      style={{ backgroundColor: member?.avatarColor }}
                    >
                      {member ? getInitials(member.name) : '?'}
                    </div>
                    <div>
                      <div className="font-medium">{member?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {amount > 0 
                          ? "gets back" 
                          : amount < 0 
                            ? "owes" 
                            : "is settled up"}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`font-semibold ${amount > 0 ? 'text-green-500' : amount < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    <div className="flex items-center">
                      {amount > 0 && <ArrowUpRight className="h-4 w-4 mr-1" />}
                      {amount < 0 && <ArrowDownRight className="h-4 w-4 mr-1" />}
                      <span>{getCurrencySymbol(currency)}</span>
                      {formatCurrency(Math.abs(amount), currency)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Detailed view
        <div className="space-y-4">
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Who owes whom</h4>
              {detailedOwedAmounts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No expenses recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {detailedOwedAmounts.map((owed, index) => {
                    const fromMember = getMember(owed.from);
                    const toMember = getMember(owed.to);
                    const isSettled = isExpenseSettled(owed.from, owed.to, owed.amount);
                    
                    if (!fromMember || !toMember) return null;
                    
                    return (
                      <div key={`${owed.expenseId}-${owed.from}-${owed.to}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: fromMember.avatarColor }}
                            >
                              {getInitials(fromMember.name)}
                            </div>
                            <span className="font-medium">{fromMember.name}</span>
                          </div>
                          
                          <div className="hidden sm:block text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{toMember.name}</span>
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ backgroundColor: toMember.avatarColor }}
                            >
                              {getInitials(toMember.name)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-normal gap-3">
                          <div className="text-right">
                            <div className="font-medium">
                              <span>{getCurrencySymbol(currency)}</span>
                              {formatCurrency(owed.amount, currency)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              for {owed.expenseTitle}
                            </div>
                          </div>
                          
                          <Badge variant={isSettled ? "default" : "secondary"} className={isSettled ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}>
                            {isSettled ? "Settled" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Net balances</h4>
              <div className="space-y-2">
                {memberBalances.map(({ member, amount }) => (
                  <div key={`net-${member?.id}`} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: member?.avatarColor }}
                      >
                        {member ? getInitials(member.name) : '?'}
                      </div>
                      <span>{member?.name}</span>
                    </div>
                    <div className={`font-medium ${amount > 0 ? 'text-green-500' : amount < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {amount > 0 
                        ? `gets back ${getCurrencySymbol(currency)}${formatCurrency(amount, currency)}` 
                        : amount < 0 
                          ? `owes ${getCurrencySymbol(currency)}${formatCurrency(Math.abs(amount), currency)}` 
                          : "settled up"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BalanceSummary;