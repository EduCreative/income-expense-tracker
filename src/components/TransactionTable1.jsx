import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";

export default function TransactionTable() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [userData?.familyID]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">All Transactions</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border rounded shadow text-sm">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">Title</th>
                <th className="p-2">Amount (PKR)</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 capitalize text-center">
                    {tx.type === "income" ? "💚 Income" : "❤️ Expense"}
                  </td>
                  <td className="p-2">{tx.title}</td>
                  <td className="p-2 font-semibold">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="p-2">
                    {tx.createdAt?.toDate
                      ? formatDate(tx.createdAt.toDate())
                      : tx.createdAt
                      ? formatDate(new Date(tx.createdAt))
                      : "N/A"}
                  </td>

                  {/* <td className="p-2">
                    {tx.createdAt?.toDate
                      ? formatDate(tx.createdAt.toDate())
                      : "N/A"}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
