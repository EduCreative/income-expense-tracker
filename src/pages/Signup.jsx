import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Owner"); // default to owner
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      let familyID;

      if (role === "Owner") {
        // Step 2: Create new family in Firestore
        const familyRef = await addDoc(collection(db, "families"), {
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
        familyID = familyRef.id;

        // Step 3: Add default categories
        const defaultIncomeCategories = ["Salary", "Other"];

        const defaultExpenseCategories = [
          "Food",
          "Rent",
          "Utilities",
          "Grocery",
          "Entertainment",
          "Other",
        ];

        const categoryRef = collection(db, "families", familyID, "categories");
        const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500"];
        const EMOJIS = ["💰", "🍔", "🚗"];

        for (let i = 0; i < defaultIncomeCategories.length; i++) {
          await addDoc(categoryRef, {
            name: defaultIncomeCategories[i],
            type: "income",
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            color: COLORS[i % COLORS.length], // cycle through colors
            icon: EMOJIS[i % EMOJIS.length], // cycle through emojis
          });
        }

        for (let i = 0; i < defaultExpenseCategories.length; i++) {
          await addDoc(categoryRef, {
            name: defaultExpenseCategories[i],
            type: "expense",
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            color: COLORS[i % COLORS.length],
            icon: EMOJIS[i % EMOJIS.length],
          });
        }
      } else {
        // Step 4: Read familyID from URL for member
        const urlParams = new URLSearchParams(window.location.search);
        familyID = urlParams.get("familyID");

        if (!familyID) {
          alert("Invalid invite link. Family ID missing.");
          return;
        }
      }

      // Step 5: Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        role,
        familyID,
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mb-3 w-full rounded"
          required
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-3 w-full rounded"
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-3 w-full rounded"
          required
        />

        <label className="block mb-2 font-semibold">Select Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        >
          <option value="Owner">Family Owner</option>
          <option value="member">Family Member</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
