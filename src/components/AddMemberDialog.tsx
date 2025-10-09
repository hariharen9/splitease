
import React, { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Member } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, User, UserPlus, AlertTriangle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import RenameDialog from "@/components/RenameDialog";

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
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToRename, setMemberToRename] = useState<Member | null>(null);
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
  
  const handleRemoveMember = (member: Member) => {
    const session = useAppStore.getState().getCurrentSession();
    const isMemberInvolvedInExpenses = session?.expenses.some(
      (expense) => expense.paidBy === member.id || expense.participants.includes(member.id)
    );

    if (isMemberInvolvedInExpenses) {
      toast.error(`${member.name} is involved in expenses and cannot be removed.`);
      return;
    }

    setMemberToDelete(member);
  };

  const confirmRemoveMember = () => {
    if (!memberToDelete) return;

    try {
      removeMember(memberToDelete.id);
      toast.success(`${memberToDelete.name} removed from the group`);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error((error as Error).message || "Failed to remove member");
    } finally {
      setMemberToDelete(null);
    }
  };
  
  const handleEditMember = (member: Member) => {
    setMemberToRename(member);
  };

  const confirmRenameMember = (newName: string) => {
    if (!memberToRename) return;

    try {
      updateMember(memberToRename.id, newName);
      toast.success(`Member renamed to ${newName}`);
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member name");
    } finally {
      setMemberToRename(null);
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    onComplete();
    onOpenChange(false);
  };
  
  return (
    <>
      <ResponsiveDialog 
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <ResponsiveDialogContent 
          className="glass-panel border-white/10 sm:max-w-[400px]"
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Manage Group Members</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Add or remove people from your expense group
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          
          <div className="space-y-6 p-4 sm:p-0">
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
                          onClick={() => handleEditMember(member)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveMember(member)}
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
          
          <div className="p-4 sm:p-0">
            <Button
              onClick={handleClose}
              className="w-full bg-primary/80 hover:bg-primary transition-colors"
            >
              Done
            </Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmRemoveMember}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {memberToRename && (
        <RenameDialog
          open={!!memberToRename}
          onOpenChange={() => setMemberToRename(null)}
          currentName={memberToRename.name}
          onRename={confirmRenameMember}
          title="Rename Member"
          description="Enter a new name for this member."
        />
      )}
    </>
  );
};

export default AddMemberDialog;
