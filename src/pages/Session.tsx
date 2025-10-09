
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  Users,
  Share2,
  MoreVertical,
  Pencil,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/index";
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
import { formatCurrency, getInitials, getCurrencySymbol } from "@/lib/utils";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import AddMemberDialog from "@/components/AddMemberDialog";
import BalanceSummary from "@/components/BalanceSummary";
import SettlementsView from "@/components/SettlementsView";
import { subscribeToSession } from "@/lib/firestore";
import SettingsDialog from "@/components/SettingsDialog";
import ActivityTab from "@/components/ActivityTab";
import ShareSessionDialog from "@/components/ShareSessionDialog";
import RenameDialog from "@/components/RenameDialog";
import Footer from "@/components/Footer";

import { Skeleton } from "@/components/ui/skeleton";

const SessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showAddMemberPrompt, setShowAddMemberPrompt] = useState(false);

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const {
    getCurrentSession,
    calculateBalances,
    calculateSettlements,
    updateSessionTitle,
    syncSessionFromFirestore,
    isFirestoreConnected,
    isFirestoreAvailable,
    setFirestoreAvailable,
  } = useAppStore();

  const session = getCurrentSession();
  
  // Use session ID as dependency instead of the entire session object
  const sessionId = session?.id;
  const sessionPin = session?.pin;

  useEffect(() => {
    if (session) {
      const calculatedBalances = calculateBalances();
      setBalances(calculatedBalances);
      const calculatedSettlements = calculateSettlements();
      setSettlements(calculatedSettlements);
      
      // Check if we should prompt to add members (only when first loading a session with no members)
      if (session.members.length === 0 && !showAddMemberPrompt) {
        setShowAddMemberPrompt(true);
        setShowAddMember(true);
        // Show a toast to explain why the dialog is opening
        toast.info("Let's add some members to get started!");
      }
    }
  }, [session, calculateBalances, calculateSettlements, showAddMemberPrompt]); // Use the entire session object to track all changes

  const {
    expenses = [],
    members = [],
    title: sessionTitle = "",
  } = session || {};

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }

    // Only subscribe if Firestore is connected and we have a session PIN
    if (isFirestoreConnected && sessionPin) {
      console.log("Setting up Firestore subscription for PIN:", sessionPin);
      const unsubscribe = subscribeToSession(sessionPin, (updatedSession) => {
        if (updatedSession) {
          syncSessionFromFirestore(updatedSession);
        } else {
          // Only navigate away if the session was actually deleted, not just disconnected
          // Check if we still have local data for this session
          const localSession = getCurrentSession();
          if (!localSession) {
            // Session was actually deleted
            toast.error("Session no longer exists");
            navigate("/");
          } else {
            // Likely a connectivity issue, stay in the session
            console.log("Connectivity issue - staying in session with local data");
          }
        }
      });

      // Clean up subscription on unmount or when dependencies change
      return () => {
        console.log("Cleaning up Firestore subscription for PIN:", sessionPin);
        unsubscribe();
      };
    }
    
    // Return a no-op cleanup function if we don't subscribe
    return () => {};
  }, [sessionId, sessionPin, isFirestoreConnected, syncSessionFromFirestore, navigate]);

  // Monitor Firestore connectivity with periodic checks
  useEffect(() => {
    // Only monitor if we're supposed to be connected
    if (!isFirestoreConnected) return;
    
    let connectivityCheckInterval: NodeJS.Timeout;
    
    const checkConnectivity = async () => {
      try {
        // In a real app, you would use Firestore's connectivity monitoring
        // For now, we'll use navigator.onLine as a basic check
        const isOnline = navigator.onLine;
        if (isOnline !== isFirestoreAvailable) {
          setFirestoreAvailable(isOnline);
          if (isOnline) {
            console.log("Firestore connection restored");
          } else {
            console.log("Firestore connection lost");
          }
        }
      } catch (error) {
        console.log("Connectivity check failed:", error);
      }
    };
    
    // Initial check
    checkConnectivity();
    
    // Set up periodic checks
    connectivityCheckInterval = setInterval(checkConnectivity, 5000); // Check every 5 seconds
    
    // Listen for online/offline events
    const handleOnline = () => {
      setFirestoreAvailable(true);
      console.log("Browser went online");
    };
    
    const handleOffline = () => {
      setFirestoreAvailable(false);
      console.log("Browser went offline");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(connectivityCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isFirestoreConnected, isFirestoreAvailable, setFirestoreAvailable]);

  const handleRenameSession = (newTitle: string) => {
    updateSessionTitle(newTitle)
      .then(() => {
        toast.success("Session title updated");
      })
      .catch((error) => {
        console.error("Error updating session title:", error);
        toast.error("Failed to update session title");
      });
  };

  const handleBack = () => {
    navigate("/");
  };
  
  const handleAddExpenseComplete = useCallback(() => {
    setShowAddExpense(false);
  }, []);
  
  const handleAddMemberComplete = useCallback(() => {
    setShowAddMember(false);
    setShowAddMemberPrompt(false);
  }, []);

  const handleSettingsComplete = useCallback(() => {
    setShowSettings(false);
  }, []);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header Skeleton */}
        <header className="border-b border-white/10">
          <div className="container max-w-3xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1.5" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 container max-w-3xl px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

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
                    onClick={() => setShowRename(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* Firestore connection indicator */}
                  {isFirestoreConnected ? (
                    isFirestoreAvailable ? (
                      <span className="flex items-center text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                        <Wifi className="h-3 w-3 mr-1" />
                        Synced
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
                        <WifiOff className="h-3 w-3 mr-1" />
                        No Connection
                      </span>
                    )
                  ) : (
                    <span className="flex items-center text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Local
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="font-mono">PIN: {sessionPin}</span>
                  <Separator orientation="vertical" className="h-3.5" />
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{members.length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Session Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowRename(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename Session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddMember(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
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
                  <span>{getCurrencySymbol(session?.currency)}</span>
                  {formatCurrency(totalExpenses, session?.currency)}
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
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-6"
        >
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="settle">Settle Up</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="expenses" key="expenses-tab">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ExpenseList
                  expenses={expenses}
                  members={members}
                  onAddExpense={() => setShowAddExpense(true)}
                  currency={session?.currency}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="balances" key="balances-tab">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <BalanceSummary 
                  balances={balances} 
                  members={members} 
                  totalExpenses={totalExpenses}
                  currency={session?.currency}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="settle" key="settle-tab">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettlementsView 
                  settlements={settlements} 
                  members={members}
                  currency={session?.currency}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="activity" key="activity-tab">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityTab 
                  activities={session?.activities || []}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Add Expense Button */}
      <div className="fixed bottom-16 w-full flex justify-center z-20">
        <motion.div
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setShowAddExpense(true)}
            className="h-12 px-5 rounded-full bg-white/10 backdrop-blur-lg border shadow-lg hover:bg-white/20 transition-all flex items-center gap-2 text-white"
          >
            <Plus className="h-5 w-5" />
            <span className="text-base">Add Expense</span>
          </Button>
        </motion.div>
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

      <AnimatePresence>
        {showSettings && (
          <SettingsDialog
            key="settings-dialog"
            open={showSettings}
            onOpenChange={setShowSettings}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && (
          <ShareSessionDialog
            key="share-dialog"
            open={showShare}
            onOpenChange={setShowShare}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRename && (
          <RenameDialog
            key="rename-dialog"
            open={showRename}
            onOpenChange={setShowRename}
            currentName={sessionTitle}
            onRename={handleRenameSession}
            title="Rename Session"
            description="Enter a new name for this session."
          />
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default SessionPage;
