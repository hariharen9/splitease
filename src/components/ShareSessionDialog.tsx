
import React from "react";
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
import { Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppStore } from "@/lib/store/index";

interface ShareSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareSessionDialog: React.FC<ShareSessionDialogProps> = ({ open, onOpenChange }) => {
  const currentPin = useAppStore((state) => state.currentSessionPin);
  const shareUrl = `${window.location.origin}/join/${currentPin}`;

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
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
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Share Session</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Anyone with this link or QR code can join the session.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <QRCodeSVG value={shareUrl} size={160} />
          <div className="flex items-center space-x-2 w-full">
            <Input value={shareUrl} readOnly />
            <Button type="button" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" onClick={handleShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share via...
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default ShareSessionDialog;
