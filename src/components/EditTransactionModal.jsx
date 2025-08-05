import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import CategorySelector from "./CategorySelector";

export default function EditTransactionModal({
  open,
  onClose,
  transaction,
  familyID,
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setCategory(transaction.category || "");
      setDescription(transaction.description || "");
      const d = transaction.date?.toDate?.() || new Date(transaction.date);
      setDate(d.toISOString().split("T")[0]);
    }
  }, [transaction]);

  const handleSave = async () => {
    try {
      const docRef = doc(
        db,
        "families",
        familyID,
        "transactions",
        transaction.id
      );
      await updateDoc(docRef, {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
      });
      onClose(); // close modal
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Transaction</h2>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full mb-2 rounded"
        />

        <CategorySelector
          type={transaction.type}
          value={category}
          onChange={setCategory}
        />

        {/* <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 w-full mb-2 rounded"
        /> */}

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
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
