
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
      <h3 className="text-lg font-medium">Expenses</h3>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter / Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-4 space-y-4">
          <DropdownMenuLabel>Filter & Sort</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div>
            <Label className="text-sm font-medium">Sort by</Label>
            <Select value={filters.sort} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest first)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to high)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenuSeparator />

          <div>
            <Label className="text-sm font-medium">Category</Label>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
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
          </div>

          <div>
            <Label className="text-sm font-medium">Amount Range</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min"
                value={filters.amountRange.min || ""}
                onChange={(e) => handleAmountChange("min", e.target.value)}
              />
              <Input 
                type="number" 
                placeholder="Max" 
                value={filters.amountRange.max || ""}
                onChange={(e) => handleAmountChange("max", e.target.value)}
              />
            </div>
          </div>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterSort;
