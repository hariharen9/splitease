import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { ArrowRight, Plus, Users, Sparkles, Zap, Share2, Globe } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 -z-20"
        animate={{
          background: [
            "radial-gradient(circle at 10% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 20%)",
            "radial-gradient(circle at 20% 80%, rgba(96, 165, 250, 0.1) 0%, transparent 20%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 20%)",
            "radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.1) 0%, transparent 20%), radial-gradient(circle at 30% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 20%)",
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        className="text-center mb-12 relative"
      >
        <Logo size="lg" className="justify-center mb-6" />
        
        <motion.h2 
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Split Expenses Effortlessly
        </motion.h2>
        
        <motion.p 
          className="text-muted-foreground max-w-lg mx-auto text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          The modern way to track shared expenses with friends, family, and roommates
        </motion.p>
        
        {/* Feature highlights */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm">No Signup Required</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-full">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-sm">Real-time Sync</span>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full">
            <Share2 className="h-4 w-4 text-indigo-400" />
            <span className="text-sm">Share via PIN</span>
          </div>
        </motion.div>
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
          
          <AnimatePresence mode="wait">
            <TabsContent value="create" key="create-tab">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
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
                        <motion.div
                          whileFocus={{ scale: 1.02 }}
                          className="relative"
                        >
                          <Input
                            id="sessionTitle"
                            placeholder="Trip to Paris, Roommates, etc."
                            value={sessionTitle}
                            onChange={(e) => setSessionTitle(e.target.value)}
                            className="glass-input pl-10 py-6 text-lg"
                          />
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white py-6 text-lg"
                      onClick={handleCreateSession}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          ↻
                        </motion.span>
                      ) : (
                        <Plus className="mr-2 h-5 w-5" />
                      )}
                      {isCreating ? "Creating..." : "Create Session"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="join" key="join-tab">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
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
                    
                    <Button
                      variant="outline"
                      className="mt-6 w-full py-6 text-lg"
                      onClick={() => {}}
                    >
                      Need Help?
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
      
      {recentSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-md mt-12"
        >
          <div className="flex items-center mb-6">
            <h3 className="text-xl font-semibold">Recent Sessions</h3>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel border-white/10 p-4 rounded-xl cursor-pointer"
                onClick={() => {
                  setCurrentSessionId(session.id);
                  navigate(`/session/${session.id}`);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold truncate">{session.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span className="inline-flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {session.members.length}
                      </span>
                      <span className="font-mono text-xs">••{session.pin.slice(-2)}</span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="text-muted-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
                
                {/* Animated progress bar for expenses */}
                <div className="mt-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, session.expenses.length * 10)}%` }}
                      transition={{ duration: 1, delay: 1.5 + index * 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {session.expenses.length} expenses
                  </p>
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