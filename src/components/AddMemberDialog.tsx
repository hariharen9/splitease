import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";
import { Trash2, User, UserPlus, AlertTriangle, Users } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <ResponsiveDialogContent 
            className="glass-panel border-white/10 sm:max-w-[400px]"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ResponsiveDialogHeader>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Users className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <ResponsiveDialogTitle>Manage Group Members</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                      Add or remove people from your expense group
                    </ResponsiveDialogDescription>
                  </div>
                </div>
              </ResponsiveDialogHeader>
            </motion.div>
            
            <motion.div
              className="space-y-6 p-4 sm:p-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New Member
                </div>
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
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleAddMember}
                      disabled={isSubmitting || !newMemberName.trim()}
                      className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Members
                </div>
                {members.length === 0 ? (
                  <motion.div
                    className="text-center py-4 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    No members yet. Add some people to your group!
                  </motion.div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <AnimatePresence>
                      {members.map((member, index) => (
                        <motion.div
                          key={member.id}
                          className="flex items-center justify-between p-2 glass-input rounded-md"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-2">
                            <motion.div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                              style={{ backgroundColor: member.avatarColor }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {getInitials(member.name)}
                            </motion.div>
                            <span>{member.name}</span>
                          </div>
                          <div className="flex items-center">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-white"
                                onClick={() => handleEditMember(member)}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </ResponsiveDialogContent>
        </motion.div>
      </ResponsiveDialog>
      
      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {memberToDelete && (
          <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
            <AlertDialogContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Confirm Removal
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {memberToDelete.name} from the group? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmRemoveMember}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
      
      {/* Rename Dialog */}
      {memberToRename && (
        <RenameDialog
          open={!!memberToRename}
          onOpenChange={(open) => !open && setMemberToRename(null)}
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