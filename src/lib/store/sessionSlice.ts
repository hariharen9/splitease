import { StateCreator } from 'zustand';
import { Session, Settlement, Activity } from '../types';
import * as firestoreService from '../firestore';
import { generateId, generatePin } from '../utils';

export interface SessionSlice {
  sessions: Session[];
  currentSessionId: string | null;
  currentSessionPin: string | null;
  createSession: (title: string) => Promise<Session>;
  joinSession: (pin: string) => Promise<Session | null>;
  getCurrentSession: () => Session | null;
  setCurrentSessionId: (id: string) => void;
  updateSessionTitle: (title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  syncSessionFromFirestore: (session: Session) => void;
  markSettlementAsCompleted: (settlement: Settlement) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentSessionPin: null,
  createSession: async (title) => {
    const newSession: Session = {
      id: generateId(),
      pin: generatePin(),
      title: title || 'Untitled Session',
      createdAt: new Date().toISOString(),
      members: [],
      expenses: [],
      currency: 'INR',
      settlementsCompleted: [],
      activities: [],
    };

    if (useAppStore.getState().isFirestoreConnected) {
      try {
        await firestoreService.createSessionInFirestore(newSession);
      } catch (error) {
        console.error('Failed to create session in Firestore:', error);
      }
    }

    set((state) => ({
      sessions: [...state.sessions, newSession],
      currentSessionId: newSession.id,
      currentSessionPin: newSession.pin,
    }));

    // Add activity for session creation
    await get().addActivity({
      type: 'session_created',
      description: `Session "${newSession.title}" was created`,
      details: {
        sessionId: newSession.id,
        title: newSession.title
      }
    });

    return newSession;
  },
  joinSession: async (pin) => {
    if (useAppStore.getState().isFirestoreConnected) {
      try {
        const firestoreSession = await firestoreService.getSessionByPin(pin);
        if (firestoreSession) {
          if ('deleted' in firestoreSession && firestoreSession.deleted) {
            set((state) => ({
              sessions: state.sessions.filter((s) => s.pin !== pin),
            }));
            return null;
          }

          const existingSession = get().sessions.find((s) => s.pin === pin);
          if (!existingSession) {
            set((state) => ({
              sessions: [...state.sessions, firestoreSession],
              currentSessionId: firestoreSession.id,
              currentSessionPin: firestoreSession.pin,
            }));
          } else {
            set({
              currentSessionId: existingSession.id,
              currentSessionPin: existingSession.pin,
            });
          }
          return firestoreSession;
        }
      } catch (error: any) {
        if (error?.code !== 'not-found') {
          console.error('Error joining session from Firestore:', error);
        }
      }
    }

    const localSession = get().sessions.find((s) => s.pin === pin);
    if (localSession) {
      if ('deleted' in localSession && localSession.deleted) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.pin !== pin),
        }));
        return null;
      }
      set({
        currentSessionId: localSession.id,
        currentSessionPin: localSession.pin,
      });
      return localSession;
    }

    return null;
  },
  getCurrentSession: () => {
    const { sessions, currentSessionId } = get();
    return sessions.find((s) => s.id === currentSessionId) || null;
  },
  setCurrentSessionId: (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (session) {
      set({ currentSessionId: session.id, currentSessionPin: session.pin });
    }
  },
  updateSessionTitle: async (title) => {
    const currentSession = get().getCurrentSession();
    const currentPin = get().currentSessionPin;

    if (!currentSession) return;

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionTitle(currentPin, title);
      } catch (error) {
        console.error('Error updating session title in Firestore:', error);
      }
    }
    
    // Add activity for session update
    await get().addActivity({
      type: 'session_updated',
      description: `Session title updated to "${title}"`,
      details: {
        sessionId: currentSession.id,
        oldTitle: currentSession.title,
        newTitle: title
      }
    });
  },
  deleteSession: async (sessionId) => {
    const sessionToDelete = get().sessions.find((s) => s.id === sessionId);
    if (useAppStore.getState().isFirestoreConnected && sessionToDelete?.pin) {
      try {
        await firestoreService.deleteSessionFromFirestore(sessionToDelete.pin);
      } catch (error: any) {
        if (error?.code !== 'not-found') {
          console.error('Error deleting session from Firestore:', error);
          throw error;
        }
      }
    }

    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
      currentSessionPin: state.currentSessionId === sessionId ? null : state.currentSessionPin,
    }));
  },
  syncSessionFromFirestore: (session) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    }));
  },
  markSettlementAsCompleted: async (settlement) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const updatedSettlements = [...(session.settlementsCompleted || []), settlement];

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionSettlements(currentPin, updatedSettlements);
      } catch (error) {
        console.error('Error updating settlements in Firestore:', error);
        throw error;
      }
    }

    const sessions = get().sessions.map((s) =>
      s.id === currentSessionId 
        ? { ...s, settlementsCompleted: updatedSettlements } 
        : s
    );
    set({ sessions });
    
    // Add activity for settlement completion
    const fromMember = session.members.find(m => m.id === settlement.from);
    const toMember = session.members.find(m => m.id === settlement.to);
    
    await get().addActivity({
      type: 'settlement_completed',
      description: `${fromMember?.name || 'Someone'} settled up with ${toMember?.name || 'someone'}`,
      details: {
        from: settlement.from,
        to: settlement.to,
        amount: settlement.amount,
        currency: session.currency,
        fromName: fromMember?.name,
        toName: toMember?.name
      }
    });
  },
  addActivity: async (activity) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const newActivity: Activity = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...activity
    };

    // Update local state with the new activity
    const sessions = get().sessions.map((s) => {
      if (s.id === currentSessionId) {
        // Add new activity to the beginning of the array (newest first)
        // Keep all activities, not just the last 100
        const updatedActivities = [newActivity, ...(s.activities || [])];
        return { 
          ...s, 
          activities: updatedActivities
        };
      }
      return s;
    });
    set({ sessions });

    // Update Firestore with the new activity
    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        const session = sessions.find(s => s.id === currentSessionId);
        if (session && session.activities) {
          await firestoreService.updateSessionActivities(currentPin, session.activities);
        }
      } catch (error) {
        console.error('Error adding activity in Firestore:', error);
      }
    }
  },
});

import { useAppStore } from './index';