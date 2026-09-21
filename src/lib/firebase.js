import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase web config is safe to ship to the browser. Environment variables can
// override these values for a different Firebase project in another deployment.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCJKhleIQX-3xGmrQ54u44KljJi9VUVSE8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scoreline-8d310.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scoreline-8d310",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scoreline-8d310.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "14301527336",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:14301527336:web:4b05101d1f940811f8241d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
