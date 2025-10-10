import { StateCreator } from 'zustand';
import { Member } from '../types';
import { generateId } from '../utils';
import * as firestoreService from '../firestore';
import { SessionSlice } from './sessionSlice';

export interface MemberSlice {
  addMember: (name: string, gender?: 'male' | 'female') => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  updateMember: (id: string, name: string) => Promise<void>;
}

export const createMemberSlice: StateCreator<
  SessionSlice & MemberSlice,
  [],
  [],
  MemberSlice
> = (set, get) => ({
  addMember: async (name, gender) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    // Generate avatar URL based on gender
    let avatarUrl: string | undefined;
    if (gender === 'male') {
      avatarUrl = 'https://avatar.iran.liara.run/public/boy';
    } else if (gender === 'female') {
      avatarUrl = 'https://avatar.iran.liara.run/public/girl';
    }

    const newMember: Member = {
      id: generateId(),
      name,
      avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`,
      gender,
      avatarUrl
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
    
    // Add activity for member addition
    await get().addActivity({
      type: 'member_added',
      description: `Member "${name}" was added to the group`,
      details: {
        memberId: newMember.id,
        memberName: name
      }
    });
  },
  removeMember: async (id) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const memberToRemove = session.members.find(m => m.id === id);
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
    
    // Add activity for member removal
    if (memberToRemove) {
      await get().addActivity({
        type: 'member_removed',
        description: `Member "${memberToRemove.name}" was removed from the group`,
        details: {
          memberId: memberToRemove.id,
          memberName: memberToRemove.name
        }
      });
    }
  },
  updateMember: async (id, name) => {
    const currentSessionId = get().currentSessionId;
    const currentPin = get().currentSessionPin;

    if (!currentSessionId) return;

    const session = get().getCurrentSession();
    if (!session) return;

    const oldMember = session.members.find(m => m.id === id);
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
    
    // Add activity for member update
    if (oldMember) {
      await get().addActivity({
        type: 'member_added', // Using member_added for updates as well
        description: `Member "${oldMember.name}" was renamed to "${name}"`,
        details: {
          memberId: id,
          oldName: oldMember.name,
          newName: name
        }
      });
    }
  },
});

import { useAppStore } from './index';