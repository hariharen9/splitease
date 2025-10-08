
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query, 
  where, 
  getDocs,
  onSnapshot,
  arrayUnion,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { Session, Expense, Member } from "./types";
import { generateId, generatePin } from "./utils";

const SESSIONS_COLLECTION = "sessions";

// Helper function to check Firebase configuration before operations
const checkFirebaseConfig = () => {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase is not properly configured. Using local storage only.");
    return false;
  }
  return true;
};

export const createSessionInFirestore = async (session: Session): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    
    console.log("Creating session in Firestore with PIN:", session.pin);
    await setDoc(doc(db, SESSIONS_COLLECTION, session.pin), {
      ...session,
      createdAt: new Date().toISOString()
    });
    console.log("Session successfully created in Firestore");
  } catch (error) {
    console.error("Error creating session in Firestore:", error);
  }
};

export const getSessionByPin = async (pin: string): Promise<Session | null> => {
  try {
    if (!checkFirebaseConfig()) return null;
    
    console.log("Getting session from Firestore with PIN:", pin);
    const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, pin));
    
    if (sessionDoc.exists()) {
      console.log("Session found in Firestore");
      return sessionDoc.data() as Session;
    }
    
    console.log("Session not found in Firestore");
    return null;
  } catch (error) {
    console.error("Error getting session from Firestore:", error);
    return null;
  }
};

export const updateSessionTitle = async (pin: string, title: string): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), { title });
  } catch (error) {
    console.error("Error updating session title in Firestore:", error);
  }
};

export const updateSessionCurrency = async (pin: string, currency: string): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), { currency });
  } catch (error) {
    console.error("Error updating session currency in Firestore:", error);
  }
};

export const addMemberToSession = async (pin: string, member: Member): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), {
      members: arrayUnion(member)
    });
  } catch (error) {
    console.error("Error adding member to session in Firestore:", error);
  }
};

export const updateSessionMembers = async (pin: string, members: Member[]): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), { members });
  } catch (error) {
    console.error("Error updating members in session:", error);
  }
};

export const addExpenseToSession = async (pin: string, expense: Expense): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), {
      expenses: arrayUnion(expense)
    });
  } catch (error) {
    console.error("Error adding expense to session in Firestore:", error);
  }
};

export const updateSessionExpenses = async (pin: string, expenses: Expense[]): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    await updateDoc(doc(db, SESSIONS_COLLECTION, pin), { expenses });
  } catch (error) {
    console.error("Error updating expenses in session:", error);
  }
};

export const subscribeToSession = (
  pin: string, 
  onUpdate: (session: Session | null) => void
) => {
  if (!pin) return () => {};
  
  try {
    if (!checkFirebaseConfig()) return () => {};
    
    console.log("Subscribing to session updates for PIN:", pin);
    
    const unsubscribe = onSnapshot(
      doc(db, SESSIONS_COLLECTION, pin),
      (doc) => {
        if (doc.exists()) {
          const sessionData = doc.data() as Session;
          // Only log and update if there's actually new data
          console.log("Received session update from Firestore");
          onUpdate(sessionData);
        } else {
          console.log("Session document doesn't exist in Firestore");
          onUpdate(null);
        }
      },
      (error) => {
        console.error("Error listening to session updates:", error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up session subscription:", error);
    return () => {};
  }
};

// Add delete session function
export const deleteSessionFromFirestore = async (pin: string): Promise<void> => {
  try {
    if (!checkFirebaseConfig()) return;
    
    console.log("Deleting session from Firestore with PIN:", pin);
    // First, try to mark as deleted
    try {
      await updateDoc(doc(db, SESSIONS_COLLECTION, pin), {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      console.log("Session marked as deleted in Firestore");
    } catch (updateError: any) {
      // If update fails because document doesn't exist, that's fine
      if (updateError?.code === 'not-found') {
        console.log("Session document doesn't exist in Firestore, nothing to delete");
        return;
      }
      // If it's another error, re-throw it
      throw updateError;
    }
  } catch (error) {
    console.error("Error marking session as deleted in Firestore:", error);
    throw error;
  }
};
