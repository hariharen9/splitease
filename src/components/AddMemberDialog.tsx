
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
import { Input } from "@/components/ui/input";
import { Member } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, User, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onComplete: () => void;
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onOpenChange,
  members,
  onComplete
}) => {
  const [newMemberName, setNewMemberName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addMember = useAppStore((state) => state.addMember);
  const removeMember = useAppStore((state) => state.removeMember);
  const updateMember = useAppStore((state) => state.updateMember);
  
  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error("Member name cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addMember(newMemberName.trim());
      setNewMemberName("");
      toast.success(`${newMemberName.trim()} added to the group`);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveMember = (id: string, name: string) => {
    const session = useAppStore.getState().getCurrentSession();
    const isMemberInvolvedInExpenses = session?.expenses.some(
      (expense) => expense.paidBy === id || expense.participants.includes(id)
    );

    if (isMemberInvolvedInExpenses) {
      toast.error(`${name} is involved in expenses and cannot be removed.`);
      return;
    }

    try {
      removeMember(id);
      toast.success(`${name} removed from the group`);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error((error as Error).message || "Failed to remove member");
    }
  };
  
  const handleEditMember = (id: string, currentName: string) => {
    const newName = prompt("Enter new name for this member", currentName);
    
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        updateMember(id, newName.trim());
        toast.success(`Member renamed to ${newName.trim()}`);
      } catch (error) {
        console.error("Error updating member:", error);
        toast.error("Failed to update member name");
      }
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    onComplete();
    onOpenChange(false);
  };
  
  return (
    <Dialog 
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent 
        className="glass-panel border-white/10 sm:max-w-[400px]"
      >
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
          <DialogDescription>
            Add or remove people from your expense group
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Add New Member</div>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="glass-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddMember();
                  }
                }}
              />
              <Button
                onClick={handleAddMember}
                disabled={isSubmitting || !newMemberName.trim()}
                className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Current Members</div>
            {members.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No members yet. Add some people to your group!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 glass-input rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-white"
                        onClick={() => handleEditMember(member.id, member.name)}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleClose}
            className="w-full bg-primary/80 hover:bg-primary transition-colors"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
