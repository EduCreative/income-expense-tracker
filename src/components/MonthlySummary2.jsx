// src/components/MonthlySummary2.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function MonthlySummary2({ selectedDate }) {
  const { userData } = useAuth();
  const [summary, setSummary] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    const fetchSummary = async () => {
      if (!userData?.familyID) return;

      const start = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      const end = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const q = query(
        collection(db, "families", userData.familyID, "transactions"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end)
      );

      const snapshot = await getDocs(q);
      let income = 0;
      let expense = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "income") {
          income += data.amount || 0;
        } else if (data.type === "expense") {
          expense += data.amount || 0;
        }
      });

      setSummary({ income, expense });
    };

    fetchSummary();
  }, [selectedDate, userData]);

  const balance = summary.income - summary.expense;
  const balanceColor = balance >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-gray-50 rounded shadow p-4 mt-4">
      <h3 className="font-semibold mb-2">
        📊 Monthly Summary (
        {selectedDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        })}
        )
      </h3>
      <div className="flex justify-between">
        <span>
          Income:{" "}
          <strong className="text-green-600">
            Rs {summary.income.toLocaleString()}
          </strong>
        </span>
        <span>
          Expense:{" "}
          <strong className="text-red-600">
            Rs {summary.expense.toLocaleString()}
          </strong>
        </span>
        <span>
          Balance:{" "}
          <strong className={balanceColor}>
            Rs {balance.toLocaleString()}
          </strong>
        </span>
      </div>
    </div>
  );
}
