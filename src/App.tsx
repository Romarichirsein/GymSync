import React, { useState } from "react";
import LoginPortal from "./components/LoginPortal";
import AdminDashboard from "./components/AdminDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

export default function App() {
  const [userRole, setUserRole] = useState<"admin" | "manager" | null>(null);
  const [activeGymId, setActiveGymId] = useState<string | undefined>(undefined);

  const handleSelectRole = (role: "admin" | "manager", gymId?: string) => {
    setUserRole(role);
    if (role === "manager") {
      setActiveGymId(gymId);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setActiveGymId(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-purple-500 selection:text-white">
      {userRole === null && (
        <LoginPortal onSelectRole={handleSelectRole} />
      )}

      {userRole === "admin" && (
        <AdminDashboard onLogout={handleLogout} />
      )}

      {userRole === "manager" && activeGymId && (
        <ManagerDashboard gymId={activeGymId} onBack={handleLogout} />
      )}
    </div>
  );
}
