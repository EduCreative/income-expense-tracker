import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

export default function MonthlySummary() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [chartType, setChartType] = useState("pie");

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(items);
    });

    return () => unsub();
  }, [userData?.familyID]);

  const formatDate = (ts) => {
    if (!ts || !ts.seconds) return null;
    return new Date(ts.seconds * 1000);
  };

  const uniqueCategories = [
    ...new Set(transactions.map((tx) => tx.category || "Uncategorized")),
  ];

  const filtered = transactions.filter((tx) => {
    const date = formatDate(tx.createdAt);
    if (!date) return false;

    const matchesMonth = selectedMonth
      ? date.toISOString().slice(0, 7) === selectedMonth
      : true;

    const matchesCategory =
      selectedCategory === "all" || tx.category === selectedCategory;

    return matchesMonth && matchesCategory;
  });

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatAmount = (amount) =>
    "Rs. " + amount.toLocaleString("en-PK", { minimumFractionDigits: 0 });

  const chartData = {
    labels: ["Income", "Expense", "Balance"],
    datasets: [
      {
        label: "Rs.",
        data: [totalIncome, totalExpense, balance],
        backgroundColor: ["#4CAF50", "#F44336", "#2196F3"],
        borderColor: ["#388E3C", "#D32F2F", "#1976D2"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Monthly Financial Summary" },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-4 dark:bg-gray-800 rounded">
      <h3 className="text-xl font-bold mb-4">Monthly Summary</h3>

      <div className="flex flex-col md:flex-row gap-4 mb-4 dark:bg-gray-800 rounded">
        <div>
          <label className="block font-semibold dark:bg-gray-800 rounded">
            Select Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 rounded"
          />
        </div>

        {/* <div>
          <label className="block font-semibold dark:bg-gray-800 rounded">
            Select Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 rounded"
          >
            <option value="all">All</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div> */}

        <div>
          <label className="block font-semibold dark:bg-gray-800 rounded">
            Chart Type:
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 rounded"
          >
            <option value="pie">Pie</option>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6 dark:bg-gray-800 rounded">
        <div className="bg-green-100 p-4 rounded dark:bg-gray-800 rounded">
          <h4 className="text-lg font-semibold">Income</h4>
          <p className="text-xl font-bold text-green-800">
            {formatAmount(totalIncome)}
          </p>
        </div>
        <div className="bg-red-100 p-4 rounded dark:bg-gray-800 rounded">
          <h4 className="text-lg font-semibold">Expense</h4>
          <p className="text-xl font-bold text-red-800">
            {formatAmount(totalExpense)}
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded dark:bg-gray-800 rounded">
          <h4 className="text-lg font-semibold">Balance</h4>
          <p className="text-xl font-bold text-blue-800">
            {formatAmount(balance)}
          </p>
        </div>
      </div>

      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
        {chartType === "pie" && <Pie data={chartData} options={chartOptions} />}
        {chartType === "bar" && <Bar data={chartData} options={chartOptions} />}
        {chartType === "line" && (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
