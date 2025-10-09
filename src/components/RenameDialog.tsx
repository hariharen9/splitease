
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
