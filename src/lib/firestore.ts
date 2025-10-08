
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
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

// Function to test Firestore connectivity
export const testFirestoreConnectivity = async (): Promise<boolean> => {
  try {
    if (!checkFirebaseConfig()) return false;
    
    // Try a simple read operation to test connectivity
    const testDoc = await getDoc(doc(db, SESSIONS_COLLECTION, "connectivity-test"));
    return true;
  } catch (error) {
    console.log("Firestore connectivity test failed:", error);
    return false;
  }
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
          // Check if session is marked as deleted
          if ('deleted' in sessionData && sessionData.deleted) {
            console.log("Session is marked as deleted");
            onUpdate(null);
          } else {
            // Only log and update if there's actually new data
            console.log("Received session update from Firestore");
            onUpdate(sessionData);
          }
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
    // Actually delete the document
    await deleteDoc(doc(db, SESSIONS_COLLECTION, pin));
    console.log("Session deleted from Firestore");
  } catch (error: any) {
    // If it's a "not found" error, that's fine - the document doesn't exist anyway
    if (error?.code === 'not-found') {
      console.log("Session document doesn't exist in Firestore, nothing to delete");
      return;
    }
    console.error("Error deleting session from Firestore:", error);
    throw error;
  }
};
