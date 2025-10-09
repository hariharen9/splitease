import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { ArrowRight, Copy, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface SessionCardProps {
  session: Session;
  onSelect: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  className?: string;
}

const SessionCard = ({ session, onSelect, onDelete, className }: SessionCardProps) => {
  const handleCopyPin = () => {
    navigator.clipboard.writeText(session.pin);
    toast.success("PIN copied to clipboard");
  };
  
  return (
    <motion.div 
      className={cn(
        "glass-panel p-4 rounded-xl transition-all duration-300 hover:bg-white/[0.05] group",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-3">
        <motion.h3 
          className="text-lg font-medium truncate"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {session.title}
        </motion.h3>
        <div className="flex gap-1">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              onClick={handleCopyPin}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </motion.div>
          {onDelete && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      <motion.div 
        className="flex items-center text-sm text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-1.5 mr-4">
          <Users className="h-3.5 w-3.5" />
          <span>{session.members.length} members</span>
        </div>
        <div>
          <span>Created {formatDate(session.createdAt)}</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="flex items-center justify-between mt-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1 bg-white/[0.07] px-2.5 py-1 rounded-md text-sm">
          <span className="text-muted-foreground">PIN:</span>
          <motion.span 
            className="font-mono"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {session.pin}
          </motion.span>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="sm" 
            className="bg-primary/90 hover:bg-primary transition-colors group"
            onClick={() => onSelect(session.id)}
          >
            Open 
            <motion.div
              className="ml-1"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SessionCard;