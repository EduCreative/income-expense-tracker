import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function TransactionTable() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedAmount, setEditedAmount] = useState("");

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(list);
    });

    return () => unsubscribe();
  }, [userData]);

  const formatAmount = (amt) => `Rs. ${Number(amt).toLocaleString("en-PK")}`;

  const formatDate = (timestamp) => {
    try {
      const date = timestamp?.toDate();
      return date
        ? date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";
    } catch {
      return "N/A";
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete?");
    if (!confirm) return;

    try {
      await deleteDoc(
        doc(db, "families", userData.familyID, "transactions", id)
      );
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditedDescription(transaction.description);
    setEditedCategory(transaction.category);
    setEditedAmount(transaction.amount);
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(
        doc(db, "families", userData.familyID, "transactions", id),
        {
          description: editedDescription,
          category: editedCategory,
          amount: parseFloat(editedAmount),
        }
      );
      setEditingId(null);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="max-h-64 overflow-y-auto mt-8 bg-white p-4 rounded shadow overflow-x-auto dark:bg-gray-800 rounded">
      <h3 className="text-lg font-semibold mb-4">All Transactions</h3>
      <table className="min-w-full table-auto text-sm dark:bg-gray-800 rounded">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-600 rounded">
            <th className="px-2 py-2 text-left">Type</th>
            <th className="px-2 py-2 text-left">Description</th>
            <th className="px-2 py-2 text-left">Category</th>
            <th className="px-2 py-2 text-left">Amount</th>
            <th className="px-2 py-2 text-left">Date</th>
            <th className="px-2 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr
              key={txn.id}
              className={`${
                txn.type === "income"
                  ? "bg-green-100 dark:bg-gray-400 rounded"
                  : "bg-red-100 dark:bg-gray-600 rounded"
              } hover:bg-gray-100 transition-colors `}
            >
              {/* className="mb-4 bg-green-50 p-4 rounded shadow" */}
              <td className="px-4 py-2 capitalize text-xs font-bold text-yellow">
                <span
                  className={`px-2 py-1 rounded text-xs-yellow ${
                    txn.type === "income"
                      ? "mb-4 bg-green-500"
                      : "mb-4 bg-red-500 p-4"
                  }`}
                >
                  {/* <td className="px-2 py-2 capitalize"> */}
                  {txn.type === "income" ? "Income" : "Expense"}
                  {/* </td> */}
                </span>
              </td>
              <td className="px-2 py-2">
                {editingId === txn.id ? (
                  <input
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  txn.description
                )}
              </td>
              <td className="px-2 py-2">
                {editingId === txn.id ? (
                  <input
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  txn.category
                )}
              </td>
              <td className="px-2 py-2">
                {editingId === txn.id ? (
                  <input
                    type="number"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  formatAmount(txn.amount)
                )}
              </td>
              <td className="px-2 py-2">{formatDate(txn.date)}</td>
              <td className="px-2 py-2 flex gap-2">
                {editingId === txn.id ? (
                  <>
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded"
                      onClick={() => handleUpdate(txn.id)}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-400 text-white px-2 py-1 rounded"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleEdit(txn)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleDelete(txn.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
