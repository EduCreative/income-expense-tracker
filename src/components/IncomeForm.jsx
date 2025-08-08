import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import CategorySelector from "./CategorySelector";

export default function IncomeForm() {
  const { currentUser, userData } = useAuth();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const incomeCategories = ["Salary", "Freelance", "Business", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    try {
      await addDoc(
        collection(db, "families", userData.familyID, "transactions"),
        {
          type: "income",
          amount: parseFloat(amount),
          category,
          description,
          date: new Date(date),
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        }
      );

      setAmount("");
      setCategory("Salary");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
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
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
        required
      />

      <CategorySelector type="income" value={category} onChange={setCategory} />

      {/* <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      >
        {incomeCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select> */}

      <input
        type="text"
        placeholder="Notes / Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full mb-2 rounded"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
        required
      />

      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Add Income
      </button>
    </form>
  );
}
