import React from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function BackupRestore() {
  const { userData } = useAuth();

  const handleBackup = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "families", userData.familyID, "transactions")
      );
      const data = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        data.push({
          ...d,
          createdAt:
            d.createdAt?.seconds !== undefined
              ? new Date(d.createdAt.seconds * 1000).toISOString()
              : null,
        });
      });

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Backup failed: " + err.message);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      for (const item of data) {
        await addDoc(
          collection(db, "families", userData.familyID, "transactions"),
          {
            ...item,
            createdAt: item.createdAt
              ? new Date(item.createdAt)
              : serverTimestamp(),
          }
        );
      }

      alert("Restore successful.");
    } catch (err) {
      alert("Restore failed: " + err.message);
    }
  };

  return (
    <div className="mt-4 space-x-4">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleBackup}
      >
        Backup
      </button>
      <label className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700">
        Restore
        <input type="file" onChange={handleRestore} hidden />
      </label>
    </div>
  );
}
