
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import PinInput from "@/components/PinInput";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";
import { ArrowRight, Plus, Users } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [sessionTitle, setSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const createSession = useAppStore((state) => state.createSession);
  const joinSession = useAppStore((state) => state.joinSession);
  const sessions = useAppStore((state) => state.sessions);
  const setFirestoreConnected = useAppStore((state) => state.setFirestoreConnected);
  const setCurrentSessionId = useAppStore((state) => state.setCurrentSessionId);
  
  // Check Firebase configuration on load
  useEffect(() => {
    const isConfigured = isFirebaseConfigured();
    setFirestoreConnected(isConfigured);
    
    if (isConfigured) {
      console.log("Firebase is properly configured and connected");
    } else {
      console.log("Firebase is not properly configured - using local storage only");
    }
  }, [setFirestoreConnected]);
  
  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const title = sessionTitle.trim() || "Untitled Session";
      const session = await createSession(title);
      toast.success(`Session "${title}" created successfully`);
      navigate(`/session/${session.id}`);
    } catch (error) {
      toast.error("Failed to create session");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinSession = async (pin: string) => {
    setIsJoining(true);
    try {
      const session = await joinSession(pin);
      if (session) {
        toast.success(`Joined "${session.title}"`);
        navigate(`/session/${session.id}`);
      } else {
        toast.error("Invalid PIN. Session not found");
      }
    } catch (error) {
      toast.error("Failed to join session");
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };
  
  const recentSessions = sessions.slice(0, 3);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <Logo size="lg" className="justify-center mb-4" />
        <p className="text-muted-foreground max-w-md">
          Split expenses easily with friends, family, or roommates without signing up
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create">Create Session</TabsTrigger>
            <TabsTrigger value="join">Join Session</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle>Create a new session</CardTitle>
                <CardDescription>
                  Start a new expense tracking session with your group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTitle">Session Name</Label>
                    <Input
                      id="sessionTitle"
                      placeholder="Trip to Paris, Roommates, etc."
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
                  onClick={handleCreateSession}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Session"}
                  <Plus className="ml-1.5 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="join">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle>Join existing session</CardTitle>
                <CardDescription>
                  Enter the 6-digit PIN to join an existing session
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <PinInput 
                  onComplete={handleJoinSession} 
                  disabled={isJoining}
                  className="my-4"
                />
                <p className="text-sm text-muted-foreground mt-4">
                  Ask your friend for the PIN
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {recentSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md mt-8"
        >
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-medium">Recent Sessions</h3>
            <Separator className="flex-1 mx-4" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/sessions")}
              className="text-muted-foreground hover:text-foreground"
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="glass-panel border-white/10 p-3 rounded-lg cursor-pointer"
                onClick={() => {
                  setCurrentSessionId(session.id);
                  navigate(`/session/${session.id}`);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {session.members.length}
                      </span>
                      <span>PIN: {session.pin}</span>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;
