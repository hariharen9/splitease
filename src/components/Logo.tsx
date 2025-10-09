import { cn } from "@/lib/utils";
import { Scale } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div 
      className={cn("flex items-center gap-2 font-medium", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="p-1.5 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end"
        animate={{ 
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Scale className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>
      <motion.span 
        className={cn("animated-gradient-text font-bold", sizeClasses[size])}
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ backgroundSize: '200% 200%' }}
      >
        SplitEase
      </motion.span>
    </motion.div>
  );
};

export default Logo;