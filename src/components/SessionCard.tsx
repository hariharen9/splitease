import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { ArrowRight, Copy, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

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
    <div 
      className={cn(
        "glass-panel p-4 rounded-xl transition-all duration-300 hover:bg-white/[0.05] group",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium truncate">{session.title}</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleCopyPin}
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5 mr-4">
          <Users className="h-3.5 w-3.5" />
          <span>{session.members.length} members</span>
        </div>
        <div>
          <span>Created {formatDate(session.createdAt)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1 bg-white/[0.07] px-2.5 py-1 rounded-md text-sm">
          <span className="text-muted-foreground">PIN:</span>
          <span className="font-mono">{session.pin}</span>
        </div>
        
        <Button 
          size="sm" 
          className="bg-primary/90 hover:bg-primary transition-colors"
          onClick={() => onSelect(session.id)}
        >
          Open <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SessionCard;