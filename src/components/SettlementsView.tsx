import React from "react";
import { Settlement, Member } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import { ArrowRight, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface SettlementsViewProps {
  settlements: Settlement[];
  members: Member[];
  currency: string;
}

const SettlementsView: React.FC<SettlementsViewProps> = ({
  settlements,
  members,
  currency
}) => {
  const { markSettlementAsCompleted } = useAppStore();
  
  // Get member by ID
  const getMember = (id: string): Member | undefined => {
    return members.find((member) => member.id === id);
  };
  
  const handleMarkSettled = async (settlement: Settlement) => {
    try {
      await markSettlementAsCompleted(settlement);
      toast.success("Settlement marked as completed!");
    } catch (error) {
      console.error("Error marking settlement as completed:", error);
      toast.error("Failed to mark settlement as completed");
    }
  };
  
  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 p-4 rounded-full bg-muted text-muted-foreground">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-medium mb-2">All settled up!</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-xs">
          There are no pending settlements between group members
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Suggested Settlements</h3>
      
      <div className="space-y-3">
        {settlements.map((settlement, index) => {
          const fromMember = getMember(settlement.from);
          const toMember = getMember(settlement.to);
          
          // Create a unique key based on the settlement properties
          const key = `${settlement.from}-${settlement.to}-${settlement.amount}`;
          
          if (!fromMember || !toMember) return null;
          
          return (
            <Card 
              key={key} 
              className="glass-panel border-white/10 overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: fromMember.avatarColor }}
                      >
                        {getInitials(fromMember.name)}
                      </div>
                      <span className="font-medium">{fromMember.name}</span>
                    </div>
                    
                    <div className="flex items-center px-2">
                      <span className="text-muted-foreground mx-1">pays</span>
                      <span className="font-semibold mx-1">
                        <span>{getCurrencySymbol(currency)}</span>
                        {formatCurrency(settlement.amount, currency)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
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
                  
                  <Button 
                    variant="outline" 
                    className="w-full glass-input border-dashed"
                    onClick={() => handleMarkSettled(settlement)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as settled
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SettlementsView;