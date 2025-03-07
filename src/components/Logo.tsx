
import { cn } from "@/lib/utils";
import { Scale } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo = ({ size = "md", className }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  return (
    <div className={cn("flex items-center gap-2 font-medium", className)}>
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end">
        <Scale className="h-5 w-5 text-white" />
      </div>
      <span className={cn("animated-gradient-text font-bold", sizeClasses[size])}>
        SplitEase
      </span>
    </div>
  );
};

export default Logo;
