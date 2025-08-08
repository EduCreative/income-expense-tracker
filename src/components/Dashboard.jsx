import React from "react";
import IncomeForm from "./IncomeForm";
import ExpenseForm from "./ExpenseForm";
import TransactionTable from "./TransactionTable";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MonthlySummary from "./MonthlySummary";
import Charts from "./Charts";
import BackupRestore from "./BackupRestore";
import DailyChart from "./DailyChart";
import CalendarView from "./CalendarView";


export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-900 p-4 overflow-auto">
          {/* Forms and Tables */}
          <MonthlySummary />

          <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            {" "}
            <a href="/categories" className="hover:underline">
              Manage Categories
            </a>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ExpenseForm />
            <IncomeForm />
          </div>
          <TransactionTable />
<<<<<<< HEAD
          <DailyChart />
          <CalendarView />
          {/* <MonthlySummary2 selectedDate={selectedDate} /> */}

          <Charts />
=======
          <CalendarView />;
>>>>>>> parent of a637069 (Solved Category Issue (familyID))
          <BackupRestore />
        </div>
      </div>
    </div>
  );
}
