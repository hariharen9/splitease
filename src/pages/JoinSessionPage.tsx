import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const JoinSessionPage = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const joinSession = useAppStore((state) => state.joinSession);

  useEffect(() => {
    const handleJoin = async () => {
      if (pin) {
        try {
          const session = await joinSession(pin);
          if (session) {
            toast.success(`Joined "${session.title}"`);
            navigate(`/session/${session.id}`, { replace: true });
          } else {
            toast.error('Invalid PIN. Session not found');
            navigate('/', { replace: true });
          }
        } catch (error) {
          toast.error('Failed to join session');
          console.error(error);
          navigate('/', { replace: true });
        }
      }
    };

    handleJoin();
  }, [pin, joinSession, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <motion.div
        className="text-center p-8 rounded-2xl glass-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-6"
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-semibold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Joining Session
        </motion.h2>
        
        <motion.p 
          className="text-muted-foreground mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Please wait while we connect you to the session...
        </motion.p>
        
        {pin && (
          <motion.p 
            className="text-sm text-muted-foreground font-mono bg-secondary/50 p-2 rounded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            PIN: {pin}
          </motion.p>
        )}
        
        <motion.div
          className="mt-6 h-1 w-24 bg-secondary rounded-full overflow-hidden mx-auto"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default JoinSessionPage;