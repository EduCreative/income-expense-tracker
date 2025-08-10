import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-gray-500",
];

// const EMOJIS = ["💰", "🍔", "🚗", "🏠", "📱", "🎉", "💼", "🛒"];
const EMOJIS = [
  "💰",
  "🍔",
  "🚗",
  "🏠",
  "📱",
  "🎉",
  "💼",
  "🛒",
  "🎮",
  "📚",
  "🎧",
  "🧠",
  "🧳",
  "✈️",
  "🌍",
  "🏖️",
  "🍕",
  "🍩",
  "🍿",
  "🍎",
  "🍇",
  "🍣",
  "🍜",
  "🥤",
  "🐶",
  "🐱",
  "🐼",
  "🦄",
  "🐢",
  "🐠",
  "🐦",
  "🐘",
  "🌟",
  "🔥",
  "⚡",
  "💎",
  "🧊",
  "🌈",
  "☀️",
  "🌙",
  "🧘",
  "🏋️",
  "🚴",
  "🏃",
  "🎨",
  "🎭",
  "🎵",
  "🎬",
  "🧩",
  "🕹️",
  "🧸",
  "📦",
  "🗺️",
  "🧪",
  "🔮",
  "🛠️",
  "🧥",
  "👟",
  "🎓",
  "💡",
  "🖼️",
  "🕰️",
  "📷",
  "🖊️",
];

export default function CategoryManager() {
  const { userData, currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    type: "income",
    color: COLORS[0],
    icon: EMOJIS[0],
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!userData?.familyID) return;

    const q = query(
      collection(db, "families", userData.familyID, "categories")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(list);
    });

    return () => unsub();
  }, [userData?.familyID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "families", userData.familyID, "categories", editingId),
          form
        );
      } else {
        await addDoc(
          collection(db, "families", userData.familyID, "categories"),
          {
            ...form,
            createdBy: currentUser.uid,
          }
        );
      }
      setForm({ name: "", type: "income", color: COLORS[0], icon: EMOJIS[0] });
      setEditingId(null);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Delete this category?");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, "families", userData.familyID, "categories", id));
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const startEdit = (cat) => {
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
    });
    setEditingId(cat.id);
  };

  const cancelEdit = () => {
    setForm({ name: "", type: "income", color: COLORS[0], icon: EMOJIS[0] });
    setEditingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        onClick={() => (window.location.href = "/dashboard")}
        className="mb-4 text-blue-600 underline hover:text-blue-800"
      >
        ← Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded w-full"
            required
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <div>
            <label className="block mb-1 font-semibold">Choose Color:</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-6 h-6 rounded-full cursor-pointer ${color} border-2 ${
                    form.color === color ? "border-black" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Choose Icon:</label>
            <div className="flex gap-2 flex-wrap text-xl">
              {EMOJIS.map((emoji) => (
                <span
                  key={emoji}
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`cursor-pointer border px-2 rounded ${
                    form.icon === emoji ? "border-black" : "border-transparent"
                  }`}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            {editingId ? "Update Category" : "Add Category"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-500 underline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Category Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {["income", "expense"].map((type) => (
          <div key={type}>
            <h3 className="text-xl font-semibold mb-2 capitalize">
              {type} Categories
            </h3>
            <ul className="space-y-2">
              {categories
                .filter((cat) => cat.type === type)
                .map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${cat.color}`} />
                      <span className="text-xl">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      {cat.createdBy === currentUser.uid && (
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
