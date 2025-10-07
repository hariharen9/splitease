import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// Using environment variables from .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Firebase app instance
let app: FirebaseApp;

// Initialize Firebase
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Initialize Firestore
export const db = getFirestore(app);

// Helper to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
    firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE" && 
    firebaseConfig.appId && firebaseConfig.appId !== "YOUR_APP_ID_HERE"
  );
};

// Function to reinitialize Firebase with new config
export const reinitializeFirebase = (newConfig: typeof firebaseConfig): boolean => {
  try {
    // Replace the global config
    Object.assign(firebaseConfig, newConfig);
    
    // Reinitialize the app
    app = initializeApp(newConfig, "splitease");
    
    // Update the db reference
    Object.assign(db, getFirestore(app));
    
    console.log("Firebase reinitialized with new config");
    return true;
  } catch (error) {
    console.error("Error reinitializing Firebase:", error);
    return false;
  }
};