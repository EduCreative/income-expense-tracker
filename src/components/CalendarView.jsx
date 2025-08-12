import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export default function CalendarView() {
  const { userData } = useAuth();
  const [expensesByDate, setExpensesByDate] = useState({});
  const [value, setValue] = useState(new Date());

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "transactions")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const dailyTotals = {};

      snapshot.forEach((doc) => {
        const tx = doc.data();
        if (tx.type !== "expense" || !tx.date?.seconds) return;

        const date = dayjs.unix(tx.date.seconds).format("YYYY-MM-DD");
        dailyTotals[date] = (dailyTotals[date] || 0) + tx.amount;
      });

      setExpensesByDate(dailyTotals);
    });

    return () => unsub();
  }, [userData?.familyID]);

  const tileContent = ({ date }) => {
    const key = dayjs(date).format("YYYY-MM-DD");
    const total = expensesByDate[key];

    return total ? (
      <div className="text-xs text-red-600 mt-1 font-semibold dark:bg-gray-800 rounded">
        Rs. {total.toLocaleString("en-PK")}
      </div>
    ) : null;
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-4 dark:bg-gray-800 rounded">
      <h3 className="text-xl font-bold mb-4">📆 Calendar View (Expenses)</h3>
      <Calendar
        onChange={setValue}
        value={value}
        tileContent={tileContent}
        className="mx-auto border-none dark:bg-gray-800 rounded"
        calendarType="gregory"
        locale="en-GB"
      />
    </div>
  );
}
