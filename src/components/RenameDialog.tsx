import React, { useState, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void;
  title: string;
  description: string;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ 
  open, 
  onOpenChange, 
  currentName, 
  onRename, 
  title, 
  description 
}) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onRename(newName.trim());
    }
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="p-4 sm:p-0">
            <motion.div 
              className="py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
            </motion.div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="transition-all duration-200 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Button 
                  onClick={handleSave} 
                  className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-all duration-300 text-white w-full sm:w-auto"
                  disabled={!newName.trim() || newName.trim() === currentName}
                >
                  Save
                </Button>
              </motion.div>
            </DialogFooter>
          </div>
        </motion.div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default RenameDialog;