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

// Only initialize Firebase if we are in the browser
const isBrowser = typeof window !== "undefined";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export auth and db, but they will only be truly usable on the client.
// In Astro SSR, trying to use these immediately at the module level will fail.
export const auth = isBrowser ? getAuth(app) : null as any;
export const db = isBrowser ? getFirestore(app) : null as any;
export default app;
