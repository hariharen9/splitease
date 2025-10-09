import * as React from "react";
import { useMobile } from "@/hooks/use-mobile";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";

const ResponsiveDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useMobile();
  const DialogComponent = isMobile ? Drawer : Dialog;
  return (
    <AnimatePresence>
      <DialogComponent {...props}>
        {children}
      </DialogComponent>
    </AnimatePresence>
  );
};

const ResponsiveDialogContent = ({ children, ...props }: React.ComponentProps<typeof DialogContent>) => {
  const isMobile = useMobile();
  const ContentComponent = isMobile ? DrawerContent : DialogContent;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <ContentComponent {...props}>
        {children}
      </ContentComponent>
    </motion.div>
  );
};

const ResponsiveDialogHeader = ({ children, ...props }: React.ComponentProps<typeof DialogHeader>) => {
  const isMobile = useMobile();
  const HeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <HeaderComponent {...props}>
        {children}
      </HeaderComponent>
    </motion.div>
  );
};

const ResponsiveDialogTitle = ({ children, ...props }: React.ComponentProps<typeof DialogTitle>) => {
  const isMobile = useMobile();
  const TitleComponent = isMobile ? DrawerTitle : DialogTitle;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <TitleComponent {...props}>
        {children}
      </TitleComponent>
    </motion.div>
  );
};

const ResponsiveDialogDescription = ({ children, ...props }: React.ComponentProps<typeof DialogDescription>) => {
  const isMobile = useMobile();
  const DescriptionComponent = isMobile ? DrawerDescription : DialogDescription;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <DescriptionComponent {...props}>
        {children}
      </DescriptionComponent>
    </motion.div>
  );
};

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};