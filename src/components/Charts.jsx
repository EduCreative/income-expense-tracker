import React, { useEffect, useState } from "react";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  BarElement,
  CategoryScale,
  LinearScale
);

export default function Charts() {
  const { userData } = useAuth();
  const [categoryData, setCategoryData] = useState({ income: {}, expense: {} });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [incomeChartType, setIncomeChartType] = useState("pie");
  const [expenseChartType, setExpenseChartType] = useState("pie");

  // Set default dates: 1 month range
  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    setToDate(today.toISOString().split("T")[0]);
    setFromDate(lastMonth.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!userData?.familyID || !fromDate || !toDate) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const income = {};
      const expense = {};
      const from = new Date(fromDate);
      const to = new Date(toDate);

      snapshot.forEach((doc) => {
        const tx = doc.data();
        const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);

        if (txDate >= from && txDate <= to) {
          const cat = tx.category || "Uncategorized";
          if (tx.type === "income") {
            income[cat] = (income[cat] || 0) + tx.amount;
          } else if (tx.type === "expense") {
            expense[cat] = (expense[cat] || 0) + tx.amount;
          }
        }
      });

      setCategoryData({ income, expense });
    });

    return () => unsub();
  }, [userData?.familyID, fromDate, toDate]);

  const buildChartData = (dataMap) => {
    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);
    return {
      labels,
      datasets: [
        {
          label: "Amount",
          data,
          backgroundColor: [
            "#4CAF50",
            "#F44336",
            "#2196F3",
            "#ad850e",
            "#9C27B0",
            "#00BCD4",
            "#fb9700",
            "#607D8B",
            "#cf4c76",
            "#FF7D8F",
            "#117D8B",
            "#ffff00",
          ],
        },
      ],
    };
  };

  const renderChart = (dataMap, chartType) => {
    if (Object.keys(dataMap).length === 0) {
      return <p className="text-gray-400">No data available</p>;
    }

    const chartData = buildChartData(dataMap);
    switch (chartType) {
      case "bar":
        return <Bar data={chartData} />;
      case "doughnut":
        return <Doughnut data={chartData} />;
      default:
        return <Pie data={chartData} />;
    }
  };

  return (
    <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        📊 Category-wise Analysis
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 justify-center">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Income Chart */}
        <div className="bg-white p-4 rounded shadow dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Income by Category</h3>
            <select
              value={incomeChartType}
              onChange={(e) => setIncomeChartType(e.target.value)}
              className="border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="pie">Pie</option>
              <option value="bar">Bar</option>
              <option value="doughnut">Doughnut</option>
            </select>
          </div>
          {renderChart(categoryData.income, incomeChartType)}
        </div>

        {/* Expense Chart */}
        <div className="bg-white p-4 rounded shadow dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Expense by Category</h3>
            <select
              value={expenseChartType}
              onChange={(e) => setExpenseChartType(e.target.value)}
              className="border p-1 rounded text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="pie">Pie</option>
              <option value="bar">Bar</option>
              <option value="doughnut">Doughnut</option>
            </select>
          </div>
          {renderChart(categoryData.expense, expenseChartType)}
        </div>
      </div>
    </div>
  );
}
