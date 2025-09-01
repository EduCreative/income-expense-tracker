import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export default function CalendarView() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [expensesByDate, setExpensesByDate] = useState({});
  const [value, setValue] = useState(new Date());

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const txs = [];
      const dailyTotals = {};

      snapshot.forEach((doc) => {
        const tx = doc.data();
        txs.push(tx);

        if (!tx.date?.seconds) return;
        const date = dayjs.unix(tx.date.seconds).format("YYYY-MM-DD");

        if (tx.type === "expense") {
          dailyTotals[date] = (dailyTotals[date] || 0) - tx.amount; // negative for expense
        } else if (tx.type === "income") {
          dailyTotals[date] = (dailyTotals[date] || 0) + tx.amount;
        }
      });

      setTransactions(txs);
      setExpensesByDate(dailyTotals);
    });

    return () => unsub();
  }, [userData?.familyID]);

  // Calculate monthly summary
  const currentMonth = dayjs(value).format("YYYY-MM");
  const monthlyTx = transactions.filter(
    (tx) => dayjs.unix(tx.date?.seconds || 0).format("YYYY-MM") === currentMonth
  );

  const income = monthlyTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = monthlyTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = income - expense;

  const tileContent = ({ date }) => {
    const key = dayjs(date).format("YYYY-MM-DD");
    const total = expensesByDate[key];

    if (!total) return null;

    return (
      <div
        className={`mt-1 text-[10px] font-bold px-1 rounded ${
          total < 0
            ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
            : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
        }`}
        style={{ minWidth: "40px", textAlign: "center" }}
      >
        Rs. {Math.abs(total).toLocaleString("en-PK")}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 mt-6">
      <h3 className="text-2xl font-bold mb-4 text-center">📆 Calendar View</h3>
      <Calendar
        onChange={setValue}
        value={value}
        tileContent={tileContent}
        className="mx-auto border-none custom-calendar dark:bg-gray-800"
        calendarType="gregory"
        locale="en-GB"
      />
      Monthly Summary Section
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-xl text-center shadow">
          <h4 className="text-lg font-semibold text-green-700 dark:text-green-300">
            Income
          </h4>
          <p className="text-xl font-bold text-green-800 dark:text-green-200">
            Rs. {income.toLocaleString("en-PK")}
          </p>
        </div>

        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-xl text-center shadow">
          <h4 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Expense
          </h4>
          <p className="text-xl font-bold text-red-800 dark:text-red-200">
            Rs. {expense.toLocaleString("en-PK")}
          </p>
        </div>

        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-xl text-center shadow">
          <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            Balance
          </h4>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
            Rs. {balance.toLocaleString("en-PK")}
          </p>
        </div>
      </div>{" "}
      <style>{`
        /* Make calendar cells bigger and more stylish */
        .custom-calendar .react-calendar__tile {
          height: 80px;
          font-size: 14px;
          border-radius: 12px;
          transition: all 0.2s ease-in-out;
        }
        .custom-calendar .react-calendar__tile:enabled:hover {
          background: #e0f2fe;
          transform: scale(1.05);
        }
        .custom-calendar .react-calendar__tile--now {
          background: #dbeafe;
          border-radius: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
