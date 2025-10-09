import React, { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as firestoreService from "@/lib/firestore";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "United States Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { getCurrentSession, deleteSession } = useAppStore();
  const session = getCurrentSession();
  const [selectedCurrency, setSelectedCurrency] = useState(session?.currency || "INR");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = initial warning, 2 = final confirmation
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
    if (session) {
      // Update currency in local state and Firestore
      try {
        if (useAppStore.getState().isFirestoreConnected && session.pin) {
          await firestoreService.updateSessionCurrency(session.pin, selectedCurrency);
        }
        
        // Update local state
        useAppStore.setState((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === session.id ? { ...s, currency: selectedCurrency } : s
          ),
        }));
        
        toast.success("Currency updated successfully");
        onOpenChange(false);
      } catch (error) {
        console.error("Error updating currency:", error);
        toast.error("Failed to update currency");
      }
    }
  };

  const handleDeleteSession = async () => {
    if (!session) return;
    
    try {
      await deleteSession(session.id);
      toast.success("Session deleted successfully");
      onOpenChange(false);
      navigate("/"); // Redirect to home page after deletion
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteStep(1);
    setSessionTitleInput("");
  };

  const handleProceedToDelete = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      // Final step - check if session title matches
      if (sessionTitleInput === session?.title) {
        handleDeleteSession();
      } else {
        toast.error("Session title does not match. Please try again.");
      }
    }
  };

  // If showing delete confirmation, render that instead
  if (showDeleteConfirmation) {
    return (
      <ResponsiveDialog open={open} onOpenChange={handleCancelDelete}>
        <ResponsiveDialogContent className="glass-panel border-white/10 sm:max-w-[400px] max-w-[95vw] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle className="flex items-center gap-2 text-destructive">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertTriangle className="h-5 w-5" />
                </motion.div>
                Delete Session
              </ResponsiveDialogTitle>
              {deleteStep === 1 ? (
                <ResponsiveDialogDescription>
                  This action cannot be undone. This will permanently delete your session and remove all associated data.
                </ResponsiveDialogDescription>
              ) : (
                <ResponsiveDialogDescription>
                  To confirm, please type the session name: <span className="font-semibold">{session?.title}</span>
                </ResponsiveDialogDescription>
              )}
            </ResponsiveDialogHeader>
            
            <motion.div 
              className="py-4 max-h-[60vh] overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {deleteStep === 1 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      You are about to permanently delete:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Session: {session?.title}</li>
                        <li>All expenses and transactions</li>
                        <li>All member information</li>
                        <li>All balance calculations</li>
                      </ul>
                      <p className="mt-2 font-semibold">This action cannot be undone.</p>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="sessionTitle">Session Name</Label>
                  <input
                    id="sessionTitle"
                    value={sessionTitleInput}
                    onChange={(e) => setSessionTitleInput(e.target.value)}
                    placeholder="Type session name to confirm"
                    className="glass-input w-full px-3 py-2 rounded-md border transition-all duration-300 focus:ring-2 focus:ring-destructive/50"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    Type the exact session name to confirm deletion
                  </p>
                </motion.div>
              )}
            </motion.div>
            
            <div className="flex justify-end gap-2 mt-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" onClick={handleCancelDelete} className="glass-input border-white/10 transition-all duration-200">
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleProceedToDelete} 
                  className="bg-destructive hover:bg-destructive/90 transition-all duration-300"
                  disabled={deleteStep === 2 && sessionTitleInput !== session?.title}
                >
                  {deleteStep === 1 ? "Continue" : "Delete Session"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="glass-panel border-white/10 sm:max-w-[400px] max-w-[95vw] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Settings</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Customize your session settings
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          
          <motion.div 
            className="space-y-4 py-4 max-h-[60vh] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SelectTrigger className="glass-input transition-all duration-300 hover:border-primary/50">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                </motion.div>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Currencies</SelectLabel>
                    <AnimatePresence>
                      {currencies.map((currency, index) => (
                        <motion.div
                          key={currency.value}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <SelectItem value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </motion.div>
            
            <motion.div 
              className="pt-4 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/20"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Session
                </Button>
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Permanently delete this session and all its data
              </p>
            </motion.div>
          </motion.div>
          
          <div className="flex justify-end gap-2 mt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="outline" onClick={() => onOpenChange(false)} className="glass-input border-white/10 transition-all duration-200">
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleSave} 
                className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-all duration-300 text-white"
              >
                Save
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default SettingsDialog;