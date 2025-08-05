import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function IncomeForm() {
  const { currentUser, userData } = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");

  const incomeCategories = ["Salary", "Freelance", "Business", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    try {
      await addDoc(
        collection(db, "families", userData.familyID, "transactions"),
        {
          type: "income",
          title,
          amount: parseFloat(amount),
          category,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        }
      );

      setTitle("");
      setAmount("");
      setCategory("Salary");
    } catch (error) {
      alert("Failed to add income: " + error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 bg-green-50 p-4 rounded shadow"
    >
      <h3 className="text-lg font-semibold mb-2">Add Income</h3>

      <input
        type="text"
        placeholder="Income Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
        required
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
        required
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      >
        {incomeCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Add Income
      </button>
    </form>
  );
}
