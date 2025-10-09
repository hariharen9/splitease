import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Share2, QrCode, Link, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppStore } from "@/lib/store/index";

interface ShareSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({ open, onOpenChange }) => {
  const [copied, setCopied] = useState(false);
  const currentPin = useAppStore((state) => state.currentSessionPin);
  const shareUrl = `${window.location.origin}/join/${currentPin}`;

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy link.");
      });
    } else {
      // Fallback for browsers that don't support the modern clipboard API
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Link copied to clipboard!");
        } else {
          toast.error("Failed to copy link.");
        }
      } catch (err) {
        console.error("Fallback copy failed: ", err);
        toast.error("Failed to copy link.");
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Splitease Session",
          text: "Click the link to join the expense sharing session.",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
      toast.info("Web Share not supported, link copied instead.");
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
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
                  <Share2 className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <ResponsiveDialogTitle>Share Session</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    Anyone with this link or QR code can join the session.
                  </ResponsiveDialogDescription>
                </div>
              </div>
            </ResponsiveDialogHeader>
          </motion.div>
          
          <motion.div
            className="flex flex-col items-center justify-center p-4 space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="bg-white p-4 rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <QRCodeSVG value={shareUrl} size={160} />
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-2 w-full"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Input value={shareUrl} readOnly className="glass-input" />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={handleCopy}
                  className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
                >
                  {copied ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="button" 
                  onClick={handleShare} 
                  className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full glass-input"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
              </motion.div>
            </div>
            
            <motion.div
              className="text-center p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-white/10 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Session PIN</span>
              </div>
              <div className="font-mono text-lg font-bold tracking-wider">
                {currentPin}
              </div>
            </motion.div>
          </motion.div>
        </ResponsiveDialogContent>
      </motion.div>
    </ResponsiveDialog>
  );
};

export default ShareSessionDialog;