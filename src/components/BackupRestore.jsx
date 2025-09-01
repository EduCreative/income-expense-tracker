import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function BackupRestore() {
  const { userData } = useAuth();
  const [lastBackup, setLastBackup] = useState(null);
  const [lastRestore, setLastRestore] = useState(null);

  // Load stored timestamps from Firestore
  useEffect(() => {
    const fetchBackupInfo = async () => {
      if (!userData?.familyID) return;
      const familyRef = doc(db, "families", userData.familyID);
      const snapshot = await getDoc(familyRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.lastBackup)
          setLastBackup(
            new Date(data.lastBackup.seconds * 1000).toLocaleString()
          );
        if (data.lastRestore)
          setLastRestore(
            new Date(data.lastRestore.seconds * 1000).toLocaleString()
          );
      }
    };
    fetchBackupInfo();
  }, [userData?.familyID]);

  const handleBackup = async () => {
    if (!window.confirm("Do you really want to take a backup?")) return;

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

      const now = new Date();
      const timestamp = now
        .toISOString()
        .replace(/[-:]/g, "")
        .replace("T", "_")
        .split(".")[0];
      const fileName = `backup_${timestamp}.json`;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Save in Firestore
      const familyRef = doc(db, "families", userData.familyID);
      await updateDoc(familyRef, { lastBackup: serverTimestamp() });

      setLastBackup(now.toLocaleString());
      alert(`✅ Data is backed up to file: ${fileName}`);
    } catch (err) {
      alert("❌ Backup failed: " + err.message);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm(`Do you really want to restore from ${file.name}?`))
      return;

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

      const now = new Date();

      // Save in Firestore
      const familyRef = doc(db, "families", userData.familyID);
      await updateDoc(familyRef, { lastRestore: serverTimestamp() });

      setLastRestore(now.toLocaleString());
      alert(`✅ Data is restored from file: ${file.name}`);
    } catch (err) {
      alert("❌ Restore failed: " + err.message);
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

      {/* Display last backup/restore info */}
      <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
        {lastBackup && <p>🗄️ Last Backup: {lastBackup}</p>}
        {lastRestore && <p>♻️ Last Restore: {lastRestore}</p>}
      </div>
    </div>
  );
}
