import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Trash2, Edit, DollarSign, Tag, User, Users } from "lucide-react";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { Member, SplitType, Expense } from "@/lib/types";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  expense: Expense | null;
  onComplete: () => void;
  currency?: string;
}

interface FormValues {
  title: string;
  amount: number | undefined;
  paidBy: string;
  participants: string[];
  date: Date;
  split: SplitType;
  categoryId: string;
  description?: string;
  customSplits?: Record<string, number>;
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onOpenChange,
  members,
  expense,
  onComplete,
  currency = "INR"
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSplitError, setCustomSplitError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateExpense, removeExpense, categories } = useAppStore();
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      amount: undefined,
      paidBy: members.length > 0 ? members[0].id : "",
      participants: members.map(m => m.id),
      date: new Date(),
      split: "equal",
      categoryId: "other",
      description: "",
      customSplits: {}
    }
  });
  
  const splitType = useWatch({ control: form.control, name: "split" });
  const participants = useWatch({ control: form.control, name: "participants" });
  const amount = useWatch({ control: form.control, name: "amount" });

  // Reset form when expense changes
  useEffect(() => {
    if (expense && open) {
      form.reset({
        title: expense.title,
        amount: expense.amount,
        paidBy: expense.paidBy,
        participants: expense.participants,
        date: new Date(expense.date),
        split: expense.split,
        categoryId: expense.categoryId,
        description: expense.description || "",
        customSplits: expense.customSplits || {}
      });
    }
  }, [expense, open, form]);

  const handleCustomSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentSplits = form.getValues('customSplits') || {};
    const updatedSplits = { ...currentSplits, [memberId]: numValue };
    
    // For percentage splits, auto-distribute remaining percentage among other participants
    if (splitType === "percentage") {
      const totalEntered = Object.values(updatedSplits).reduce((sum, val) => sum + val, 0);
      const enteredCount = Object.keys(updatedSplits).length;
      const participantCount = participants.length;
      
      // If we haven't entered values for all participants yet, don't auto-distribute
      if (enteredCount < participantCount) {
        form.setValue('customSplits', updatedSplits);
        return;
      }
      
      // If total is exactly 100, just update the value
      if (Math.abs(totalEntered - 100) < 0.01) {
        form.setValue('customSplits', updatedSplits);
        return;
      }
      
      // If only one participant left to fill, calculate their value
      const unfilledParticipants = participants.filter(id => !(id in updatedSplits) || updatedSplits[id] === 0);
      if (unfilledParticipants.length === 1) {
        const remaining = 100 - totalEntered + numValue; // Add back the current value since we're recalculating
        updatedSplits[unfilledParticipants[0]] = Math.max(0, remaining);
        form.setValue('customSplits', updatedSplits);
        return;
      }
    }
    
    form.setValue('customSplits', updatedSplits);
  };

  const validateCustomSplits = () => {
    const customSplits = form.getValues('customSplits') || {};
    const total = Object.values(customSplits).reduce((sum, val) => sum + val, 0);

    if (splitType === 'percentage') {
      if (Math.abs(total - 100) > 0.01) {
        setCustomSplitError(`Percentages must add up to 100%. Current total: ${total.toFixed(2)}%`);
        return false;
      }
    } else if (splitType === 'amount') {
      if (Math.abs(total - amount) > 0.01) {
        setCustomSplitError(`Amounts must add up to the total expense of ${getCurrencySymbol(currency)}${amount.toFixed(2)}. Current total: ${getCurrencySymbol(currency)}${total.toFixed(2)}`);
        return false;
      }
    }
    
    setCustomSplitError(null);
    return true;
  };
  
  // Real-time validation as users type
  useEffect(() => {
    if (splitType !== 'equal') {
      validateCustomSplits();
    } else {
      setCustomSplitError(null);
    }
  }, [form.watch('customSplits'), amount, splitType]);
  
  const onSubmit = (data: FormValues) => {
    if (!expense) return;
    
    setIsSubmitting(true);

    if (data.split !== 'equal' && !validateCustomSplits()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      updateExpense(expense.id, {
        ...data,
        amount: data.amount || 0, // Handle undefined amount
        date: data.date.toISOString(),
      });
      
      toast.success("Expense updated successfully");
      form.reset();
      onComplete();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteExpense = async () => {
    if (!expense) return;
    
    try {
      await removeExpense(expense.id);
      toast.success("Expense deleted successfully");
      onComplete();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };
  
  if (!expense) return null;
  
  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <ResponsiveDialogContent className="sm:max-w-lg max-w-[95vw] mx-auto">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ResponsiveDialogHeader>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <ResponsiveDialogTitle>Edit Expense</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                      Modify the details of this expense
                    </ResponsiveDialogDescription>
                  </div>
                </div>
              </ResponsiveDialogHeader>
            </motion.div>
            
            <motion.div
              className="px-2 sm:px-0 max-h-[70vh] overflow-y-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 pb-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      rules={{ required: "Title is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Title
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Dinner, Groceries, etc." 
                              className="glass-input"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="amount"
                      rules={{ 
                        required: "Amount is required",
                        min: { value: 0.01, message: "Amount must be greater than 0" }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Amount
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {getCurrencySymbol(currency)}
                              </span>
                              <Input 
                                type="number"
                                step="0.01"
                                className="glass-input pl-7" 
                                placeholder="0.00"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  {/* Date and Paid By in the same row */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  >
                    <div>
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              Date
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "glass-input pl-3 text-left font-normal w-full text-sm sm:text-base",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "MMM d, yyyy")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                  className="text-sm"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="paidBy"
                        rules={{ required: "Please select who paid" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Paid By
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="glass-input w-full text-sm sm:text-base">
                                  <SelectValue placeholder="Select payer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id} className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                        style={{ backgroundColor: member.avatarColor }}
                                      >
                                        {member.name.charAt(0)}
                                      </div>
                                      <span className="truncate">{member.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Participants
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-1">
                        {members.map((member) => (
                          <motion.div
                            key={member.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="border rounded-lg p-2 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <FormField
                              control={form.control}
                              name="participants"
                              render={({ field }) => {
                                return (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`participant-${member.id}`}
                                      checked={field.value?.includes(member.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, member.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== member.id
                                              )
                                            );
                                      }}
                                    />
                                    <Label 
                                      htmlFor={`participant-${member.id}`} 
                                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                    >
                                      {member.avatarUrl ? (
                                        <img 
                                          src={`${member.avatarUrl}?${member.id}`} 
                                          alt={member.name} 
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                          style={{ backgroundColor: member.avatarColor }}
                                        >
                                          {member.name.charAt(0)}
                                        </div>
                                      )}
                                      <span className="truncate">{member.name}</span>
                                    </Label>
                                  </div>
                                );
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </FormItem>
                  </motion.div>
                  
                  {/* Custom Split Inputs - Only shown when percentage or amount split is selected */}
                  <AnimatePresence>
                    {splitType !== "equal" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <h4 className="font-medium mb-2">
                            {splitType === "percentage" ? "Percentage Split" : "Amount Split"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {splitType === "percentage" 
                              ? "Enter the percentage for each participant" 
                              : "Enter the amount for each participant"}
                          </p>
                          
                          {splitType === "amount" && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-3 p-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-md"
                            >
                              <p className="text-sm font-medium text-center">
                                Total expense amount: <span className="font-bold">{getCurrencySymbol(currency)}{amount.toFixed(2)}</span>
                              </p>
                            </motion.div>
                          )}
                          
                          <div className="space-y-2">
                            {participants.map((participantId) => {
                              const participant = members.find(m => m.id === participantId);
                              if (!participant) return null;
                              
                              const currentValue = form.getValues('customSplits')?.[participantId] || "";
                              
                              return (
                                <motion.div
                                  key={participantId}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                                    style={{ backgroundColor: participant.avatarColor }}
                                  >
                                    {participant.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm truncate">{participant.name}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Input
                                      type="number"
                                      step={splitType === "percentage" ? "0.1" : "0.01"}
                                      placeholder={splitType === "percentage" ? "0.0%" : `${getCurrencySymbol(currency)}0.00`}
                                      className="glass-input w-24 text-right text-sm"
                                      onChange={(e) => {
                                        handleCustomSplitChange(participantId, e.target.value);
                                      }}
                                      value={currentValue}
                                    />
                                    <span className="ml-1 text-sm text-muted-foreground">
                                      {splitType === "percentage" ? "%" : ""}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                          
                          {customSplitError && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-red-400 mt-2"
                            >
                              {customSplitError}
                            </motion.p>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {splitType === "percentage" ? "Total Percentage:" : "Total Amount:"}
                              </span>
                              <span className={
                                splitType === "percentage" 
                                  ? (Math.abs(Object.values(form.getValues('customSplits') || {}).reduce((sum, val) => sum + val, 0) - 100) < 0.01 
                                      ? "font-medium text-green-400" 
                                      : "font-medium text-red-400")
                                  : (Math.abs(Object.values(form.getValues('customSplits') || {}).reduce((sum, val) => sum + val, 0) - amount) < 0.01 
                                      ? "font-medium text-green-400" 
                                      : "font-medium text-red-400")
                              }>
                                {splitType === "percentage" 
                                  ? `${Object.values(form.getValues('customSplits') || {}).reduce((sum, val) => sum + val, 0).toFixed(2)}%`
                                  : `${getCurrencySymbol(currency)}${Object.values(form.getValues('customSplits') || {}).reduce((sum, val) => sum + val, 0).toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {splitType === "percentage" ? "Required:" : "Required:"}
                              </span>
                              <span className="font-medium">
                                {splitType === "percentage" ? "100%" : `${getCurrencySymbol(currency)}${amount.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <FormField
                      control={form.control}
                      name="split"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Split Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass-input text-sm sm:text-base">
                                <SelectValue placeholder="Select split type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Split Options</SelectLabel>
                                <SelectItem value="equal" className="text-sm">Equal Split</SelectItem>
                                <SelectItem value="percentage" className="text-sm">Percentage Split</SelectItem>
                                <SelectItem value="amount" className="text-sm">Custom Amount Split</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass-input text-sm sm:text-base">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Categories</SelectLabel>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id} className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span>{category.icon}</span>
                                      <span>{category.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any details about this expense..."
                              className="glass-input resize-none text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <div className="flex gap-2">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="flex-1 pb-4 sm:pb-0"
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-sm sm:text-base h-10 sm:h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block mr-2"
                          >
                            ↻
                          </motion.span>
                        ) : null}
                        {isSubmitting ? "Updating..." : "Update Expense"}
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.1 }}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-10 sm:h-12 px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </Form>
            </motion.div>
          </ResponsiveDialogContent>
        </motion.div>
      </ResponsiveDialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteExpense}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditExpenseDialog;