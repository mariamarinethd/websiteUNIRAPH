// Modular (v9+) Firebase init with extra helpers (sign-up check, createDriver, realtime drivers)
// Include firebase-config.js (plain script) BEFORE this module:
// <script src="./firebase-config.js"></script>
// <script type="module" src="./firebase-init.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

if (!window.firebaseConfig) {
  console.error("Missing firebaseConfig. Add web-dev-code/firebase-config.js with your project settings.");
} else {
  // Initialize Firebase app
  const app = initializeApp(window.firebaseConfig);

  // Initialize services
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Attach to window for debugging / access from non-module scripts
  window.app = app;
  window.auth = auth;
  window.db = db;

  // --- AUTH HELPERS ---

  // Sign up with email: first check if an account exists for this email,
  // if yes -> reject with friendly message (do not try to create duplicate).
  window.signUpWithEmail = async (email, password) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        // Account already exists (could be Google / email link etc.)
        throw new Error("An account with that email already exists. Please use Sign In.");
      }
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      // create a profile document in Firestore (owner data)
      await setDoc(doc(db, "users", uid), {
        email,
        createdAt: serverTimestamp()
      });
      return userCred.user;
    } catch (err) {
      console.error("Sign up error:", err);
      throw err;
    }
  };

  // Sign in wrapper that throws the SDK errors up to the UI
  window.signInWithEmail = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      return userCred.user;
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  window.signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
      throw err;
    }
  };

  // --- FIRESTORE HELPERS ---

  // Create a driver/offer document. Requires signed-in user.
  // collectionName: string (e.g. 'drivers' or 'public')
  // data: object with ride details
  window.createDriver = async (collectionName, data) => {
    if (!auth.currentUser) {
      throw new Error("You must be signed in to post a ride.");
    }
    try {
      const payload = {
        ...data,
        ownerUid: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email || null,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, collectionName), payload);
      return docRef.id;
    } catch (err) {
      console.error("Create driver error:", err);
      throw err;
    }
  };

  // Read drivers once (not used by UI but available)
  window.readDriversOnce = async (collectionName, limitNum = 50) => {
    try {
      const colRef = collection(db, collectionName);
      const q = query(colRef, orderBy("createdAt", "desc"), limit(limitNum));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Read drivers error:", err);
      throw err;
    }
  };

  // Realtime listener: calls cb(docsArray) whenever drivers collection changes.
  // Returns an unsubscribe function.
  window.onDriversChanged = (collectionName, cb, options = { limit: 200 }) => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(options.limit || 200));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      try { cb(null, docs); } catch (err) { console.error('onDriversChanged callback error', err); }
    }, (err) => {
      console.error("Drivers listener error:", err);
      cb(err);
    });
    return unsub;
  };

  // Delete doc: requires user signed in and rules must permit (or owner)
  window.deletePublicDoc = async (collectionName, docId) => {
    try {
      if (!auth.currentUser) {
        throw new Error("You must be signed in to delete documents.");
      }
      await deleteDoc(doc(db, collectionName, docId));
      return true;
    } catch (err) {
      console.error("Delete doc error:", err);
      throw err;
    }
  };

  // Auth state listener — update window.currentUser and allow UI to react.
  fbOnAuthStateChanged(auth, (user) => {
    window.currentUser = user || null;
    // UI code on page polls or uses this state; you can also dispatch events here if you want:
    // window.dispatchEvent(new CustomEvent('firebase-auth-changed', { detail: user }));
    if (user) {
      console.log("User signed in:", user.uid, user.email);
    } else {
      console.log("No user signed in");
    }
  });
}