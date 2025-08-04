import React from "react";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-100 p-4 hidden md:block dark:bg-[#2f2f4f]">
      {/* <aside className="w-48 bg-gray-200 h-full p-4 shadow"> */}
      <ul className="space-y-2">
        <li className="hover:underline cursor-pointer">Dashboard</li>
        <li className="hover:underline cursor-pointer">Add Income</li>
        <li className="hover:underline cursor-pointer">Add Expense</li>
        <li className="hover:underline cursor-pointer">Reports</li>
        <li className="hover:underline cursor-pointer">Settings</li>
      </ul>
      {/* </aside> */}
    </div>
  );
}
