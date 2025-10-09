import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Expense, Member } from "@/lib/types";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/lib/store/index";

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
  members: Member[];
  currency?: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#0ea5e9"];

const AnalyticsDialog: React.FC<AnalyticsDialogProps> = ({
  open,
  onOpenChange,
  expenses,
  members,
  currency = "INR"
}) => {
  const { categories } = useAppStore();
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  
  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Spending by Category
  const spendingByCategory = useMemo(() => {
    const categoryMap: Record<string, { name: string; icon: string; amount: number }> = {};
    
    expenses.forEach(expense => {
      const categoryId = expense.categoryId;
      const category = categories.find(c => c.id === categoryId) || { id: "other", name: "Other", icon: "💰" };
      
      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          name: category.name,
          icon: category.icon,
          amount: 0
        };
      }
      
      categoryMap[categoryId].amount += expense.amount;
    });
    
    return Object.values(categoryMap)
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories]);
  
  // Spending per Member
  const spendingPerMember = useMemo(() => {
    const memberMap: Record<string, { name: string; avatarColor: string; amount: number }> = {};
    
    // Initialize all members with 0 spending
    members.forEach(member => {
      memberMap[member.id] = {
        name: member.name,
        avatarColor: member.avatarColor,
        amount: 0
      };
    });
    
    // Calculate actual spending
    expenses.forEach(expense => {
      if (memberMap[expense.paidBy]) {
        memberMap[expense.paidBy].amount += expense.amount;
      }
    });
    
    return Object.values(memberMap)
      .filter(member => member.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, members]);
  
  // Expense Timeline (cumulative)
  const expenseTimeline = useMemo(() => {
    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate cumulative amounts
    let cumulativeAmount = 0;
    const timelineData: { date: string; amount: number }[] = [];
    
    sortedExpenses.forEach(expense => {
      cumulativeAmount += expense.amount;
      timelineData.push({
        date: new Date(expense.date).toLocaleDateString(),
        amount: parseFloat(cumulativeAmount.toFixed(2))
      });
    });
    
    return timelineData;
  }, [expenses]);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel border border-white/10 p-3 rounded-lg shadow-lg backdrop-blur-sm bg-white/10">
          <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium text-sm">
                {getCurrencySymbol(currency)}{formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for timeline
  const TimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel border border-white/10 p-3 rounded-lg shadow-lg backdrop-blur-sm bg-white/10">
          <p className="font-semibold text-foreground text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.stroke }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium text-sm">
                {getCurrencySymbol(currency)}{formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Calculate responsive sizes based on screen width
  const getChartHeight = () => {
    if (dimensions.width < 640) return 220; // mobile
    if (dimensions.width < 768) return 256; // tablet
    return 320; // desktop
  };
  
  const getPieChartRadius = () => {
    if (dimensions.width < 640) return 60; // mobile
    if (dimensions.width < 768) return 70; // tablet
    return 90; // desktop
  };
  
  const getXAxisAngle = () => {
    return dimensions.width < 640 ? -60 : -45;
  };
  
  const getXAxisHeight = () => {
    return dimensions.width < 640 ? 60 : 70;
  };
  
  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (dimensions.width < 640) return mobile;
    if (dimensions.width < 768) return tablet;
    return desktop;
  };
  
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <ResponsiveDialogContent className="glass-panel border-white/10 w-[95vw] sm:max-w-4xl mx-auto max-h-[90vh] overflow-y-auto p-0">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ResponsiveDialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                  <div>
                    <ResponsiveDialogTitle className="text-xl sm:text-2xl font-bold">Analytics</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription className="text-muted-foreground text-xs sm:text-sm">
                      Insights into your spending patterns
                    </ResponsiveDialogDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-white/10"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </ResponsiveDialogHeader>
          </motion.div>
          
          <motion.div
            className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Spending by Category */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-panel border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>Spending by Category</span>
                    <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {spendingByCategory.length > 0 ? (
                    <div className="flex flex-col sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="h-56 sm:h-64 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={spendingByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={getPieChartRadius()}
                              fill="#8884d8"
                              dataKey="amount"
                              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                              {spendingByCategory.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  stroke="rgba(255, 255, 255, 0.1)"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={<CustomTooltip />}
                              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto p-1 pr-2">
                        {spendingByCategory.map((category, index) => {
                          const total = spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0);
                          const percentage = (category.amount / total) * 100;
                          
                          return (
                            <motion.div 
                              key={category.name} 
                              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div 
                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg">{category.icon}</span>
                                    <span className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-[150px]">{category.name}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-base sm:text-lg">
                                    {getCurrencySymbol(currency)}{formatCurrency(category.amount, currency)}
                                  </div>
                                </div>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5 sm:h-2">
                                <motion.div 
                                  className="h-1.5 sm:h-2 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: 0.5 + index * 0.05, duration: 0.8 }}
                                />
                              </div>
                              <div className="text-right text-xs text-muted-foreground mt-1">
                                {percentage.toFixed(1)}%
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">📊</div>
                        <p className="text-base sm:text-lg">No category data available</p>
                        <p className="text-xs sm:text-sm mt-1">Add some expenses to see insights</p>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Spending per Member */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-panel border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>Spending per Member</span>
                    <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {spendingPerMember.length > 0 ? (
                    <div className="h-64 sm:h-72 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={spendingPerMember}
                          margin={{ top: 10, right: 10, left: 0, bottom: getXAxisHeight() }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            angle={getXAxisAngle()}
                            textAnchor="end"
                            height={getXAxisHeight()}
                            tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: getFontSize(10, 11, 12) }}
                            tickMargin={5}
                          />
                          <YAxis 
                            tickFormatter={(value) => `${getCurrencySymbol(currency)}${formatCurrency(value, currency)}`}
                            tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: getFontSize(10, 11, 12) }}
                            width={dimensions.width < 640 ? 40 : 60}
                            tickMargin={5}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                          />
                          <Bar 
                            dataKey="amount" 
                            name="Amount"
                            radius={[4, 4, 0, 0]}
                          >
                            {spendingPerMember.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth={1}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">👥</div>
                        <p className="text-base sm:text-lg">No member spending data available</p>
                        <p className="text-xs sm:text-sm mt-1">Add some expenses to see insights</p>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Expense Timeline */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-panel border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span>Expense Timeline</span>
                    <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-pink-500 to-red-600 rounded-full"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {expenseTimeline.length > 0 ? (
                    <div className="h-64 sm:h-72 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={expenseTimeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: dimensions.width < 640 ? 40 : 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: getFontSize(8, 9, 10) }}
                            tickCount={Math.min(expenseTimeline.length, dimensions.width < 640 ? 3 : 6)}
                            tickMargin={5}
                          />
                          <YAxis 
                            tickFormatter={(value) => `${getCurrencySymbol(currency)}${formatCurrency(value, currency)}`}
                            tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: getFontSize(8, 9, 10) }}
                            width={dimensions.width < 640 ? 40 : 60}
                            tickMargin={5}
                          />
                          <Tooltip 
                            content={<TimelineTooltip />}
                            cursor={{ stroke: 'rgba(139, 92, 246, 0.5)', strokeWidth: 1 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            name="Cumulative Amount"
                            stroke="url(#gradient)"
                            strokeWidth={dimensions.width < 640 ? 2 : 4}
                            dot={{ stroke: '#8b5cf6', strokeWidth: dimensions.width < 640 ? 1 : 2, r: dimensions.width < 640 ? 3 : 5, fill: '#1e293b' }}
                            activeDot={{ r: dimensions.width < 640 ? 5 : 8, stroke: '#8b5cf6', strokeWidth: dimensions.width < 640 ? 1 : 2, fill: '#1e293b' }}
                          >
                            <defs>
                              <linearGradient id="gradient" x1="0" y1="0" x2="100%" y2="0">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#d946ef" />
                              </linearGradient>
                            </defs>
                          </Line>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">📈</div>
                        <p className="text-base sm:text-lg">No expense timeline data available</p>
                        <p className="text-xs sm:text-sm mt-1">Add some expenses to see insights</p>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </ResponsiveDialogContent>
      </motion.div>
    </ResponsiveDialog>
  );
};

export default AnalyticsDialog;