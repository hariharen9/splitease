
import { StateCreator } from 'zustand';
import { Settlement } from '../types';
import { SessionSlice } from './sessionSlice';

export interface CalculationSlice {
  calculateBalances: () => Record<string, number>;
  calculateSettlements: () => Settlement[];
}

export const createCalculationSlice: StateCreator<
  SessionSlice & CalculationSlice,
  [],
  [],
  CalculationSlice
> = (set, get) => ({
  calculateBalances: () => {
    const session = get().getCurrentSession();
    if (!session) return {};

    const balances: Record<string, number> = {};
    session.members.forEach((member) => {
      balances[member.id] = 0;
    });

    session.expenses.forEach((expense) => {
      const payer = expense.paidBy;
      const participants = expense.participants;
      if (!payer || participants.length === 0) return;

      const expenseAmount = Math.round(expense.amount * 100);
      balances[payer] = (balances[payer] * 100 + expenseAmount) / 100;

      if (expense.split === 'equal') {
        const amountPerPerson = Math.round(expenseAmount / participants.length) / 100;
        participants.forEach((participantId) => {
          balances[participantId] = (balances[participantId] * 100 - amountPerPerson * 100) / 100;
        });
      } else if (expense.customSplits) {
        Object.entries(expense.customSplits).forEach(([memberId, splitValue]) => {
          if (expense.split === 'percentage') {
            const amountToSubtract = Math.round(expenseAmount * (splitValue / 100)) / 100;
            balances[memberId] = (balances[memberId] * 100 - amountToSubtract * 100) / 100;
          } else { // amount
            const amountToSubtract = Math.round(splitValue * 100) / 100;
            balances[memberId] = (balances[memberId] * 100 - amountToSubtract * 100) / 100;
          }
        });
      }
    });

    for (const memberId in balances) {
      balances[memberId] = Math.round(balances[memberId] * 100) / 100;
    }

    return balances;
  },
  calculateSettlements: () => {
    const session = get().getCurrentSession();
    if (!session) return [];

    const balances = get().calculateBalances();
    const completedSettlements = session.settlementsCompleted || [];

    completedSettlements.forEach((settlement) => {
      balances[settlement.from] += settlement.amount;
      balances[settlement.to] -= settlement.amount;
    });

    const debtors = Object.entries(balances)
      .filter(([, amount]) => amount < 0)
      .map(([id, amount]) => ({ id, amount: -amount }));

    const creditors = Object.entries(balances)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => ({ id, amount }));

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => a.amount - b.amount);

    const settlements: Settlement[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 1e-9) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: amount,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 1e-9) {
        i++;
      }
      if (creditor.amount < 1e-9) {
        j++;
      }
    }

    return settlements;
  },
});
