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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/index";
import { reinitializeFirebase } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

interface FirebaseConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FirebaseConnectDialog: React.FC<FirebaseConnectDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [measurementId, setMeasurementId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setFirestoreConnected = useAppStore((state) => state.setFirestoreConnected);
  
  const handleConnect = () => {
    if (!apiKey || !projectId || !appId) {
      toast.error("API Key, Project ID, and App ID are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the Firebase config object
      const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId
      };
      
      // Update Zustand state first (will be overwritten on reload)
      setFirestoreConnected(true);
      
      // Reinitialize Firebase with the new config
      const success = reinitializeFirebase(firebaseConfig);
      
      if (success) {
        toast.success("Successfully connected to Firebase");
        onOpenChange(false);
      } else {
        toast.error("Failed to connect to Firebase");
      }
    } catch (error) {
      console.error("Error connecting to Firebase:", error);
      toast.error("Failed to connect to Firebase");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/10 sm:max-w-[500px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Connect to Firebase</DialogTitle>
            <DialogDescription>
              Enter your Firebase configuration details to enable real-time sync
            </DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="space-y-4 py-2"
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
              <Label htmlFor="apiKey">API Key (required)</Label>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your Firebase API Key"
                  className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                />
              </motion.div>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="authDomain">Auth Domain</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="authDomain"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="your-app.firebaseapp.com"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="projectId">Project ID (required)</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="your-project-id"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="storageBucket">Storage Bucket</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="storageBucket"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="your-app.appspot.com"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="messagingSenderId"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="123456789012"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label htmlFor="appId">App ID (required)</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="appId"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789012:web:abcdef1234567890"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Label htmlFor="measurementId">Measurement ID</Label>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Input
                    id="measurementId"
                    value={measurementId}
                    onChange={(e) => setMeasurementId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="glass-input transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          
          <DialogFooter>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="glass-input border-white/10 transition-all duration-200"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleConnect}
                disabled={isSubmitting || !apiKey || !projectId || !appId}
                className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-all duration-300"
              >
                {isSubmitting ? "Connecting..." : "Connect"}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};