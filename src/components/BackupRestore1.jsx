import React, { useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function BackupRestore() {
  const fileInputRef = useRef(null);
  const { userData } = useAuth();

  const handleBackup = async () => {
    if (!userData?.familyID) {
      alert("Family ID not found. Please login again.");
      return;
    }
    try {
      const snapshot = await getDocs(
        collection(db, "families", userData.familyID, "transactions")
      );
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const blob = new Blob([JSON.stringify(transactions, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${new Date().toISOString()}.json`;
      link.click();
    } catch (err) {
      alert("Backup failed: " + err.message);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const transactions = JSON.parse(text);

      for (const tx of transactions) {
        const newDocRef = doc(
          db,
          "families",
          userData.familyID,
          "transactions",
          tx.id || Math.random().toString(36).substr(2, 9)
        );
        await setDoc(newDocRef, {
          ...tx,
          restoredAt: serverTimestamp(),
        });
      }

      alert("Restore successful");
    } catch (err) {
      alert("Restore failed: " + err.message);
    }
  };

  return (
    <div className="my-4 p-4 border rounded bg-gray-50 dark:bg-[#3a3a55]">
      <h3 className="text-lg font-semibold mb-2">Backup & Restore</h3>
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleBackup}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔽 Backup Data
        </button>
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          🔼 Restore Data
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleRestore}
          className="hidden"
        />
      </div>
    </div>
  );
}
