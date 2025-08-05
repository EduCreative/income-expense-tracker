import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import EditTransactionModal from "./EditTransactionModal";

export default function TransactionTable() {
  const { currentUser, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [editingTx, setEditingTx] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
    });

    return () => unsub();
  }, [userData?.familyID]);

  const formatDate = (dateField) => {
    if (!dateField) return "N/A";
    const dateObj =
      typeof dateField.toDate === "function"
        ? dateField.toDate()
        : new Date(dateField);
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = dateObj.toLocaleString("default", { month: "short" });
    const year = dateObj.getFullYear();
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

  return (
    <div className="overflow-x-auto mt-4">
      <h3 className="text-lg font-bold mb-2">All Transactions</h3>
      <table className="min-w-full bg-white shadow rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left text-sm">
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Category</th>
            <th className="p-2">Description</th>
            <th className="p-2">Date</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b text-sm">
              <td className="p-2 capitalize">{tx.type}</td>
              <td className="p-2">{formatCurrency(tx.amount)}</td>
              <td className="p-2">{tx.category || "N/A"}</td>
              <td className="p-2">{tx.description || "-"}</td>
              <td className="p-2">{formatDate(tx.date)}</td>
              <td className="p-2">
                <button
                  onClick={() => {
                    setEditingTx(tx);
                    setShowEditModal(true);
                  }}
                  className="text-blue-500 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-400">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <EditTransactionModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        transaction={editingTx}
        familyID={userData.familyID}
      />
    </div>
  );
}
