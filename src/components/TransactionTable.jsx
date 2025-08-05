import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function TransactionTable() {
  const { currentUser, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!userData?.familyID) return;

    // Fetch categories
    const fetchCategories = async () => {
      const catSnap = await getDocs(
        collection(db, "families", userData.familyID, "categories")
      );
      const catList = catSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(catList);
    };

    fetchCategories();

    // Listen for transactions
    const q = query(
      collection(db, "families", userData.familyID, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });

    return () => unsub();
  }, [userData?.familyID]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "N/A";
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) =>
    `Rs. ${amount?.toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this?");
    if (!confirm) return;

    try {
      await deleteDoc(
        doc(db, "families", userData.familyID, "transactions", id)
      );
    } catch (error) {
      alert("Failed to delete: " + error.message);
    }
  };

  // Match category name and type to fetch icon + color
  const getCategoryDetails = (type, name) => {
    return (
      categories.find((cat) => cat.name === name && cat.type === type) || {
        icon: "❓",
        color: "bg-gray-300",
      }
    );
  };

  return (
    <div className="overflow-x-auto mt-4">
      <h3 className="text-lg font-bold mb-2">All Transactions</h3>
      <table className="min-w-full bg-white shadow rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left text-sm">
            <th className="p-2">Type</th>
            <th className="p-2">Title</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Category</th>
            <th className="p-2">Date</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const cat = getCategoryDetails(tx.type, tx.category);

            return (
              <tr key={tx.id} className="border-b text-sm">
                <td className="p-2 capitalize">{tx.type}</td>
                <td className="p-2">{tx.title}</td>
                <td className="p-2">{formatCurrency(tx.amount)}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs ${cat.color}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{tx.category || "N/A"}</span>
                  </span>
                </td>
                <td className="p-2">{formatDate(tx.createdAt)}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-400">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
