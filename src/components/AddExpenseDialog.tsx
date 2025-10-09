import React, { useState, useEffect } from "react";
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
import { CalendarIcon, Plus, DollarSign, Tag, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Member, SplitType } from "@/lib/types";
import { useAppStore } from "@/lib/store/index";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onComplete: () => void;
}

interface FormValues {
  title: string;
  amount: number;
  paidBy: string;
  participants: string[];
  date: Date;
  split: SplitType;
  categoryId: string;
  description?: string;
  customSplits?: Record<string, number>;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onOpenChange,
  members,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSplitError, setCustomSplitError] = useState<string | null>(null);
  const { addExpense, categories } = useAppStore();
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      amount: 0,
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

  useEffect(() => {
    // Reset custom splits when split type changes or dialog reopens
    form.setValue('customSplits', {});
  }, [splitType, open, form]);

  const handleCustomSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentSplits = form.getValues('customSplits') || {};
    form.setValue('customSplits', { ...currentSplits, [memberId]: numValue });
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
        setCustomSplitError(`Amounts must add up to the total expense of $${amount.toFixed(2)}. Current total: $${total.toFixed(2)}`);
        return false;
      }
    }
    
    setCustomSplitError(null);
    return true;
  };
  
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);

    if (data.split !== 'equal' && !validateCustomSplits()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      addExpense({
        ...data,
        amount: parseFloat(data.amount.toString()),
        date: data.date.toISOString(),
      });
      
      toast.success("Expense added successfully");
      form.reset();
      onComplete();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <ResponsiveDialogContent className="sm:max-w-lg">
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
                  <Plus className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <ResponsiveDialogTitle>Add New Expense</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    Enter the details of the expense to split with your group
                  </ResponsiveDialogDescription>
                </div>
              </div>
            </ResponsiveDialogHeader>
          </motion.div>
          
          <motion.div
            className="px-4 sm:px-0"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              $
                            </span>
                            <Input 
                              type="number"
                              step="0.01"
                              className="glass-input pl-7" 
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
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
                                  "glass-input pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
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
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
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
                            <SelectTrigger className="glass-input">
                              <SelectValue placeholder="Select payer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
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
                  transition={{ delay: 0.7 }}
                >
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {members.map((member) => (
                        <motion.div
                          key={member.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <FormField
                            control={form.control}
                            name="participants"
                            render={({ field }) => {
                              return (
                                <Checkbox
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
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                      style={{ backgroundColor: member.avatarColor }}
                                    >
                                      {member.name.charAt(0)}
                                    </div>
                                    <span className="text-sm truncate">{member.name}</span>
                                  </div>
                                </Checkbox>
                              );
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </FormItem>
                </motion.div>
                
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <FormField
                    control={form.control}
                    name="split"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Split Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-input">
                              <SelectValue placeholder="Select split type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Split Options</SelectLabel>
                              <SelectItem value="equal">Equal Split</SelectItem>
                              <SelectItem value="percentage">Percentage Split</SelectItem>
                              <SelectItem value="amount">Custom Amount Split</SelectItem>
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
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-input">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Categories</SelectLabel>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
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
                  transition={{ delay: 1.0 }}
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
                            className="glass-input resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
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
                    {isSubmitting ? "Adding Expense..." : "Add Expense"}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </motion.div>
        </ResponsiveDialogContent>
      </motion.div>
    </ResponsiveDialog>
  );
};

export default AddExpenseDialog;