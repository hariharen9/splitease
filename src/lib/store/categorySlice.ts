
import { StateCreator } from 'zustand';
import { Category } from '../types';

const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎉' },
  { id: 'other', name: 'Other', icon: '🤷' },
];

export interface CategorySlice {
  categories: Category[];
}

export const createCategorySlice: StateCreator<
  CategorySlice,
  [],
  [],
  CategorySlice
> = () => ({
  categories: defaultCategories,
});
