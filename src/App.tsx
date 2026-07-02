import React, { useState, useEffect } from "react";
import LoginPortal from "./components/LoginPortal";
import AdminDashboard from "./components/AdminDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

async function syncOfflineData() {
  const localDb = localStorage.getItem("gymsync_db");
  if (!localDb) return;
  try {
    const parsed = JSON.parse(localDb);
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.db) {
        localStorage.setItem("gymsync_db", JSON.stringify(data.db));
        console.log("Offline data synchronized with server successfully.");
        // Dispatch custom event to notify all components to reload data
        window.dispatchEvent(new Event("gymsync_data_synced"));
      }
    }
  } catch (err) {
    console.warn("Failed to automatically synchronize offline data:", err);
  }
}

export default function App() {
  // Load initial session state from localStorage to prevent flash of login screen
  const [userRole, setUserRole] = useState<"admin" | "manager" | null>(() => {
    return (localStorage.getItem("userRole") as "admin" | "manager" | null) || null;
  });
  const [activeGymId, setActiveGymId] = useState<string | undefined>(() => {
    return localStorage.getItem("activeGymId") || undefined;
  });

  // Sync on load and when online event fires
  useEffect(() => {
    if (navigator.onLine) {
      syncOfflineData();
    }

    const handleOnline = () => {
      syncOfflineData();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Track sub-tabs and sub-views to keep them in URL
  const [adminTab, setAdminTab] = useState<"gyms" | "sanity" | "logs" | "reports">((() => {
    const cached = localStorage.getItem("adminActiveTab") as any;
    return ["gyms", "sanity", "logs", "reports"].includes(cached) ? cached : "gyms";
  }));
  const [managerView, setManagerView] = useState<"members" | "sessions" | "stats" | "config" | "logs">((() => {
    const activeGymId = localStorage.getItem("activeGymId");
    const cached = localStorage.getItem(`activeView_${activeGymId}`) as any;
    return ["members", "sessions", "stats", "config", "logs"].includes(cached) ? cached : "members";
  }));

  // Keep state synchronized with hash URL routing and vice versa
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const storedRole = localStorage.getItem("userRole") as "admin" | "manager" | null;
      const storedGymId = localStorage.getItem("activeGymId") || undefined;

      if (hash.startsWith("#/admin")) {
        if (storedRole !== "admin") {
          window.location.hash = "#/login";
          return;
        }
        setUserRole("admin");
        setActiveGymId(undefined);
        
        // Parse sub-tab
        const parts = hash.split("/");
        const tab = parts[2] as "gyms" | "sanity" | "logs" | "reports";
        if (["gyms", "sanity", "logs", "reports"].includes(tab)) {
          setAdminTab(tab);
        } else {
          window.location.hash = `#/admin/${adminTab}`;
        }
      } else if (hash.startsWith("#/manager/")) {
        if (storedRole !== "manager") {
          window.location.hash = "#/login";
          return;
        }
        const parts = hash.split("/");
        const gymId = parts[2];
        const view = parts[3] as "members" | "sessions" | "stats" | "config" | "logs";

        if (gymId && gymId === storedGymId) {
          setUserRole("manager");
          setActiveGymId(gymId);
          if (["members", "sessions", "stats", "config", "logs"].includes(view)) {
            setManagerView(view);
          } else {
            window.location.hash = `#/manager/${gymId}/${managerView}`;
          }
        } else {
          window.location.hash = storedGymId ? `#/manager/${storedGymId}/${managerView}` : "#/login";
        }
      } else if (hash === "#/login" || !hash) {
        if (storedRole === "admin") {
          window.location.hash = `#/admin/${adminTab}`;
        } else if (storedRole === "manager" && storedGymId) {
          window.location.hash = `#/manager/${storedGymId}/${managerView}`;
        } else {
          setUserRole(null);
          setActiveGymId(undefined);
          window.location.hash = "#/login";
        }
      } else {
        // Fallback for unauthorized route changes
        if (storedRole === "admin") {
          window.location.hash = `#/admin/${adminTab}`;
        } else if (storedRole === "manager" && storedGymId) {
          window.location.hash = `#/manager/${storedGymId}/${managerView}`;
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
  }, [adminTab, managerView]);

  const handleSelectRole = (role: "admin" | "manager", gymId?: string) => {
    localStorage.setItem("userRole", role);
    if (gymId) {
      localStorage.setItem("activeGymId", gymId);
    } else {
      localStorage.removeItem("activeGymId");
    }
    
    setUserRole(role);
    setActiveGymId(gymId);

    // Sync browser hash routing with sub-routes
    if (role === "admin") {
      window.location.hash = `#/admin/${adminTab}`;
    } else if (role === "manager" && gymId) {
      const savedView = localStorage.getItem(`activeView_${gymId}`) || "members";
      window.location.hash = `#/manager/${gymId}/${savedView}`;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("activeGymId");
    setUserRole(null);
    setActiveGymId(undefined);
    window.location.hash = "#/login";
  };

  const handleTabChange = (tab: "gyms" | "sanity" | "logs" | "reports") => {
    setAdminTab(tab);
    localStorage.setItem("adminActiveTab", tab);
    const targetHash = `#/admin/${tab}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  const handleViewChange = (view: "members" | "sessions" | "stats" | "config" | "logs") => {
    setManagerView(view);
    if (activeGymId) {
      localStorage.setItem(`activeView_${activeGymId}`, view);
      const targetHash = `#/manager/${activeGymId}/${view}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-purple-500 selection:text-white">
      {userRole === null && (
        <LoginPortal onSelectRole={handleSelectRole} />
      )}

      {userRole === "admin" && (
        <AdminDashboard 
          onLogout={handleLogout} 
          activeTabProp={adminTab}
          onTabChangeProp={handleTabChange}
        />
      )}

      {userRole === "manager" && activeGymId && (
        <ManagerDashboard 
          gymId={activeGymId} 
          onBack={handleLogout} 
          activeViewProp={managerView}
          onViewChangeProp={handleViewChange}
        />
      )}
    </div>
  );
}
