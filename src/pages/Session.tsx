
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  Users,
  Copy,
  MoreVertical,
  Pencil,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Member, Expense, Settlement } from "@/lib/types";
import { formatCurrency, getInitials } from "@/lib/utils";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddMemberDialog from "@/components/AddMemberDialog";
import BalanceSummary from "@/components/BalanceSummary";
import SettlementsView from "@/components/SettlementsView";
import { subscribeToSession } from "@/lib/firestore";

const SessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionPin, setSessionPin] = useState("");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get state and actions from the store
  const {
    getCurrentSession,
    calculateBalances,
    calculateSettlements,
    updateSessionTitle,
    syncSessionFromFirestore,
    isFirestoreConnected,
  } = useAppStore();

  // Function to refresh data from store
  const refreshSessionData = useCallback(() => {
    const session = getCurrentSession();
    if (!session) {
      toast.error("Session not found");
      navigate("/");
      return;
    }
    
    setExpenses(session.expenses);
    setMembers(session.members);
    setSessionTitle(session.title);
    setSessionPin(session.pin);
    
    const calculatedBalances = calculateBalances();
    setBalances(calculatedBalances);
    
    const calculatedSettlements = calculateSettlements();
    setSettlements(calculatedSettlements);
    
    // Force a re-render after state updates
    setRefreshKey(prev => prev + 1);
  }, [getCurrentSession, calculateBalances, calculateSettlements, navigate]);

  // Set up real-time sync with Firestore
  useEffect(() => {
    refreshSessionData();
    
    // Only set up Firestore listener if connected
    if (isFirestoreConnected && sessionPin) {
      const unsubscribe = subscribeToSession(sessionPin, (updatedSession) => {
        if (updatedSession) {
          // Sync the updated session to our local store
          syncSessionFromFirestore(updatedSession);
          // Refresh UI with the latest data
          refreshSessionData();
        }
      });
      
      // Clean up subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [id, refreshSessionData, isFirestoreConnected, sessionPin, syncSessionFromFirestore]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(sessionPin);
    toast.success("PIN copied to clipboard");
  };
  
  const handleEditTitle = () => {
    const newTitle = prompt("Enter new session title", sessionTitle);
    if (newTitle && newTitle.trim() !== "") {
      updateSessionTitle(newTitle.trim())
        .then(() => {
          setSessionTitle(newTitle.trim());
          toast.success("Session title updated");
        })
        .catch((error) => {
          console.error("Error updating session title:", error);
          toast.error("Failed to update session title");
        });
    }
  };
  
  const handleBack = () => {
    navigate("/");
  };
  
  const handleAddExpenseComplete = useCallback(() => {
    setShowAddExpense(false);
    refreshSessionData();
  }, [refreshSessionData]);
  
  const handleAddMemberComplete = useCallback(() => {
    setShowAddMember(false);
    refreshSessionData();
  }, [refreshSessionData]);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-background/80 sticky top-0 z-10">
        <div className="container max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-medium">{sessionTitle}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    onClick={handleEditTitle}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* Firestore connection indicator */}
                  {isFirestoreConnected ? (
                    <span className="flex items-center text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                      <Wifi className="h-3 w-3 mr-1" />
                      Synced
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Local
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 py-1 text-muted-foreground hover:text-white flex items-center gap-1.5"
                    onClick={handleCopyPin}
                  >
                    <span className="font-mono">{sessionPin}</span>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Separator orientation="vertical" className="h-3.5" />
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{members.length}</span>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Session Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditTitle}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAddMember(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Members
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBack}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-3xl px-4 py-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Expenses</span>
                <span className="text-xl font-semibold mt-1">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Members</span>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex -space-x-2 overflow-hidden">
                    {members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {getInitials(member.name)}
                      </div>
                    ))}
                  </div>
                  {members.length > 3 && (
                    <span className="text-muted-foreground text-sm ml-1">
                      +{members.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          key={`tabs-${refreshKey}`}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-6"
        >
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settle">Settle Up</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="expenses">
              <motion.div
                key={`expenses-${refreshKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ExpenseList
                  expenses={expenses}
                  members={members}
                  onAddExpense={() => setShowAddExpense(true)}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="balances">
              <motion.div
                key={`balances-${refreshKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BalanceSummary 
                  balances={balances} 
                  members={members} 
                  totalExpenses={totalExpenses}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="settle">
              <motion.div
                key={`settle-${refreshKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettlementsView 
                  settlements={settlements} 
                  members={members}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Add Expense Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowAddExpense(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end shadow-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialogs - Using AnimatePresence for smoother transitions */}
      <AnimatePresence>
        {showAddExpense && (
          <AddExpenseDialog
            key="add-expense-dialog"
            open={showAddExpense}
            onOpenChange={setShowAddExpense}
            members={members}
            onComplete={handleAddExpenseComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMember && (
          <AddMemberDialog
            key="add-member-dialog"
            open={showAddMember}
            onOpenChange={setShowAddMember}
            members={members}
            onComplete={handleAddMemberComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionPage;
