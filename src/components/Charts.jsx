import React, { useEffect, useState, useRef } from "react";
import { Pie, Bar, Line, Doughnut, PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export default function Charts() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  // Chart refs for export to PDF
  const incomeChartRef = useRef(null);
  const expenseChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const comparisonChartRef = useRef(null);

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const txs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let txDate = data.date?.toDate
          ? data.date.toDate()
          : new Date(data.date);

        txs.push({
          ...data,
          date: txDate,
        });
      });
      setTransactions(txs);
    });

    return () => unsub();
  }, [userData?.familyID]);

  // Filter and sort transactions
  const filteredTx = transactions
    .filter(
      (tx) => tx.date >= new Date(fromDate) && tx.date <= new Date(toDate)
    )
    .sort((a, b) => a.date - b.date);

  // Running balance
  let runningBalance = 0;
  const txWithBalance = filteredTx.map((t) => {
    if (t.type === "income") runningBalance += t.amount;
    else if (t.type === "expense") runningBalance -= t.amount;

    return {
      ...t,
      balance: runningBalance,
    };
  });

  // Aggregations
  const incomeData = {};
  const expenseData = {};
  let totalIncome = 0;
  let totalExpense = 0;

  filteredTx.forEach((tx) => {
    const cat = tx.category || "Uncategorized";
    if (tx.type === "income") {
      incomeData[cat] = (incomeData[cat] || 0) + tx.amount;
      totalIncome += tx.amount;
    } else if (tx.type === "expense") {
      expenseData[cat] = (expenseData[cat] || 0) + tx.amount;
      totalExpense += tx.amount;
    }
  });

  const buildChartData = (dataMap) => ({
    labels: Object.keys(dataMap),
    datasets: [
      {
        data: Object.values(dataMap),
        backgroundColor: [
          "#4CAF50",
          "#F44336",
          "#2196F3",
          "#FF9800",
          "#9C27B0",
          "#00BCD4",
          "#795548",
          "#E91E63",
          "#607D8B",
          "#8BC34A",
        ],
      },
    ],
  });

  // Trend chart
  const trendLabels = [
    ...new Set(filteredTx.map((t) => t.date.toISOString().split("T")[0])),
  ].sort();
  const incomeTrend = trendLabels.map((d) =>
    filteredTx
      .filter(
        (t) => t.type === "income" && t.date.toISOString().split("T")[0] === d
      )
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenseTrend = trendLabels.map((d) =>
    filteredTx
      .filter(
        (t) => t.type === "expense" && t.date.toISOString().split("T")[0] === d
      )
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Income",
        data: incomeTrend,
        borderColor: "green",
        fill: true,
        backgroundColor: "rgba(76,175,80,0.2)",
      },
      {
        label: "Expense",
        data: expenseTrend,
        borderColor: "red",
        fill: true,
        backgroundColor: "rgba(244,67,54,0.2)",
      },
    ],
  };

  // Bar comparison
  const barData = {
    labels: [
      ...new Set([...Object.keys(incomeData), ...Object.keys(expenseData)]),
    ],
    datasets: [
      {
        label: "Income",
        data: Object.keys(incomeData).map((k) => incomeData[k] || 0),
        backgroundColor: "rgba(76,175,80,0.6)",
      },
      {
        label: "Expense",
        data: Object.keys(expenseData).map((k) => expenseData[k] || 0),
        backgroundColor: "rgba(244,67,54,0.6)",
      },
    ],
  };

  // Helpers
  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatAmount = (amt) =>
    amt ? `Rs. ${amt.toLocaleString("en-IN")}` : "";

  // CSV export
  const exportCSV = () => {
    let csv = "Date,Type,Category,Credit,Debit,Balance\n";
    txWithBalance.forEach((t) => {
      csv += `${formatDate(t.date)},${t.type},${t.category},${
        t.type === "income" ? formatAmount(t.amount) : ""
      },${t.type === "expense" ? formatAmount(t.amount) : ""},${formatAmount(
        t.balance
      )}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${fromDate}_to_${toDate}.csv`;
    a.click();
  };

  // Excel export
  const exportExcel = () => {
    const rows = txWithBalance.map((t) => ({
      Date: formatDate(t.date),
      Type: t.type,
      Category: t.category,
      Credit: t.type === "income" ? formatAmount(t.amount) : "",
      Debit: t.type === "expense" ? formatAmount(t.amount) : "",
      Balance: formatAmount(t.balance),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${fromDate}_to_${toDate}.xlsx`);
  };

  // PDF export
  const exportPDF = async () => {
    const doc = new jsPDF();
    doc.text("Transaction Report", 14, 16);

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Type", "Category", "Credit", "Debit", "Balance"]],
      body: txWithBalance.map((t) => [
        formatDate(t.date),
        t.type,
        t.category,
        t.type === "income" ? formatAmount(t.amount) : "",
        t.type === "expense" ? formatAmount(t.amount) : "",
        formatAmount(t.balance),
      ]),
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.row.raw[1] === "income") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Income by Category
    doc.addPage();
    doc.text("Income by Category", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Category", "Amount"]],
      body: Object.entries(incomeData).map(([cat, amt]) => [
        cat,
        formatAmount(amt),
      ]),
    });

    // Expense by Category
    doc.addPage();
    doc.text("Expense by Category", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [["Category", "Amount"]],
      body: Object.entries(expenseData).map(([cat, amt]) => [
        cat,
        formatAmount(amt),
      ]),
    });

    // Charts in PDF
    const charts = [
      incomeChartRef.current,
      expenseChartRef.current,
      trendChartRef.current,
      comparisonChartRef.current,
    ];
    for (const chart of charts) {
      if (chart) {
        doc.addPage();
        doc.addImage(chart.toBase64Image(), "PNG", 15, 40, 180, 100);
      }
    }

    doc.save(`transactions_${fromDate}_to_${toDate}.pdf`);
  };

  const balance = totalIncome - totalExpense;

  // Dropdown for charts
  const [chartType, setChartType] = useState({
    income: "pie",
    expense: "pie",
    trend: "line",
    comparison: "bar",
  });

  const chartComponents = {
    pie: Pie,
    doughnut: Doughnut,
    polarArea: PolarArea,
    bar: Bar,
    line: Line,
  };

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Category Insights</h2>

      {/* Date Filters */}
      <div className="flex gap-4 mb-4">
        <div>
          <label className="text-sm">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded ml-2"
          />
        </div>
        <div>
          <label className="text-sm">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded ml-2"
          />
        </div>
        <button
          onClick={exportCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
        <button
          onClick={exportExcel}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
        <button
          onClick={exportPDF}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded text-center">
          <h4 className="font-bold">Total Income</h4>
          <p className="text-lg font-semibold">{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded text-center">
          <h4 className="font-bold">Total Expense</h4>
          <p className="text-lg font-semibold">{formatAmount(totalExpense)}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded text-center">
          <h4 className="font-bold">Balance</h4>
          <p className="text-lg font-semibold">{formatAmount(balance)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded shadow bg-white dark:bg-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Income by Category</h3>
            <select
              value={chartType.income}
              onChange={(e) =>
                setChartType({ ...chartType, income: e.target.value })
              }
              className="border p-1 rounded"
            >
              <option value="pie">Pie</option>
              <option value="doughnut">Doughnut</option>
              <option value="polarArea">Polar Area</option>
            </select>
          </div>
          {Object.keys(incomeData).length > 0 ? (
            React.createElement(chartComponents[chartType.income], {
              data: buildChartData(incomeData),
              ref: incomeChartRef,
            })
          ) : (
            <p>No income data</p>
          )}
        </div>

        <div className="p-4 rounded shadow bg-white dark:bg-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Expense by Category</h3>
            <select
              value={chartType.expense}
              onChange={(e) =>
                setChartType({ ...chartType, expense: e.target.value })
              }
              className="border p-1 rounded"
            >
              <option value="pie">Pie</option>
              <option value="doughnut">Doughnut</option>
              <option value="polarArea">Polar Area</option>
            </select>
          </div>
          {Object.keys(expenseData).length > 0 ? (
            React.createElement(chartComponents[chartType.expense], {
              data: buildChartData(expenseData),
              ref: expenseChartRef,
            })
          ) : (
            <p>No expense data</p>
          )}
        </div>
      </div>

      {/* Trend Line */}
      <div className="p-4 rounded shadow bg-white dark:bg-gray-700 mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Trend Over Time</h3>
          <select
            value={chartType.trend}
            onChange={(e) =>
              setChartType({ ...chartType, trend: e.target.value })
            }
            className="border p-1 rounded"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>
        </div>
        {trendLabels.length > 0 ? (
          React.createElement(chartComponents[chartType.trend], {
            data: trendData,
            ref: trendChartRef,
          })
        ) : (
          <p>No trend data</p>
        )}
      </div>

      {/* Comparison */}
      <div className="p-4 rounded shadow bg-white dark:bg-gray-700 mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Income vs Expense by Category</h3>
          <select
            value={chartType.comparison}
            onChange={(e) =>
              setChartType({ ...chartType, comparison: e.target.value })
            }
            className="border p-1 rounded"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
          </select>
        </div>
        {Object.keys(incomeData).length > 0 ||
        Object.keys(expenseData).length > 0 ? (
          React.createElement(chartComponents[chartType.comparison], {
            data: barData,
            ref: comparisonChartRef,
          })
        ) : (
          <p>No comparison data</p>
        )}
      </div>
    </div>
  );
}
