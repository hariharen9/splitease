import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Plus,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Logo from "@/components/Logo";
import SessionCard from "@/components/SessionCard";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";

const AllSessions = () => {
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const deleteSession = useAppStore((state) => state.deleteSession);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);
  
  const handleSelectSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };
  
  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };
  
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      await deleteSession(sessionToDelete);
      toast.success("Session deleted successfully");
    } catch (error: any) {
      console.error("Error deleting session:", error);
      // Check if it's a Firebase not-found error
      if (error?.code === 'not-found') {
        // Even if Firestore delete failed, the local session was removed
        toast.success("Session deleted successfully");
      } else {
        toast.error("Failed to delete session: " + (error?.message || "Unknown error"));
      }
    } finally {
      setSessionToDelete(null);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <motion.header 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <Logo />
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-all duration-300 text-white shadow-lg hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </motion.div>
      </motion.header>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <motion.h2 
              className="text-2xl font-semibold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your Past Sessions
            </motion.h2>
            <Separator className="flex-1 ml-4" />
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {sessions.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-muted-foreground mb-6 text-lg">
                You don't have any sessions yet
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-all duration-300 text-white shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Session
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SessionCard
                    session={session}
                    onSelect={handleSelectSession}
                    onDelete={handleDeleteSession}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </motion.div>
                Delete Session
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be undone. All expenses and member data in this session will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive hover:bg-destructive/90 transition-all duration-300"
                onClick={confirmDeleteSession}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllSessions;