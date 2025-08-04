import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { auth } from "../firebase";
import { QRCodeCanvas } from "qrcode.react";
import logo from "../logo.png"; // ✅ Optional: replace with your own logo

export default function Header() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { toggleTheme, theme } = useTheme();

  const [showQR, setShowQR] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  const inviteLink = `${window.location.origin}/signup?familyID=${userData?.familyID}`;

  return (
    <header className="bg-gray-800 text-white shadow px-4 py-3 flex flex-col md:flex-row justify-between items-center relative z-20">
      {/* Left: Logo + App Name + Role */}
      <div className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-8 h-8 rounded" />
        <span className="text-xl font-bold">Income Expense Tracker</span>
        {userData?.role && (
          <span className="bg-blue-600 px-2 py-1 rounded text-sm capitalize">
            {userData.role}
          </span>
        )}
      </div>

      {/* Right: User controls */}
      <div className="flex items-center gap-3 flex-wrap mt-2 md:mt-0">
        {userData?.name && <span className="text-sm">{userData.name}</span>}

        {userData?.role === "Owner" && (
          <>
            <button
              onClick={() => setShowQR(!showQR)}
              className="bg-green-700 hover:bg-green-800 text-xs px-3 py-1 rounded"
            >
              {showQR ? "Hide QR" : "Show QR"}
            </button>

            {showQR && (
              <div className="absolute top-full right-4 mt-2 bg-white text-black p-4 rounded shadow z-50 w-64 max-w-full">
                <p className="font-semibold text-sm mb-2">Invite Link:</p>
                <QRCodeCanvas value={inviteLink} size={128} />
                <p className="text-xs mt-2 break-all">{inviteLink}</p>
              </div>
            )}
          </>
        )}

        {deferredPrompt && (
          <button
            onClick={handleInstallApp}
            className="bg-yellow-500 text-black text-xs px-3 py-1 rounded hover:bg-yellow-600"
          >
            Install App
          </button>
        )}

        <button title="Toggle Theme" onClick={toggleTheme} className="text-lg">
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
