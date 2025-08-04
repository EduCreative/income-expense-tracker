import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { QRCodeCanvas } from "qrcode.react";

export default function Header() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const [showQR, setShowQR] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installable, setInstallable] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
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
        setInstallable(false);
      }
    }
  };

  const inviteLink = `${window.location.origin}/signup?familyID=${userData?.familyID}`;

  return (
    <header className="flex flex-col gap-2 md:flex-row justify-between items-center px-4 py-2 bg-gray-800 text-white shadow">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">💰 Income Expense Tracker</span>
        {userData?.role && (
          <span className="text-sm bg-blue-600 px-2 py-1 rounded capitalize">
            {userData.role}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
        {userData?.name && <span>{userData.name}</span>}

        {userData?.role === "Owner" && (
          <>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm bg-green-700 hover:bg-green-800 px-3 py-1 rounded"
            >
              Invite QR
            </button>

            {showQR && (
              <div className="absolute top-20 z-50 bg-white p-4 rounded shadow text-black">
                <p className="mb-2 font-semibold">Invite Link:</p>
                <QRCodeCanvas value={inviteLink} />
                <p className="mt-2 text-xs">{inviteLink}</p>
              </div>
            )}
          </>
        )}

        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="bg-indigo-600 text-white px-3 py-1 rounded"
          >
            Install App
          </button>
        )}
        {/* {installable && (
          <button
            onClick={handleInstallApp}
            className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600"
          >
            Install App
          </button>
        )} */}

        <button title="Toggle Theme" onClick={toggleTheme}>
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
