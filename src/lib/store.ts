import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Expense, Member, Settlement } from './types';
import { generatePin, generateId } from './utils';
import * as firestoreService from './firestore';

interface AppState {
  sessions: Session[];
  currentSessionId: string | null;
  currentSessionPin: string | null;
  isFirestoreConnected: boolean;
  isFirestoreAvailable: boolean; // Real-time connection status
  
  // Firebase connection
  setFirestoreConnected: (connected: boolean) => void;
  setFirestoreAvailable: (available: boolean) => void;
  
  // Session actions
  createSession: (title: string) => Promise<Session>;
  joinSession: (pin: string) => Promise<Session | null>;
  getCurrentSession: () => Session | null;
  updateSessionTitle: (title: string) => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
  syncSessionFromFirestore: (session: Session) => void;
  setCurrentSessionId: (id: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Member actions
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  updateMember: (id: string, name: string) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  
  // Calculations
  calculateBalances: () => Record<string, number>;
  calculateSettlements: () => Settlement[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentSessionPin: null,
      isFirestoreConnected: false,
      isFirestoreAvailable: true, // Default to true, will be updated by connectivity monitoring
      
      setFirestoreConnected: (connected) => {
        set({ isFirestoreConnected: connected });
      },
      
      setFirestoreAvailable: (available) => {
        set({ isFirestoreAvailable: available });
      },
      
      createSession: async (title) => {
        const newSession: Session = {
          id: generateId(),
          pin: generatePin(),
          title: title || 'Untitled Session',
          createdAt: new Date().toISOString(),
          members: [],
          expenses: [],
          currency: "INR",
        };
        
        // If connected to Firestore, save there first
        if (get().isFirestoreConnected) {
          try {
            await firestoreService.createSessionInFirestore(newSession);
          } catch (error) {
            console.error("Failed to create session in Firestore:", error);
            // Fall back to local storage if Firestore fails
          }
        }
        
        // Always update local state
        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: newSession.id,
          currentSessionPin: newSession.pin
        }));
        
        return newSession;
      },
      
      joinSession: async (pin) => {
        // Try to fetch from Firestore first if connected
        if (get().isFirestoreConnected) {
          try {
            const firestoreSession = await firestoreService.getSessionByPin(pin);
            
            if (firestoreSession) {
              // Check if session is marked as deleted
              if ('deleted' in firestoreSession && firestoreSession.deleted) {
                console.log("Session is marked as deleted in Firestore");
                // Remove from local storage if it exists
                set((state) => ({
                  sessions: state.sessions.filter(s => s.pin !== pin)
                }));
                return null;
              }
              
              // Check if we already have this session locally
              const existingSession = get().sessions.find(s => s.pin === pin);
              
              if (!existingSession) {
                // Add to local sessions if not already present
                set((state) => ({
                  sessions: [...state.sessions, firestoreSession],
                  currentSessionId: firestoreSession.id,
                  currentSessionPin: firestoreSession.pin
                }));
              } else {
                // Just set as current if already in local storage
                set({
                  currentSessionId: existingSession.id,
                  currentSessionPin: existingSession.pin
                });
              }
              
              return firestoreSession;
            }
          } catch (error: any) {
            // If it's a "not found" error, continue to check local storage
            if (error?.code !== 'not-found') {
              console.error("Error joining session from Firestore:", error);
            }
            // Fall back to local storage if Firestore fails
          }
        }
        
        // Fall back to check local storage
        const localSession = get().sessions.find(s => s.pin === pin);
        if (localSession) {
          // Check if session is marked as deleted locally
          if ('deleted' in localSession && localSession.deleted) {
            console.log("Session is marked as deleted in local storage");
            // Remove from local storage
            set((state) => ({
              sessions: state.sessions.filter(s => s.pin !== pin)
            }));
            return null;
          }
          
          set({ 
            currentSessionId: localSession.id,
            currentSessionPin: localSession.pin
          });
          return localSession;
        }
        
        return null;
      },
      
      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(s => s.id === currentSessionId) || null;
      },
      
      syncSessionFromFirestore: (session) => {
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === session.id ? session : s
          )
        }));
      },

      setCurrentSessionId: (id) => {
        const session = get().sessions.find(s => s.id === id);
        if (session) {
          set({ currentSessionId: session.id, currentSessionPin: session.pin });
        }
      },
      
      updateSessionTitle: async (title) => {
        const currentSession = get().getCurrentSession();
        const currentPin = get().currentSessionPin;
        
        if (!currentSession) return;
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionTitle(currentPin, title);
          } catch (error) {
            console.error("Error updating session title in Firestore:", error);
          }
        }
      },

      updateCurrency: async (currency) => {
        const currentSession = get().getCurrentSession();
        const currentPin = get().currentSessionPin;
        
        if (!currentSession) return;

        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === currentSession.id ? { ...s, currency } : s
          ),
        }));
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionCurrency(currentPin, currency);
          } catch (error) {
            console.error("Error updating currency in Firestore:", error);
            // Revert state if firestore update fails
            set(state => ({
              sessions: state.sessions.map(s =>
                s.id === currentSession.id ? { ...s, currency: currentSession.currency } : s
              ),
            }));
          }
        }
      },
      
      addMember: async (name) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;
        
        if (!currentSessionId) return;
        
        const newMember: Member = {
          id: generateId(),
          name,
          avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`
        };

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? { ...s, members: [...s.members, newMember] }
              : s
          ),
        }));
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.addMemberToSession(currentPin, newMember);
          } catch (error) {
            console.error("Error adding member in Firestore:", error);
            // Revert state if firestore update fails
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSessionId
                  ? { ...s, members: s.members.filter(m => m.id !== newMember.id) }
                  : s
              ),
            }));
          }
        }
      },
      
      removeMember: async (id) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;

        if (!currentSessionId) return;

        const session = get().getCurrentSession();
        if (!session) return;

        const isMemberInvolvedInExpenses = session.expenses.some(
          (expense) => expense.paidBy === id || expense.participants.includes(id)
        );

        if (isMemberInvolvedInExpenses) {
          throw new Error("This member is involved in expenses and cannot be removed.");
        }

        const updatedMembers = session.members.filter((m) => m.id !== id);

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId ? { ...s, members: updatedMembers } : s
          ),
        }));

        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionMembers(currentPin, updatedMembers);
          } catch (error) {
            console.error("Error removing member in Firestore:", error);
            // Revert state if firestore update fails
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSessionId ? { ...s, members: session.members } : s
              ),
            }));
            throw new Error("Failed to remove member from the session.");
          }
        }
      },
      
      updateMember: async (id, name) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;
        
        if (!currentSessionId) return;
        
        const session = get().getCurrentSession();
        if (!session) return;
        
        const updatedMembers = session.members.map(m => 
          m.id === id ? { ...m, name } : m
        );

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId ? { ...s, members: updatedMembers } : s
          ),
        }));
        
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionMembers(currentPin, updatedMembers);
          } catch (error) {
            console.error("Error updating member in Firestore:", error);
            // Revert state if firestore update fails
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === currentSessionId ? { ...s, members: session.members } : s
              ),
            }));
          }
        }
      },
      
      addExpense: async (expense) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;
        
        if (!currentSessionId) return;
        
        // Get the current session to check for existing expense IDs
        const session = get().getCurrentSession();
        if (!session) return;
        
        let newExpenseId = generateId();
        // Ensure the new ID is unique within the session
        while (session.expenses.some(e => e.id === newExpenseId)) {
          newExpenseId = generateId();
        }
        
        const newExpense: Expense = {
          id: newExpenseId,
          createdAt: new Date().toISOString(),
          ...expense
        };
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.addExpenseToSession(currentPin, newExpense);
            // Don't update local state here - let the Firestore subscription handle it
          } catch (error) {
            console.error("Error adding expense in Firestore:", error);
            throw error; // Re-throw to let the caller handle the error
          }
        } else {
          // If not connected to Firestore, update local state directly
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === currentSessionId
                ? { ...s, expenses: [...s.expenses, newExpense] }
                : s
          )
        }));
        }
      },
      
      removeExpense: async (id) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;
        
        if (!currentSessionId) return;
        
        // Get the current session to update
        const session = get().getCurrentSession();
        if (!session) return;
        
        // Create updated expenses list
        const updatedExpenses = session.expenses.filter(e => e.id !== id);
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionExpenses(currentPin, updatedExpenses);
            // Don't update local state here - let the Firestore subscription handle it
          } catch (error) {
            console.error("Error removing expense in Firestore:", error);
            throw error; // Re-throw to let the caller handle the error
          }
        } else {
          // If not connected to Firestore, update local state directly
          set((state) => ({
            sessions: state.sessions.map(s => 
              s.id === currentSessionId
                ? { ...s, expenses: updatedExpenses }
                : s
            )
          }));
        }
      },
      
      updateExpense: async (id, expenseUpdates) => {
        const currentSessionId = get().currentSessionId;
        const currentPin = get().currentSessionPin;
        
        if (!currentSessionId) return;
        
        // Get the current session to update
        const session = get().getCurrentSession();
        if (!session) return;
        
        // Create updated expenses list
        const updatedExpenses = session.expenses.map(e => 
          e.id === id ? { ...e, ...expenseUpdates } : e
        );
        
        // Update in Firestore if connected
        if (get().isFirestoreConnected && currentPin) {
          try {
            await firestoreService.updateSessionExpenses(currentPin, updatedExpenses);
          } catch (error) {
            console.error("Error updating expense in Firestore:", error);
          }
        }
        
        // Always update local state
        set((state) => ({
          sessions: state.sessions.map(s => 
            s.id === currentSessionId
              ? { ...s, expenses: updatedExpenses }
              : s
          )
        }));
      },
      
      // Add delete session function
      deleteSession: async (sessionId: string) => {
        // Update in Firestore if connected
        const sessionToDelete = get().sessions.find(s => s.id === sessionId);
        if (get().isFirestoreConnected && sessionToDelete?.pin) {
          try {
            await firestoreService.deleteSessionFromFirestore(sessionToDelete.pin);
          } catch (error: any) {
            // If it's a "not found" error, that's fine - the document doesn't exist anyway
            if (error?.code !== 'not-found') {
              console.error("Error deleting session from Firestore:", error);
              throw error;
            }
            // For "not found" errors, we continue to remove from local storage
          }
        }
        
        // Always update local state
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          // If we're deleting the current session, clear the current session ID
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          currentSessionPin: state.currentSessionId === sessionId ? null : state.currentSessionPin
        }));
      },
      
      // These calculation functions remain the same as they operate on the local state
      calculateBalances: () => {
        const session = get().getCurrentSession();
        if (!session) return {};
        
        const balances: Record<string, number> = {};
        session.members.forEach(member => {
          balances[member.id] = 0;
        });
        
        session.expenses.forEach(expense => {
          const payer = expense.paidBy;
          const participants = expense.participants;
          if (!payer || participants.length === 0) return;

          const expenseAmount = Math.round(expense.amount * 100);
          balances[payer] = (balances[payer] * 100 + expenseAmount) / 100;

          if (expense.split === 'equal') {
            const amountPerPerson = Math.round(expenseAmount / participants.length) / 100;
            participants.forEach(participantId => {
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

        // Final rounding to clean up any floating point dust
        for (const memberId in balances) {
          balances[memberId] = Math.round(balances[memberId] * 100) / 100;
        }
        
        return balances;
      },
      
      calculateSettlements: () => {
        const balances = get().calculateBalances();
        const settlements: Settlement[] = [];
        
        // Separate debtors and creditors
        const debtors: { id: string; amount: number }[] = [];
        const creditors: { id: string; amount: number }[] = [];
        
        Object.entries(balances).forEach(([id, amount]) => {
          if (amount < 0) {
            debtors.push({ id, amount: -amount });
          } else if (amount > 0) {
            creditors.push({ id, amount });
          }
        });
        
        // Sort by amount (largest first)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        
        // Create settlements
        while (debtors.length > 0 && creditors.length > 0) {
          const debtor = debtors[0];
          const creditor = creditors[0];
          
          const amount = Math.min(debtor.amount, creditor.amount);
          
          settlements.push({
            from: debtor.id,
            to: creditor.id,
            amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
          });
          
          debtor.amount -= amount;
          creditor.amount -= amount;
          
          if (Math.abs(debtor.amount) < 0.01) {
            debtors.shift();
          }
          
          if (Math.abs(creditor.amount) < 0.01) {
            creditors.shift();
          }
        }
        
        return settlements;
      }
    }),
    {
      name: 'splitease-storage'
    }
  )
);
