
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p>Joining session...</p>
    </div>
  );
};

export default JoinSessionPage;
