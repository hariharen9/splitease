import React from "react";
import { motion } from "framer-motion";
import { Settlement, Member } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import { ArrowRight, Check, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/index";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div 
          className="mb-4 p-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
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
          <CreditCard className="h-8 w-8" />
        </motion.div>
        <motion.h3 
          className="text-xl font-medium mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          All settled up!
        </motion.h3>
        <motion.p 
          className="text-muted-foreground mb-6 text-center max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          There are no pending settlements between group members
        </motion.p>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <motion.div 
        className="flex items-center gap-2 mb-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-medium">Suggested Settlements</h3>
        <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded-full">
          {settlements.length} transactions
        </span>
      </motion.div>
      
      <div className="space-y-3">
        {settlements.map((settlement, index) => {
          const fromMember = getMember(settlement.from);
          const toMember = getMember(settlement.to);
          
          // Create a unique key based on the settlement properties
          const key = `${settlement.from}-${settlement.to}-${settlement.amount}`;
          
          if (!fromMember || !toMember) return null;
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className="glass-panel border-white/10 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <motion.div 
                        className="flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: fromMember.avatarColor }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {getInitials(fromMember.name)}
                        </motion.div>
                        <span className="font-medium">{fromMember.name}</span>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center px-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="text-muted-foreground mx-1">pays</span>
                        <motion.span 
                          className="font-semibold mx-1"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span>{getCurrencySymbol(currency)}</span>
                          {formatCurrency(settlement.amount, currency)}
                        </motion.span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="font-medium">{toMember.name}</span>
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: toMember.avatarColor }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {getInitials(toMember.name)}
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        variant="outline" 
                        className="w-full glass-input border-dashed"
                        onClick={() => handleMarkSettled(settlement)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                        </motion.div>
                        Mark as settled
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div
        className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-muted-foreground">
          These suggestions minimize the number of transactions needed to settle all balances.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SettlementsView;