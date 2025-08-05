import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
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
  Title,
  Tooltip,
  Legend
);

export default function DailyChart() {
  const { userData } = useAuth();
  const [chartType, setChartType] = useState("bar");
  const [dailyExpense, setDailyExpense] = useState({ labels: [], data: [] });

  useEffect(() => {
    if (!userData?.familyID) return;

    const startOfMonth = dayjs().startOf("month");
    const daysInMonth = startOfMonth.daysInMonth();

    // Step 1: Create an empty map for each day
    const initialMap = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const day = startOfMonth.date(i).format("DD/MMM");
      initialMap[day] = 0;
    }

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const map = { ...initialMap };

      snapshot.forEach((doc) => {
        const tx = doc.data();
        if (tx.type !== "expense") return;

        // Step 2: Safely extract and format the transaction date
        let txDate;
        if (tx.date && typeof tx.date.toDate === "function") {
          txDate = dayjs(tx.date.toDate());
        } else {
          txDate = dayjs(tx.date);
        }

        if (!txDate.isValid()) return;

        const isSameMonth =
          txDate.month() === startOfMonth.month() &&
          txDate.year() === startOfMonth.year();
        if (!isSameMonth) return;

        const dateKey = txDate.format("DD/MMM");

        if (map.hasOwnProperty(dateKey)) {
          map[dateKey] += parseFloat(tx.amount);
        } else {
          map[dateKey] = parseFloat(tx.amount); // Just in case
        }
      });

      const labels = Object.keys(map);
      const data = labels.map((d) => map[d]);

      setDailyExpense({ labels, data });
    });

    return () => unsub();
  }, [userData?.familyID]);

  const data = {
    labels: dailyExpense.labels,
    datasets: [
      {
        label: "Daily Expense",
        data: dailyExpense.data,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        fill: chartType === "line",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Daily Expenses (This Month)" },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-6">
      <div className="flex justify-end mb-3 gap-2">
        <button
          onClick={() => setChartType("bar")}
          className={`px-3 py-1 rounded ${
            chartType === "bar"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          Bar
        </button>
        <button
          onClick={() => setChartType("line")}
          className={`px-3 py-1 rounded ${
            chartType === "line"
              ? "bg-blue-600 text-white"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          Line
        </button>
      </div>
      {chartType === "bar" ? (
        <Bar data={data} options={options} />
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
