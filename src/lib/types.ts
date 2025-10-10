export type SplitType = "equal" | "percentage" | "amount";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  gender?: 'male' | 'female'; // Optional for backward compatibility
  avatarUrl?: string; // Optional for backward compatibility
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  participants: string[];
  split: SplitType;
  categoryId: string;
  description?: string;
  customSplits?: Record<string, number>;
  createdAt: string;
}

export interface Session {
  id: string;
  pin: string;
  title: string;
  createdAt: string; // ISO string
  members: Member[];
  expenses: Expense[];
  currency: string;
  settlementsCompleted?: Settlement[]; // Track completed settlements
  activities?: Activity[]; // Track session activities
}

export interface Balance {
  memberId: string;
  amount: number; // positive: receives money, negative: owes money
}

export interface Settlement {
  from: string; // member ID
  to: string; // member ID
  amount: number;
}

export interface Activity {
  id: string;
  type: 'expense_added' | 'expense_removed' | 'expense_updated' | 'member_added' | 'member_removed' | 'settlement_completed' | 'session_created' | 'session_updated';
  timestamp: string; // ISO string
  description: string;
  details: any; // Type-specific details
  userId?: string; // If we want to track which user performed the action
}