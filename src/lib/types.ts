
export interface Member {
  id: string;
  name: string;
  avatarColor?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // member ID
  participants: string[]; // array of member IDs
  date: string; // ISO string
  split: SplitType;
  customSplits?: Record<string, number>; // memberID: amount
  createdAt: string; // ISO string
  description?: string;
}

export type SplitType = 'equal' | 'percentage' | 'amount';

export interface Session {
  id: string;
  pin: string;
  title: string;
  createdAt: string; // ISO string
  members: Member[];
  expenses: Expense[];
  currency: string;
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
