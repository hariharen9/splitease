
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

const ResponsiveDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useMobile();
  const DialogComponent = isMobile ? Drawer : Dialog;
  return <DialogComponent {...props}>{children}</DialogComponent>;
};

const ResponsiveDialogContent = ({ children, ...props }: React.ComponentProps<typeof DialogContent>) => {
  const isMobile = useMobile();
  const ContentComponent = isMobile ? DrawerContent : DialogContent;
  return <ContentComponent {...props}>{children}</ContentComponent>;
};

const ResponsiveDialogHeader = ({ children, ...props }: React.ComponentProps<typeof DialogHeader>) => {
  const isMobile = useMobile();
  const HeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  return <HeaderComponent {...props}>{children}</HeaderComponent>;
};

const ResponsiveDialogTitle = ({ children, ...props }: React.ComponentProps<typeof DialogTitle>) => {
  const isMobile = useMobile();
  const TitleComponent = isMobile ? DrawerTitle : DialogTitle;
  return <TitleComponent {...props}>{children}</TitleComponent>;
};

const ResponsiveDialogDescription = ({ children, ...props }: React.ComponentProps<typeof DialogDescription>) => {
  const isMobile = useMobile();
  const DescriptionComponent = isMobile ? DrawerDescription : DialogDescription;
  return <DescriptionComponent {...props}>{children}</DescriptionComponent>;
};

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
