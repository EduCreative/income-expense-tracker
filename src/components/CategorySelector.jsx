import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function CategorySelector({ type, value, onChange }) {
  const { userData, currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "categories"),
      where("type", "==", type)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        createdBy: doc.data().createdBy,
      }));
      setCategories(list);
    });

    return () => unsub();
  }, [type, userData?.familyID]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await addDoc(
        collection(db, "families", userData.familyID, "categories"),
        {
          type,
          name: newCategory.trim(),
          createdBy: currentUser.uid,
        }
      );
      setNewCategory("");
    } catch (err) {
      alert("Failed to add category: " + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    const confirm = window.confirm(`Delete category "${categoryName}"?`);
    if (!confirm) return;

    // Check if used in transactions
    const txQuery = query(
      collection(db, "families", userData.familyID, "transactions"),
      where("category", "==", categoryName),
      where("type", "==", type)
    );
    const txSnap = await getDocs(txQuery);
    if (!txSnap.empty) {
      alert("This category is in use and cannot be deleted.");
      return;
    }

    try {
      await deleteDoc(
        doc(db, "families", userData.familyID, "categories", categoryId)
      );
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="mb-2">
      <label className="block font-semibold capitalize mb-1">
        {type} Category
      </label>

      {/* Select Dropdown */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 w-full rounded mb-2 dark:bg-gray-800 rounded"
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Add Category */}
      {/*<div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={`Add new ${type} category`}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="bg-gray-700 text-white px-3 rounded hover:bg-gray-800"
        >
          Add
        </button>
      </div> */}

      {/* List + Delete Option */}

      {/* <ul className="space-y-1 text-sm">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded"
          >
            <span>{cat.name}</span>
            {cat.createdBy === currentUser.uid && (
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="text-red-500 text-xs hover:underline"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul> */}
    </div>
  );
}
