
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import SessionCard from "@/components/SessionCard";
import { useAppStore } from "@/lib/store";

const AllSessions = () => {
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  
  const handleSelectSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Logo />
        </div>
        <Button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </header>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold">Your Sessions</h2>
          <Separator className="flex-1 ml-4" />
        </div>
      </div>
      
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-6">
            You don't have any sessions yet
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Session
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={handleSelectSession}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AllSessions;
