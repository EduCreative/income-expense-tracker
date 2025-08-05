import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function ExpenseForm() {
  const { currentUser, userData } = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const expenseCategories = [
    "Food",
    "Rent",
    "Utilities",
    "Transport",
    "Entertainment",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    try {
      await addDoc(
        collection(db, "families", userData.familyID, "transactions"),
        {
          type: "expense",
          title,
          amount: parseFloat(amount),
          category,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        }
      );

      setTitle("");
      setAmount("");
      setCategory("Food");
    } catch (error) {
      alert("Failed to add expense: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 bg-red-50 p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Add Expense</h3>

      <input
        type="text"
        placeholder="Expense Title"
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
        {expenseCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
        Add Expense
      </button>
    </form>
  );
}
