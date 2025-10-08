
import React from "react";
import { Member } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";

interface BalanceSummaryProps {
  balances: Record<string, number>;
  members: Member[];
  totalExpenses: number;
  currency: string;
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  balances,
  members,
  totalExpenses,
  currency
}) => {
  // Get member by ID
  const getMember = (id: string): Member | undefined => {
    return members.find((member) => member.id === id);
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
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Balance Summary</h3>
      
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
    </div>
  );
};

export default BalanceSummary;
