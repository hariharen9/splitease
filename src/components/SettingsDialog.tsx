import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const { getCurrentSession, updateCurrency, deleteSession } = useAppStore();
  const session = getCurrentSession();
  const [selectedCurrency, setSelectedCurrency] = useState(session?.currency || "INR");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = initial warning, 2 = final confirmation
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const navigate = useNavigate();

  const handleSave = () => {
    if (session) {
      updateCurrency(selectedCurrency);
      toast.success("Currency updated successfully");
      onOpenChange(false);
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
      <Dialog open={open} onOpenChange={handleCancelDelete}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Session
            </DialogTitle>
            {deleteStep === 1 ? (
              <DialogDescription>
                This action cannot be undone. This will permanently delete your session and remove all associated data.
              </DialogDescription>
            ) : (
              <DialogDescription>
                To confirm, please type the session name: <span className="font-semibold">{session?.title}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            {deleteStep === 1 ? (
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="sessionTitle">Session Name</Label>
                <input
                  id="sessionTitle"
                  value={sessionTitleInput}
                  onChange={(e) => setSessionTitleInput(e.target.value)}
                  placeholder="Type session name to confirm"
                  className="glass-input w-full px-3 py-2 rounded-md border"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Type the exact session name to confirm deletion
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} className="glass-input border-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleProceedToDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteStep === 2 && sessionTitleInput !== session?.title}
            >
              {deleteStep === 1 ? "Continue" : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your session settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Currencies</SelectLabel>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <Button 
              variant="destructive" 
              className="w-full flex items-center gap-2"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              Delete Session
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Permanently delete this session and all its data
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="glass-input border-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;