import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKO4A3ODMmPWP1IaNtDkAtRfuC76DkalU",
  authDomain: "ophelia-bd2e0.firebaseapp.com",
  projectId: "ophelia-bd2e0",
  storageBucket: "ophelia-bd2e0.firebasestorage.app",
  messagingSenderId: "129922709596",
  appId: "1:129922709596:web:40e3c0372edcaee4e24e99",
  measurementId: "G-V65RV6R6GG"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
