import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowDownUp, Calendar as CalendarIcon } from "lucide-react";
import { useAppStore } from "@/lib/store/index";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";

interface FilterSortProps {
  filters: {
    sort: string;
    category: string;
    dateRange: DateRange;
    amountRange: { min?: number; max?: number };
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

const FilterSort: React.FC<FilterSortProps> = ({ filters, setFilters }) => {
  const categories = useAppStore((state) => state.categories);

  const handleSortChange = (value: string) => {
    setFilters((prev: any) => ({ ...prev, sort: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFilters((prev: any) => ({ ...prev, category: value }));
  };

  const handleDateChange = (range: DateRange | undefined) => {
    if (range) {
      setFilters((prev: any) => ({ ...prev, dateRange: range }));
    }
  };

  const handleAmountChange = (key: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters((prev: any) => ({ 
      ...prev, 
      amountRange: { ...prev.amountRange, [key]: numValue } 
    }));
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <motion.h3 
        className="text-lg font-medium"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Expenses
      </motion.h3>
      <DropdownMenu>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="group">
              <motion.div
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Filter className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
              </motion.div>
              Filter / Sort
            </Button>
          </DropdownMenuTrigger>
        </motion.div>
        <DropdownMenuContent align="end" className="w-80 p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DropdownMenuLabel>Filter & Sort</DropdownMenuLabel>
          </motion.div>
          <DropdownMenuSeparator />
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label className="text-sm font-medium">Sort by</Label>
            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <AnimatePresence>
                  {[
                    { value: "date-desc", label: "Date (Newest first)" },
                    { value: "date-asc", label: "Date (Oldest first)" },
                    { value: "amount-desc", label: "Amount (High to low)" },
                    { value: "amount-asc", label: "Amount (Low to high)" }
                  ].map((item, index) => (
                    <motion.div
                      key={item.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <SelectItem value={item.value}>{item.label}</SelectItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SelectContent>
            </Select>
          </motion.div>

          <DropdownMenuSeparator />

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Label className="text-sm font-medium">Category</Label>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SelectItem value="all">All Categories</SelectItem>
                </motion.div>
                <AnimatePresence>
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <SelectItem value={category.id}>{category.name}</SelectItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Label className="text-sm font-medium">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Label className="text-sm font-medium">Amount Range</Label>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Input 
                  type="number" 
                  placeholder="Min"
                  value={filters.amountRange.min || ""}
                  onChange={(e) => handleAmountChange("min", e.target.value)}
                  className="transition-all duration-200"
                />
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.amountRange.max || ""}
                  onChange={(e) => handleAmountChange("max", e.target.value)}
                  className="transition-all duration-200"
                />
              </motion.div>
            </div>
          </motion.div>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterSort;