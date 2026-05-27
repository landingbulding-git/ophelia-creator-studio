import { c as createComponent } from './astro-component_DOS8oIPp.mjs';
import 'piccolore';
import { j as addAttribute, q as renderHead, s as renderSlot, t as renderTemplate } from './entrypoint_DAI6Gv_1.mjs';
import 'clsx';
import { jsx } from 'react/jsx-runtime';
import { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Ophelia Creator Studio"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title} | Ophelia Studio</title>${renderHead()}</head> <body class="bg-[#0a0a0a] text-white selection:bg-[#ff7a1a] selection:text-white"> ${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/Volumes/Machintosh HD - adatok/Users/mac/Documents/Ophelia/studio/src/layouts/Layout.astro", void 0);

const firebaseConfig = {
  apiKey: "AIzaSyBKO4A3ODMmPWP1IaNtDkAtRfuC76DkalU",
  authDomain: "ophelia-bd2e0.firebaseapp.com",
  projectId: "ophelia-bd2e0",
  storageBucket: "ophelia-bd2e0.firebasestorage.app",
  messagingSenderId: "129922709596",
  appId: "1:129922709596:web:40e3c0372edcaee4e24e99",
  measurementId: "G-V65RV6R6GG"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user2) => {
      setUser(user2);
      setLoading(false);
      if (user2) {
        const token = await user2.getIdToken();
        console.log("[Studio] Broadcasting auth update to extension...");
        window.postMessage({
          type: "OPHELIA_AUTH_UPDATE",
          payload: { token, email: user2.email }
        }, "*");
      }
    });
    return () => unsubscribe();
  }, []);
  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  const logOut = async () => {
    await signOut(auth);
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, loading, signIn, logOut }, children });
}
function useAuth() {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { $$Layout as $, AuthProvider as A, db as d, useAuth as u };
