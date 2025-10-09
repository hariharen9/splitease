
import { StateCreator } from 'zustand';

export interface UiSlice {
  isFirestoreConnected: boolean;
  isFirestoreAvailable: boolean;
  setFirestoreConnected: (connected: boolean) => void;
  setFirestoreAvailable: (available: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  isFirestoreConnected: false,
  isFirestoreAvailable: true,
  setFirestoreConnected: (connected) => set({ isFirestoreConnected: connected }),
  setFirestoreAvailable: (available) => set({ isFirestoreAvailable: available }),
});
