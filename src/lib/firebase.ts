
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// IMPORTANT: Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
  measurementId: "YOUR_MEASUREMENT_ID_HERE"
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
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" && 
    firebaseConfig.appId !== "YOUR_APP_ID"
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
