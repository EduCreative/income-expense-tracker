import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Charts() {
  const { userData } = useAuth();
  const [categoryData, setCategoryData] = useState({
    income: {},
    expense: {},
  });

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const income = {};
      const expense = {};

      snapshot.forEach((doc) => {
        const tx = doc.data();
        const cat = tx.category || "Uncategorized";

        if (tx.type === "income") {
          income[cat] = (income[cat] || 0) + tx.amount;
        } else if (tx.type === "expense") {
          expense[cat] = (expense[cat] || 0) + tx.amount;
        }
      });

      setCategoryData({ income, expense });
    });

    return () => unsub();
  }, [userData?.familyID]);

  const buildChartData = (dataMap) => {
    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#4CAF50",
            "#F44336",
            "#2196F3",
            "#FFC107",
            "#9C27B0",
            "#00BCD4",
            "#FF9800",
            "#607D8B",
          ],
        },
      ],
    };
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2">Income by Category</h3>
        {Object.keys(categoryData.income).length > 0 ? (
          <Pie data={buildChartData(categoryData.income)} />
        ) : (
          <p className="text-gray-400">No income data</p>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2">Expense by Category</h3>
        {Object.keys(categoryData.expense).length > 0 ? (
          <Pie data={buildChartData(categoryData.expense)} />
        ) : (
          <p className="text-gray-400">No expense data</p>
        )}
      </div>
    </div>
  );
}
