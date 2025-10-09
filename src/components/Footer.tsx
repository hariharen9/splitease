import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <motion.footer 
      className="w-full py-4 text-center text-sm text-muted-foreground mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <motion.p 
        className="flex items-center justify-center gap-1"
        whileHover={{ scale: 1.02 }}
      >
        Developed with{' '}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
        </motion.div>
        {' '}by{' '}
        <motion.a 
          href="https://www.linkedin.com/in/hariharen9/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium hover:text-primary transition-colors underline underline-offset-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Hariharen
        </motion.a>
      </motion.p>
    </motion.footer>
  );
};

export default Footer;