// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDObwk6YiyCpDyIxOnfW8OsqQN-S7iqN5g",
  authDomain: "myincomeexpenseapp.firebaseapp.com",
  projectId: "myincomeexpenseapp",
  storageBucket: "myincomeexpenseapp.appspot.com", // ✅ fixed
  // storageBucket: "myincomeexpenseapp.firebasestorage.app",
  messagingSenderId: "203755433381",
  appId: "1:203755433381:web:b98231a78fee5f2901cc4c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
