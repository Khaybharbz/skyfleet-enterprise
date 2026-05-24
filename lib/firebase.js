import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVaHRCLVizkiWM6RFR-OU2UMlvjgS40rU",
  authDomain: "skyfleet-logistics.firebaseapp.com",
  projectId: "skyfleet-logistics",
  storageBucket: "skyfleet-logistics.firebasestorage.app",
  messagingSenderId: "325544047229",
  appId: "1:325544047229:web:a333164f080f83cc8d7714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore database export
export const db = getFirestore(app);
export const auth = getAuth(app);