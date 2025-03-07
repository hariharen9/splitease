import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center text-sm text-muted-foreground mt-auto">
      <p className="flex items-center justify-center gap-1">
        Developed with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by{' '}
        <a 
          href="https://www.linkedin.com/in/hariharen9/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium hover:text-primary transition-colors underline underline-offset-4"
        >
          Hariharen
        </a>
      </p>
    </footer>
  );
};

export default Footer;