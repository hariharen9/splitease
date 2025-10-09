
import { StateCreator } from 'zustand';
import { Expense } from '../types';
import { generateId } from '../utils';
import * as firestoreService from '../firestore';
import { SessionSlice } from './sessionSlice';

export interface ExpenseSlice {
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
}

export const createExpenseSlice: StateCreator<
  SessionSlice & ExpenseSlice,
  [],
  [],
  ExpenseSlice
> = (set, get) => ({
  addExpense: async (expense) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    let newExpenseId = generateId();
    while (session.expenses.some((e) => e.id === newExpenseId)) {
      newExpenseId = generateId();
    }

    const newExpense: Expense = {
      id: newExpenseId,
      createdAt: new Date().toISOString(),
      ...expense,
    };

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.addExpenseToSession(currentPin, newExpense);
      } catch (error) {
        console.error('Error adding expense in Firestore:', error);
        throw error;
      }
    } else {
      const sessions = get().sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, expenses: [...s.expenses, newExpense] }
          : s
      );
      set({ sessions });
    }
  },
  removeExpense: async (id) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const updatedExpenses = session.expenses.filter((e) => e.id !== id);

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionExpenses(currentPin, updatedExpenses);
      } catch (error) {
        console.error('Error removing expense in Firestore:', error);
        throw error;
      }
    } else {
      const sessions = get().sessions.map((s) =>
        s.id === currentSessionId ? { ...s, expenses: updatedExpenses } : s
      );
      set({ sessions });
    }
  },
  updateExpense: async (id, expenseUpdates) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const updatedExpenses = session.expenses.map((e) =>
      e.id === id ? { ...e, ...expenseUpdates } : e
    );

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionExpenses(currentPin, updatedExpenses);
      } catch (error) {
        console.error('Error updating expense in Firestore:', error);
      }
    }

    const sessions = get().sessions.map((s) =>
      s.id === currentSessionId ? { ...s, expenses: updatedExpenses } : s
    );
    set({ sessions });
  },
});

import { useAppStore } from './index';
