import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Activity as ActivityIcon } from "lucide-react";

interface ActivityTabProps {
  activities: Activity[];
}

const ActivityTab: React.FC<ActivityTabProps> = ({ activities }) => {
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "expense_added":
        return "💰";
      case "expense_removed":
        return "💸";
      case "member_added":
        return "👤";
      case "member_removed":
        return "👋";
      case "settlement_completed":
        return "✅";
      case "session_created":
        return "🎉";
      case "session_updated":
        return "📝";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "expense_added":
        return "bg-green-500/20 text-green-400";
      case "expense_removed":
        return "bg-red-500/20 text-red-400";
      case "member_added":
        return "bg-blue-500/20 text-blue-400";
      case "member_removed":
        return "bg-orange-500/20 text-orange-400";
      case "settlement_completed":
        return "bg-purple-500/20 text-purple-400";
      case "session_created":
        return "bg-yellow-500/20 text-yellow-400";
      case "session_updated":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 pr-4">
        {sortedActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-panel border-white/10">
              <CardContent className="p-6 text-center">
                <motion.div 
                  className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white w-12 h-12 flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <ActivityIcon className="h-6 w-6" />
                </motion.div>
                <p className="text-muted-foreground">No activity yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Activities will appear here as you use the app
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          sortedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <motion.div 
                      className="text-2xl pt-0.5"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: index * 0.1
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <motion.p 
                          className="font-medium truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {activity.description}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge className={`ml-2 ${getActivityColor(activity.type)}`}>
                            {activity.type.replace("_", " ")}
                          </Badge>
                        </motion.div>
                      </div>
                      <motion.p 
                        className="text-sm text-muted-foreground mt-1 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </motion.p>
                      {activity.details && (
                        <motion.div 
                          className="mt-2 text-sm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          {activity.type === "expense_added" && activity.details.expense && (
                            <div className="text-muted-foreground">
                              <p>Amount: {activity.details.expense.amount.toFixed(2)}</p>
                              <p>Participants: {activity.details.participantsCount}</p>
                            </div>
                          )}
                          {activity.type === "settlement_completed" && (
                            <div className="text-muted-foreground">
                              <p>Amount: {activity.details.amount.toFixed(2)} {activity.details.currency}</p>
                            </div>
                          )}
                          {activity.type === "member_added" && (
                            <div className="text-muted-foreground">
                              <p>Member ID: {activity.details.memberId}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default ActivityTab;