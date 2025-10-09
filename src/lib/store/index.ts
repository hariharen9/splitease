import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionSlice, createSessionSlice } from './sessionSlice';
import { MemberSlice, createMemberSlice } from './memberSlice';
import { ExpenseSlice, createExpenseSlice } from './expenseSlice';
import { CategorySlice, createCategorySlice } from './categorySlice';
import { UiSlice, createUiSlice } from './uiSlice';
import { CalculationSlice, createCalculationSlice } from './calculationSlice';

export type AppState = SessionSlice & MemberSlice & ExpenseSlice & CategorySlice & UiSlice & CalculationSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createSessionSlice(...a),
      ...createMemberSlice(...a),
      ...createExpenseSlice(...a),
      ...createCategorySlice(...a),
      ...createUiSlice(...a),
      ...createCalculationSlice(...a),
    }),
    {
      name: 'splitease-storage',
    }
  )
);