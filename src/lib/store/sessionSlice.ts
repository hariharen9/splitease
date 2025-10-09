
import { StateCreator } from 'zustand';
import { Session } from '../types';
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

    // This will be moved to a separate activity slice
    // get().addActivity(...);

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
});

import { useAppStore } from './index';
