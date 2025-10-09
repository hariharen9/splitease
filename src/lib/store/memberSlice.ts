
import { StateCreator } from 'zustand';
import { Member } from '../types';
import { generateId } from '../utils';
import * as firestoreService from '../firestore';
import { SessionSlice } from './sessionSlice';

export interface MemberSlice {
  addMember: (name: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  updateMember: (id: string, name: string) => Promise<void>;
}

export const createMemberSlice: StateCreator<
  SessionSlice & MemberSlice,
  [],
  [],
  MemberSlice
> = (set, get) => ({
  addMember: async (name) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const newMember: Member = {
      id: generateId(),
      name,
      avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`,
    };

    const sessions = get().sessions.map((s) =>
      s.id === currentSessionId
        ? { ...s, members: [...s.members, newMember] }
        : s
    );
    set({ sessions });

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.addMemberToSession(currentPin, newMember);
      } catch (error) {
        console.error('Error adding member in Firestore:', error);
        const revertedSessions = get().sessions.map((s) =>
          s.id === currentSessionId
            ? { ...s, members: s.members.filter((m) => m.id !== newMember.id) }
            : s
        );
        set({ sessions: revertedSessions });
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
      throw new Error('This member is involved in expenses and cannot be removed.');
    }

    const updatedMembers = session.members.filter((m) => m.id !== id);

    const sessions = get().sessions.map((s) =>
      s.id === currentSessionId ? { ...s, members: updatedMembers } : s
    );
    set({ sessions });

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionMembers(currentPin, updatedMembers);
      } catch (error) {
        console.error('Error removing member in Firestore:', error);
        set({ sessions: get().sessions }); // Revert
        throw new Error('Failed to remove member from the session.');
      }
    }
  },
  updateMember: async (id, name) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const updatedMembers = session.members.map((m) =>
      m.id === id ? { ...m, name } : m
    );

    const sessions = get().sessions.map((s) =>
      s.id === currentSessionId ? { ...s, members: updatedMembers } : s
    );
    set({ sessions });

    if (useAppStore.getState().isFirestoreConnected && currentPin) {
      try {
        await firestoreService.updateSessionMembers(currentPin, updatedMembers);
      } catch (error) {
        console.error('Error updating member in Firestore:', error);
        set({ sessions: get().sessions }); // Revert
      }
    }
  },
});

import { useAppStore } from './index';
