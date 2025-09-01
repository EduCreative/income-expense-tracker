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
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedAmount, setEditedAmount] = useState("");

  // Filter controls
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  // ✅ Default From Date = same day last month
  const [fromDate, setFromDate] = useState(
    lastMonth.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);

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
      setFilteredTransactions(list); // default all (kept behavior)
    });

    return () => unsubscribe();
  }, [userData]);

  const handleFilter = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const filtered = transactions.filter((txn) => {
      const txnDate = txn.date?.toDate ? txn.date.toDate() : null;
      if (!txnDate) return false;

      const matchCategory =
        selectedCategory === "All Categories" ||
        txn.category === selectedCategory;

      const matchDate = txnDate >= from && txnDate <= to;

      return matchCategory && matchDate;
    });

    setFilteredTransactions(filtered);
  };

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

  // Extract unique categories (filter out empty/undefined)
  const categories = [
    "All Categories",
    ...Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))),
  ];

  // ✅ Totals for the filtered data
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="mt-8 bg-white p-4 rounded shadow dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">All Transactions</h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Show Data
        </button>
      </div>

      {/* ✅ Extended Totals Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">
            Total Income
          </div>
          <div className="text-xl font-bold text-green-800 dark:text-green-200">
            {formatAmount(totalIncome)}
          </div>
        </div>
        <div className="rounded p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
          <div className="text-sm font-medium text-red-700 dark:text-red-300">
            Total Expense
          </div>
          <div className="text-xl font-bold text-red-800 dark:text-red-200">
            {formatAmount(totalExpense)}
          </div>
        </div>
        <div className="rounded p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Net Balance
          </div>
          <div
            className={`text-xl font-bold ${
              totalBalance >= 0
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {formatAmount(totalBalance)}
          </div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto overflow-x-auto">
        <table className="min-w-full table-auto text-sm dark:bg-gray-800 rounded">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-600">
              <th className="px-2 py-2 text-left">Type</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-left">Category</th>
              <th className="px-2 py-2 text-left">Amount</th>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => (
              <tr
                key={txn.id}
                className={`${
                  txn.type === "income"
                    ? "bg-green-50 dark:bg-green-400"
                    : "bg-red-50 dark:bg-red-400"
                } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              >
                <td className="px-4 py-2 capitalize font-bold">
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      txn.type === "income" ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {txn.type === "income" ? "Income" : "Expense"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  {editingId === txn.id ? (
                    <input
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-700 dark:text-white"
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
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-700 dark:text-white"
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
                      className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-700 dark:text-white"
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
                        className="bg-blue-500 text-white px-5 py-1 rounded"
                        onClick={() => handleEdit(txn)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(txn.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
