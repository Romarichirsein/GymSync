import React, { useState, useEffect } from "react";
import LoginPortal from "./components/LoginPortal";
import AdminDashboard from "./components/AdminDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

export default function App() {
  // Load initial session state from localStorage to prevent flash of login screen
  const [userRole, setUserRole] = useState<"admin" | "manager" | null>(() => {
    return (localStorage.getItem("userRole") as "admin" | "manager" | null) || null;
  });
  const [activeGymId, setActiveGymId] = useState<string | undefined>(() => {
    return localStorage.getItem("activeGymId") || undefined;
  });

  // Keep state synchronized with hash URL routing and vice versa
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const storedRole = localStorage.getItem("userRole") as "admin" | "manager" | null;
      const storedGymId = localStorage.getItem("activeGymId") || undefined;

      if (hash === "#/admin" && storedRole === "admin") {
        setUserRole("admin");
        setActiveGymId(undefined);
      } else if (hash.startsWith("#/manager/") && storedRole === "manager") {
        const gymId = hash.replace("#/manager/", "");
        if (gymId && gymId === storedGymId) {
          setUserRole("manager");
          setActiveGymId(gymId);
        } else {
          // If the user tries to load a different gym they are not logged into, redirect them
          window.location.hash = storedGymId ? `#/manager/${storedGymId}` : "#/login";
        }
      } else if (hash === "#/login" || !hash) {
        if (storedRole === "admin") {
          window.location.hash = "#/admin";
        } else if (storedRole === "manager" && storedGymId) {
          window.location.hash = `#/manager/${storedGymId}`;
        } else {
          setUserRole(null);
          setActiveGymId(undefined);
          window.location.hash = "#/login";
        }
      } else {
        // Fallback for unauthorized route changes
        if (storedRole === "admin") {
          window.location.hash = "#/admin";
        } else if (storedRole === "manager" && storedGymId) {
          window.location.hash = `#/manager/${storedGymId}`;
        } else {
          window.location.hash = "#/login";
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Trigger on mount

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleSelectRole = (role: "admin" | "manager", gymId?: string) => {
    localStorage.setItem("userRole", role);
    if (gymId) {
      localStorage.setItem("activeGymId", gymId);
    } else {
      localStorage.removeItem("activeGymId");
    }
    
    setUserRole(role);
    setActiveGymId(gymId);

    // Sync browser hash routing
    if (role === "admin") {
      window.location.hash = "#/admin";
    } else if (role === "manager" && gymId) {
      window.location.hash = `#/manager/${gymId}`;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("activeGymId");
    setUserRole(null);
    setActiveGymId(undefined);
    window.location.hash = "#/login";
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
