import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut, Pie, Radar } from "react-chartjs-2";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

export default function DailyChart() {
  const { userData } = useAuth();
  const [chartType, setChartType] = useState("bar");
  const [mode, setMode] = useState("expense"); // "expense", "income", "both"
  const [dailyData, setDailyData] = useState({
    labels: [],
    expenses: [],
    incomes: [],
  });
  const [fromDate, setFromDate] = useState(
    dayjs().subtract(15, "day").format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [summary, setSummary] = useState({
    total: 0,
    avg: 0,
    highestDay: "-",
    highestAmount: 0,
    expensePct: 0,
    incomePct: 0,
  });

  useEffect(() => {
    if (!userData?.familyID) return;

    const start = dayjs(fromDate);
    const end = dayjs(toDate);

    const initialMapExpenses = {};
    const initialMapIncomes = {};
    let curr = start;
    while (curr.isBefore(end) || curr.isSame(end, "day")) {
      const key = curr.format("DD/MMM");
      initialMapExpenses[key] = 0;
      initialMapIncomes[key] = 0;
      curr = curr.add(1, "day");
    }

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const mapExpenses = { ...initialMapExpenses };
      const mapIncomes = { ...initialMapIncomes };

      snapshot.forEach((doc) => {
        const tx = doc.data();

        let txDate;
        if (tx.date && typeof tx.date.toDate === "function") {
          txDate = dayjs(tx.date.toDate());
        } else {
          txDate = dayjs(tx.date);
        }
        if (!txDate.isValid()) return;

        if (txDate.isBefore(start) || txDate.isAfter(end)) return;

        const dateKey = txDate.format("DD/MMM");
        const amount = parseFloat(tx.amount);

        if (tx.type === "expense") {
          mapExpenses[dateKey] = (mapExpenses[dateKey] || 0) + amount;
        } else if (tx.type === "income") {
          mapIncomes[dateKey] = (mapIncomes[dateKey] || 0) + amount;
        }
      });

      const labels = Object.keys(mapExpenses);
      const expenses = labels.map((d) => mapExpenses[d]);
      const incomes = labels.map((d) => mapIncomes[d]);

      let values = [];
      if (mode === "expense") values = expenses;
      else if (mode === "income") values = incomes;
      else values = labels.map((_, i) => incomes[i] - expenses[i]); // net balance

      const total = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? total / values.length : 0;
      let highestDay = "-";
      let highestAmount = 0;
      values.forEach((val, idx) => {
        if (val > highestAmount) {
          highestAmount = val;
          highestDay = labels[idx];
        }
      });

      const totalIncome = incomes.reduce((a, b) => a + b, 0);
      const totalExpense = expenses.reduce((a, b) => a + b, 0);
      const totalAll = totalIncome + totalExpense;
      const expensePct = totalAll > 0 ? (totalExpense / totalAll) * 100 : 0;
      const incomePct = totalAll > 0 ? (totalIncome / totalAll) * 100 : 0;

      setSummary({
        total,
        avg,
        highestDay,
        highestAmount,
        expensePct,
        incomePct,
      });
      setDailyData({ labels, expenses, incomes });
    });

    return () => unsub();
  }, [userData?.familyID, fromDate, toDate, mode]);

  const datasets = [];
  if (mode === "expense") {
    datasets.push({
      label: "Expenses",
      data: dailyData.expenses,
      backgroundColor: "rgba(255, 99, 132, 0.6)",
      borderColor: "rgba(51, 20, 27, 1)",
      fill: chartType === "line" || chartType === "radar",
      tension: 0.4,
    });
  } else if (mode === "income") {
    datasets.push({
      label: "Income",
      data: dailyData.incomes,
      backgroundColor: "rgba(75, 192, 192, 0.6)",
      borderColor: "rgba(75, 192, 192, 1)",
      fill: chartType === "line" || chartType === "radar",
      tension: 0.4,
    });
  } else {
    datasets.push(
      {
        label: "Income",
        data: dailyData.incomes,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: dailyData.expenses,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        tension: 0.4,
      }
    );
  }

  const data = {
    labels: dailyData.labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text:
          mode === "expense"
            ? "Daily Expenses"
            : mode === "income"
            ? "Daily Income"
            : "Income vs Expenses",
      },
    },
    scales:
      chartType === "bar" || chartType === "line"
        ? {
            x: { ticks: { maxRotation: 90, minRotation: 45 } },
            y: { beginAtZero: true },
          }
        : {},
  };

  const chartComponents = {
    bar: <Bar data={data} options={options} />,
    line: <Line data={data} options={options} />,
    doughnut: <Doughnut data={data} options={options} />,
    pie: <Pie data={data} options={options} />,
    radar: <Radar data={data} options={options} />,
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mt-6">
      {/* Heading */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Day-to-Day Progress
      </h2>

      {/* Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-200">
            Total
          </h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-white">
            Rs {summary.total.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-200">
            Avg / Day
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-white">
            Rs {summary.avg.toFixed(0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-200">
            Highest Day
          </h3>
          <p className="text-md font-medium text-red-900 dark:text-white">
            {summary.highestDay} ({summary.highestAmount.toLocaleString()} Rs)
          </p>
        </div>
        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-200">
            Expense vs Income
          </h3>
          <p className="text-md font-medium text-purple-900 dark:text-white">
            {summary.expensePct.toFixed(1)}% Expenses /{" "}
            {summary.incomePct.toFixed(1)}% Income
          </p>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        {/* Date Pickers */}
        <div className="flex gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 border rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 border rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Chart Type Selector */}
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white"
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="doughnut">Doughnut</option>
          <option value="pie">Pie</option>
          <option value="radar">Radar</option>
        </select>

        {/* Mode Selector */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white"
        >
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Chart */}
      <div className="w-full h-[400px]">{chartComponents[chartType]}</div>
    </div>
  );
}
