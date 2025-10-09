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
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Member, SplitType, Expense } from "@/lib/types";
import { useAppStore } from "@/lib/store";
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

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onOpenChange,
  members,
  expense,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSplitError, setCustomSplitError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateExpense, removeExpense, categories } = useAppStore();
  
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
    if (!expense) return;
    
    setIsSubmitting(true);

    if (data.split !== 'equal' && !validateCustomSplits()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      updateExpense(expense.id, {
        ...data,
        amount: parseFloat(data.amount.toString()),
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
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Edit Expense</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Modify the details of this expense
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          
          <div className="px-4 sm:px-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="amount"
                  rules={{ 
                    required: "Amount is required",
                    min: { value: 0.01, message: "Amount must be greater than 0" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
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
                      
                                    <FormField
                                      control={form.control}
                                      name="categoryId"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Category</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger className="glass-input">
                                                <SelectValue placeholder="Select a category" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                  <span className="flex items-center">
                                                    <span className="mr-2">{category.icon}</span>
                                                    <span>{category.name}</span>
                                                  </span>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                      
                  <FormField
                    control={form.control}
                    name="paidBy"
                    rules={{ required: "Payer is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid By</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="glass-input">
                              <SelectValue placeholder="Select payer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Members</SelectLabel>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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
                          <PopoverContent className="w-auto p-0 bg-card" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="split"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Split Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="How to split the expense" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="equal">Equal Split</SelectItem>
                          <SelectItem value="percentage">By Percentage</SelectItem>
                          <SelectItem value="amount">By Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="participants"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Participants</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {members.map((member) => (
                          <FormField
                            key={member.id}
                            control={form.control}
                            name="participants"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 glass-input"
                                >
                                  <FormControl>
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
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {member.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {splitType !== 'equal' && participants.length > 0 && (
                  <div className="space-y-4 rounded-md p-4 glass-input">
                    <h4 className="font-medium">
                      Split by {splitType === 'percentage' ? 'Percentage' : 'Amount'}
                    </h4>
                    <div className="space-y-2">
                      {members
                        .filter(m => participants.includes(m.id))
                        .map(member => (
                          <div key={member.id} className="flex items-center gap-2">
                            <Label className="w-1/2">{member.name}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              className="glass-input"
                              placeholder={splitType === 'percentage' ? '%' : '$'}
                              value={form.getValues('customSplits')?.[member.id] || ''}
                              onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                            />
                          </div>
                        ))}
                    </div>
                    {customSplitError && <p className="text-sm text-red-500">{customSplitError}</p>}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add details about this expense..." 
                          className="glass-input resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity text-white"
                    >
                      {isSubmitting ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense "{expense.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExpense}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditExpenseDialog;