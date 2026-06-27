import React, { useState, useEffect } from "react";
import { Gym, AlertLog, SanityConfig, SubscriptionPlan, Member } from "../types";
import {
  Building2,
  Database,
  History,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders,
  ChevronRight,
  RefreshCw,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  Info,
  BarChart3,
  Users,
  TrendingUp,
  Printer,
  ShieldCheck,
  CalendarRange,
  Lock,
  Unlock,
  MessageSquare,
  Send,
  Bell,
  ShieldAlert,
  Download,
  Code
} from "lucide-react";
import { motion } from "motion/react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // Data State
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sanityConfig, setSanityConfig] = useState<SanityConfig>({
    projectId: "",
    dataset: "",
    token: "",
    useSanity: false,
  });

  // UI Active Tab
  const [activeTab, setActiveTab] = useState<"gyms" | "sanity" | "logs" | "reports">("gyms");

  // Form State
  const [isEditingGym, setIsEditingGym] = useState<boolean>(false);
  const [editingGym, setEditingGym] = useState<Partial<Gym>>({
    name: "",
    slug: "",
    logo: "",
    primaryColor: "#0f766e",
    secondaryColor: "#f97316",
    email: "",
    phone: "",
    address: "",
    managerEmail: "",
    managerPassword: "",
    subscriptionPlans: [
      { id: "p-month", name: "Pass Mensuel", durationMonths: 1, price: 39 },
      { id: "p-quarter", name: "Formule Trimestre", durationMonths: 3, price: 99 },
      { id: "p-year", name: "Abonnement Annuel", durationMonths: 12, price: 349 },
    ],
  });

  // Action status/messages
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Subscription and notification management modal states
  const [selectedGymForManage, setSelectedGymForManage] = useState<Gym | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifMessage, setNotifMessage] = useState<string>("");
  const [notifType, setNotifType] = useState<"info" | "warning" | "danger">("info");
  const [extendExpiryDate, setExtendExpiryDate] = useState<string>("");
  const [reasonMessage, setReasonMessage] = useState<string>("");
  const [sendingNotif, setSendingNotif] = useState<boolean>(false);
  const [savingStatus, setSavingStatus] = useState<boolean>(false);

  // Load Data
  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/gyms").then((res) => res.json()),
      fetch("/api/alerts/logs").then((res) => res.json()),
      fetch("/api/sanity-config").then((res) => res.json()),
      fetch("/api/members").then((res) => res.json()),
    ])
      .then(([gymsData, logsData, sanityData, membersData]) => {
        setGyms(gymsData);
        setAlertLogs(logsData);
        setSanityConfig(sanityData);
        setMembers(membersData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading admin data", err);
        setLoading(false);
        showToast("Erreur lors de la récupération des données", "error");
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExportLogsCSV = () => {
    if (alertLogs.length === 0) {
      showToast("Aucun journal d'activité à exporter.", "info");
      return;
    }
    
    const headers = ["ID d'Alerte", "Nom Adhérent", "Salle de Sport", "Date d'Envoi", "Message Personnalisé", "Jours Avant Échéance"];
    const rows = alertLogs.map((log) => [
      log.id || "",
      log.memberName || "",
      log.gymName || "",
      log.sentAt ? new Date(log.sentAt).toLocaleString("fr-FR") : "",
      (log.customMessage || "").replace(/"/g, '""').replace(/\n/g, ' '),
      log.daysRemaining || 5
    ]);
    
    // Prefix with BOM so Excel parses French accents correctly
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journaux_activite_salles_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Journaux d'activité exportés au format CSV avec succès.", "success");
  };

  const handleExportLogsJSON = () => {
    if (alertLogs.length === 0) {
      showToast("Aucun journal d'activité à exporter.", "info");
      return;
    }
    
    const jsonString = JSON.stringify(alertLogs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journaux_activite_salles_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Journaux d'activité exportés au format JSON avec succès.", "success");
  };

  // Preset branding color palettes for gyms
  const colorPresets = [
    { name: "Teal / Orange", primary: "#0f766e", secondary: "#f97316" },
    { name: "Blue / Amber", primary: "#1e3a8a", secondary: "#f59e0b" },
    { name: "Purple / Cyan", primary: "#581c87", secondary: "#06b6d4" },
    { name: "Red / Dark", primary: "#991b1b", secondary: "#1e293b" },
    { name: "Emerald / Slate", primary: "#064e3b", secondary: "#64748b" },
  ];

  // Slug Generator
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setEditingGym({ ...editingGym, name, slug });
  };

  // Base64 file upload helper for Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 1.5 Mo.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingGym({ ...editingGym, logo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Save Gym
  const handleSaveGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym.name || !editingGym.email) {
      showToast("Veuillez remplir le nom et l'email de la salle.", "error");
      return;
    }

    setLoading(true);
    fetch("/api/gyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingGym),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(`La salle de sport "${data.gym.name}" a été enregistrée avec succès !`, "success");
          setIsEditingGym(false);
          loadData();
        } else {
          showToast("Une erreur est survenue lors de l'enregistrement.", "error");
        }
      })
      .catch((err) => {
        console.error("Save gym failed", err);
        showToast("Impossible d'enregistrer la salle de sport.", "error");
      })
      .finally(() => setLoading(false));
  };

  // Add plan to temporary editing list
  const handleAddPlan = () => {
    const plans = editingGym.subscriptionPlans ? [...editingGym.subscriptionPlans] : [];
    const newPlan: SubscriptionPlan = {
      id: `p-${Date.now()}`,
      name: "Nouvelle Formule",
      durationMonths: 1,
      price: 30,
    };
    setEditingGym({ ...editingGym, subscriptionPlans: [...plans, newPlan] });
  };

  const handleUpdatePlan = (index: number, key: keyof SubscriptionPlan, value: any) => {
    if (!editingGym.subscriptionPlans) return;
    const plans = [...editingGym.subscriptionPlans];
    plans[index] = { ...plans[index], [key]: value };
    setEditingGym({ ...editingGym, subscriptionPlans: plans });
  };

  const handleRemovePlan = (index: number) => {
    if (!editingGym.subscriptionPlans) return;
    const plans = [...editingGym.subscriptionPlans];
    plans.splice(index, 1);
    setEditingGym({ ...editingGym, subscriptionPlans: plans });
  };

  // Save Sanity Configuration
  const handleSaveSanity = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    fetch("/api/sanity-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanityConfig),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(data.message, "success");
          loadData();
        } else {
          showToast(data.message, "error");
        }
      })
      .catch((err) => {
        console.error("Save sanity failed", err);
        showToast("Échec de la configuration Sanity.", "error");
      })
      .finally(() => setLoading(false));
  };

  // Sync current data to Sanity Cloud
  const handleSyncToSanity = () => {
    setSyncing(true);
    showToast("Synchronisation des données en cours...", "info");

    fetch("/api/sanity-config/sync", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(data.message, "success");
        } else {
          showToast(data.message, "error");
        }
      })
      .catch((err) => {
        console.error("Sync failed", err);
        showToast("Erreur réseau pendant la synchronisation.", "error");
      })
      .finally(() => setSyncing(false));
  };

  const handleOpenManageModal = (gym: Gym) => {
    setSelectedGymForManage(gym);
    setNotifTitle("");
    setNotifMessage("");
    setNotifType("info");
    setReasonMessage("");
    
    // Set a default expiry extension date (either current subscription end or +30 days)
    if (gym.subscriptionEnd) {
      setExtendExpiryDate(gym.subscriptionEnd.split('T')[0]);
    } else {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      setExtendExpiryDate(thirtyDays.toISOString().split('T')[0]);
    }
    setIsManageModalOpen(true);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGymForManage) return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast("Veuillez remplir le titre et le contenu du message.", "error");
      return;
    }

    setSendingNotif(true);
    fetch(`/api/gyms/${selectedGymForManage.id}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: notifTitle,
        message: notifMessage,
        type: notifType,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Notification envoyée en temps réel !", "success");
          setNotifTitle("");
          setNotifMessage("");
          
          // Refresh the currently managed gym data in local state
          if (data.gym) {
            setSelectedGymForManage(data.gym);
            setGyms(gyms.map((g) => g.id === data.gym.id ? data.gym : g));
          }
        } else {
          showToast("Erreur lors de l'envoi de la notification.", "error");
        }
      })
      .catch((err) => {
        console.error("Failed to send notification", err);
        showToast("Impossible d'envoyer la notification.", "error");
      })
      .finally(() => setSendingNotif(false));
  };

  const handleUpdateSubscriptionStatus = (status: "active" | "blocked") => {
    if (!selectedGymForManage) return;
    
    setSavingStatus(true);
    fetch(`/api/gyms/${selectedGymForManage.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        subscriptionEnd: extendExpiryDate,
        reason: reasonMessage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const actionWord = status === "active" ? "réactivé" : "suspendu / bloqué";
          showToast(`L'accès de la salle a été ${actionWord} avec succès.`, "success");
          setReasonMessage("");
          
          if (data.gym) {
            setSelectedGymForManage(data.gym);
            setGyms(gyms.map((g) => g.id === data.gym.id ? data.gym : g));
          }
        } else {
          showToast("Erreur lors de la mise à jour du statut.", "error");
        }
      })
      .catch((err) => {
        console.error("Failed to update status", err);
        showToast("Impossible de modifier le statut de l'abonnement.", "error");
      })
      .finally(() => setSavingStatus(false));
  };

  const handleQuickExtendSubscription = (months: number) => {
    if (!selectedGymForManage) return;
    
    const baseDate = selectedGymForManage.subscriptionEnd 
      ? new Date(selectedGymForManage.subscriptionEnd) 
      : new Date();
      
    baseDate.setMonth(baseDate.getMonth() + months);
    const newDateStr = baseDate.toISOString().split('T')[0];
    setExtendExpiryDate(newDateStr);
    showToast(`Nouvelle date calculée : ${newDateStr} (+${months} mois)`, "info");
  };

  const handleEditGymClick = (gym: Gym) => {
    setEditingGym(gym);
    setIsEditingGym(true);
  };

  const handleCreateGymClick = () => {
    setEditingGym({
      name: "",
      slug: "",
      logo: "",
      primaryColor: "#0f766e",
      secondaryColor: "#f97316",
      email: "",
      phone: "",
      address: "",
      managerEmail: "",
      managerPassword: "",
      subscriptionPlans: [
        { id: "p-month", name: "Pass Mensuel", durationMonths: 1, price: 39 },
        { id: "p-quarter", name: "Formule Trimestre", durationMonths: 3, price: 99 },
        { id: "p-year", name: "Abonnement Annuel", durationMonths: 12, price: 349 },
      ],
    });
    setIsEditingGym(true);
  };

  const getMonthlyStats = () => {
    // We want to count members registered in each month of 2026: January to June
    const months = [
      { name: "Jan", label: "Janvier", count: 0 },
      { name: "Feb", label: "Février", count: 0 },
      { name: "Mar", label: "Mars", count: 0 },
      { name: "Apr", label: "Avril", count: 0 },
      { name: "May", label: "Mai", count: 0 },
      { name: "Jun", label: "Juin", count: 0 },
    ];

    members.forEach((member) => {
      if (!member.createdAt) return;
      const date = new Date(member.createdAt);
      const monthIndex = date.getMonth(); // 0 = Jan, 5 = June
      const year = date.getFullYear();
      if (year === 2026 && monthIndex >= 0 && monthIndex <= 5) {
        months[monthIndex].count++;
      }
    });

    return months;
  };

  const getGymMemberDistribution = () => {
    return gyms.map((gym) => {
      const count = members.filter((m) => m.gymId === gym.id).length;
      return {
        name: gym.name,
        count,
        color: gym.primaryColor || "#3b82f6",
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Admin Navbar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
            <Sliders className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-slate-900 tracking-tight">
              Console Super Admin
            </h1>
            <p className="text-xs text-slate-500">GymSync Multi-Tenant SaaS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Mode {sanityConfig.useSanity ? "Cloud Sanity" : "Local Fallback"}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-grow flex-col lg:flex-row max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Left Side: Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex flex-col gap-2">
          <button
            onClick={() => {
              setActiveTab("gyms");
              setIsEditingGym(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
              activeTab === "gyms"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4.5 h-4.5" />
              <span>Salles de Sport</span>
            </div>
            <div className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">
              {gyms.length}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("sanity");
              setIsEditingGym(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
              activeTab === "sanity"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4.5 h-4.5" />
              <span>Configuration Sanity</span>
            </div>
            {sanityConfig.useSanity ? (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("logs");
              setIsEditingGym(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
              activeTab === "logs"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <History className="w-4.5 h-4.5" />
              <span>Journaux des Alertes</span>
            </div>
            <div className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">
              {alertLogs.length}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("reports");
              setIsEditingGym(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
              activeTab === "reports"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4.5 h-4.5" />
              <span>Rapports & Stats</span>
            </div>
            <div className="text-xs bg-blue-100 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold">
              Graphiques
            </div>
          </button>

          {/* Quick instructions block */}
          <div className="mt-8 bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-500 leading-relaxed shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Note Technique</span>
            </h4>
            <p>
              En tant qu'administrateur système, vous supervisez l'infrastructure multi-tenant. Les données saisies s'enregistrent en local ou se synchronisent de manière transparente sur votre CMS Headless Sanity en Cloud.
            </p>
          </div>
        </aside>

        {/* Right Side: Main Dashboard Panel */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: GYMS LIST / EDIT FORM */}
          {activeTab === "gyms" && (
            <div className="space-y-6">
              {!isEditingGym ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-900">
                        Salles de Sport Gérées ({gyms.length})
                      </h2>
                      <p className="text-slate-500 text-sm">
                        Ajoutez, configurez et personnalisez l'image de marque de vos salles clientes.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateGymClick}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une Salle</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-56 bg-white border border-slate-200 animate-pulse rounded-2xl"></div>
                      ))}
                    </div>
                  ) : gyms.length === 0 ? (
                    <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-sm">
                      <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700">Aucune salle de sport</h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                        Commencez par ajouter votre première salle de sport pour permettre à vos gestionnaires de se connecter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {gyms.map((gym) => {
                        const todayDate = new Date();
                        todayDate.setHours(0, 0, 0, 0);
                        const diffDays = gym.subscriptionEnd 
                          ? Math.ceil((new Date(gym.subscriptionEnd).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)) 
                          : 30;

                        return (
                          <motion.div
                            key={gym.id}
                            whileHover={{ y: -3 }}
                            className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm"
                          >
                            <div>
                              {/* Gym Header Branding preview */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {gym.logo ? (
                                    <img
                                      src={gym.logo}
                                      alt={gym.name}
                                      referrerPolicy="no-referrer"
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-bold text-lg">
                                      {gym.name[0]}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <h3 className="font-display font-bold text-base text-slate-900 leading-tight">{gym.name}</h3>
                                      {gym.status === "blocked" ? (
                                        <span className="bg-red-50 text-red-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-red-150">Bloqué</span>
                                      ) : diffDays <= 0 ? (
                                        <span className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-red-150">Expiré</span>
                                      ) : diffDays <= 5 ? (
                                        <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-150 animate-pulse">Alerte {diffDays}j</span>
                                      ) : (
                                        <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-emerald-150">Actif</span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-500 block font-mono">/{gym.slug}</span>
                                  </div>
                                </div>

                                {/* Colors pill */}
                                <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                  <div
                                    className="w-4 h-4 rounded-full border border-slate-300"
                                    style={{ backgroundColor: gym.primaryColor }}
                                    title="Couleur Principale"
                                  />
                                  <div
                                    className="w-4 h-4 rounded-full border border-slate-300"
                                    style={{ backgroundColor: gym.secondaryColor }}
                                    title="Couleur Secondaire"
                                  />
                                </div>
                              </div>

                              {/* Contact info list */}
                              <div className="space-y-1.5 text-xs text-slate-600 mb-6 font-medium">
                                <p className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{gym.email}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{gym.phone || "Non renseigné"}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 truncate" />
                                  <span className="truncate">{gym.address}</span>
                                </p>
                                <p className="flex items-center gap-1.5 border-t border-slate-100 pt-2 mt-2 font-semibold">
                                  <CalendarRange className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Échéance abonnement : <span className={diffDays <= 5 ? "text-red-600 font-bold" : "text-slate-800"}>{gym.subscriptionEnd ? gym.subscriptionEnd.split('T')[0] : "Non configurée"}</span></span>
                                </p>
                              </div>
                            </div>

                            {/* Footer with actions and plans */}
                            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-150 font-medium">
                                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Compte Gérant:</span>
                                <span className="font-mono text-slate-700">{gym.managerEmail || "Non configuré"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-semibold bg-slate-100/60 px-2 py-1 rounded">
                                  {gym.subscriptionPlans?.length || 0} forfaits
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <button
                                  onClick={() => handleEditGymClick(gym)}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all cursor-pointer grow justify-center"
                                >
                                  <span>Modifier Données</span>
                                </button>
                                <button
                                  onClick={() => handleOpenManageModal(gym)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer grow justify-center"
                                >
                                  <Bell className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Abonnement &amp; Alertes</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* EDITING GYM FORM */
                <form onSubmit={handleSaveGym} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-display font-bold text-slate-900">
                      {editingGym.id ? "Modifier la Salle de Sport" : "Créer une nouvelle Salle de Sport"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingGym(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Nom de la salle :
                        </label>
                        <input
                          type="text"
                          required
                          value={editingGym.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Ex: Gold Gym Paris"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Adresse Web / Slug unique :
                        </label>
                        <input
                          type="text"
                          required
                          value={editingGym.slug}
                          onChange={(e) => setEditingGym({ ...editingGym, slug: e.target.value })}
                          placeholder="ex-gold-gym-paris"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-600 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Adresse Email de la salle :
                          </label>
                          <input
                            type="email"
                            required
                            value={editingGym.email}
                            onChange={(e) => setEditingGym({ ...editingGym, email: e.target.value })}
                            placeholder="admin@goldgym.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Téléphone de la salle :
                          </label>
                          <input
                            type="text"
                            value={editingGym.phone}
                            onChange={(e) => setEditingGym({ ...editingGym, phone: e.target.value })}
                            placeholder="+33 1 23 45 67 89"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Adresse postale :
                        </label>
                        <textarea
                          rows={2}
                          value={editingGym.address}
                          onChange={(e) => setEditingGym({ ...editingGym, address: e.target.value })}
                          placeholder="15 Rue de Rivoli, 75001 Paris"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Credentials of Gym Manager */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Compte de Gérant de la Salle</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Définissez les identifiants de connexion du gérant pour cette salle de sport. Les gérants s'y connecteront directement pour gérer les adhérents, paramétrer leur club (logo, couleurs, forfaits d'abonnement) et imprimer les factures.
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Adresse Email du Gérant (Identifiant) :
                            </label>
                            <input
                              type="email"
                              required
                              value={editingGym.managerEmail || ""}
                              onChange={(e) => setEditingGym({ ...editingGym, managerEmail: e.target.value })}
                              placeholder="manager@nomclub.com"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Mot de passe d'accès :
                            </label>
                            <input
                              type="text"
                              required
                              value={editingGym.managerPassword || ""}
                              onChange={(e) => setEditingGym({ ...editingGym, managerPassword: e.target.value })}
                              placeholder="Définir un mot de passe robuste"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subscription Status Block */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CalendarRange className="w-4 h-4 text-blue-600" />
                          <span>Abonnement &amp; Statut de la Salle</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Date de fin d'abonnement :
                            </label>
                            <input
                              type="date"
                              required
                              value={editingGym.subscriptionEnd ? editingGym.subscriptionEnd.split('T')[0] : ""}
                              onChange={(e) => setEditingGym({ ...editingGym, subscriptionEnd: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Statut d'accès :
                            </label>
                            <select
                              value={editingGym.status || "active"}
                              onChange={(e) => setEditingGym({ ...editingGym, status: e.target.value as 'active' | 'blocked' })}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-semibold"
                            >
                              <option value="active">Actif (Accès Autorisé)</option>
                              <option value="blocked">Bloqué (Accès Refusé)</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Si l'accès est bloqué ou si la date d'échéance est dépassée, le gérant sera déconnecté et ne pourra plus s'authentifier.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingGym(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer la Salle</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: SANITY Headless CMS Configuration */}
          {activeTab === "sanity" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Intégration Headless CMS Sanity
                </h2>
                <p className="text-slate-500 text-sm">
                  Connectez GymSync au Cloud pour stocker et synchroniser de manière sécurisée vos salles et adhérents sur Sanity.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credentials Form */}
                <form onSubmit={handleSaveSanity} className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4.5 h-4.5 text-blue-600" />
                      <span>Paramètres de connexion</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Activer le Cloud :</span>
                      <button
                        type="button"
                        onClick={() => setSanityConfig({ ...sanityConfig, useSanity: !sanityConfig.useSanity })}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          sanityConfig.useSanity ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                            sanityConfig.useSanity ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Sanity Project ID :
                      </label>
                      <input
                        type="text"
                        value={sanityConfig.projectId}
                        onChange={(e) => setSanityConfig({ ...sanityConfig, projectId: e.target.value })}
                        placeholder="Ex: abcdefgh (8 caractères)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Dataset :
                      </label>
                      <input
                        type="text"
                        value={sanityConfig.dataset}
                        onChange={(e) => setSanityConfig({ ...sanityConfig, dataset: e.target.value })}
                        placeholder="production"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        API Write Token :
                      </label>
                      <input
                        type="password"
                        value={sanityConfig.token}
                        onChange={(e) => setSanityConfig({ ...sanityConfig, token: e.target.value })}
                        placeholder="sk..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                      L'activation active la synchronisation temps réel. Si désactivé, le système utilise automatiquement le stockage local sécurisé.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Tester & Enregistrer</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Setup Instructions / Sync Actions */}
                <div className="space-y-6">
                  {/* Actions card */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span>Actions Cloud</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Transférez toutes vos données locales (Salles, Adhérents, Factures) vers Sanity en un seul clic !
                    </p>
                    <button
                      type="button"
                      disabled={syncing || !sanityConfig.useSanity}
                      onClick={handleSyncToSanity}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                        syncing
                          ? "bg-slate-100 text-slate-400 border-slate-200 animate-pulse"
                          : !sanityConfig.useSanity
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500/20 shadow-md shadow-blue-500/10 cursor-pointer"
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                      <span>{syncing ? "Synchronisation..." : "Tout pousser sur Sanity"}</span>
                    </button>
                  </div>

                  {/* Schema instructions card */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl text-xs text-slate-500 space-y-3 leading-relaxed shadow-sm">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider">
                      Guide d'Installation Sanity :
                    </h4>
                    <ul className="list-decimal pl-4 space-y-1.5 font-medium">
                      <li>Créez un compte gratuit sur <strong>sanity.io</strong></li>
                      <li>Initiez un projet et nommez le dataset (ex: <i>production</i>)</li>
                      <li>Allez dans l'onglet <strong>API</strong> du gestionnaire Sanity, générez un Token avec les permissions d'édition <strong>"Editor (Write)"</strong>.</li>
                      <li>Collez les informations ci-contre et activez l'intégration !</li>
                    </ul>
                    <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                      Les types de documents créés automatiquement sont : <i>gym</i>, <i>member</i> et <i>invoice</i>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALERT NOTIFICATION LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">
                    Historique des Alertes Automatiques
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Suivez les rappels d'expiration générés par l'IA Gemini et expédiés aux adhérents à 5 jours de la fin de contrat.
                  </p>
                </div>
                {alertLogs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportLogsCSV}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-emerald-200/60 transition-colors cursor-pointer shadow-sm"
                      title="Télécharger l'historique complet au format CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exporter CSV</span>
                    </button>
                    <button
                      onClick={handleExportLogsJSON}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-blue-200/60 transition-colors cursor-pointer shadow-sm"
                      title="Télécharger l'historique complet au format JSON"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Exporter JSON</span>
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white border border-slate-200 animate-pulse rounded-xl"></div>
                  ))}
                </div>
              ) : alertLogs.length === 0 ? (
                <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-sm">
                  <History className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">Aucune alerte enregistrée</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Les journaux apparaîtront ici dès que les gestionnaires de salle généreront ou expédieront des alertes IA de relance.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertLogs.map((log) => (
                    <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm text-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-800 text-sm">{log.memberName}</span>
                          <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {log.gymName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {new Date(log.sentAt || "").toLocaleString("fr-FR")}
                        </div>
                      </div>

                      {log.customMessage && (
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap italic">
                          "{log.customMessage}"
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-1">
                        <span>Alerte générée automatiquement {log.daysRemaining} jours avant la fin d'abonnement</span>
                        <span className="text-blue-600 uppercase tracking-wider font-bold">● ENVOYÉ / NOTIFIÉ</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPORTS & STATISTICS (Rapports et Statistiques) */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">
                    Rapports d'Activité & Statistiques SaaS
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Consultez l'état global de vos salles de sport enregistrées et de leurs adhérents en temps réel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-colors cursor-pointer print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Rapport Global</span>
                </button>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Salles de Sport (Écoles)</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-slate-900">{gyms.length}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">● Actives en temps réel</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Élèves (Adhérents)</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-slate-900">{members.length}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Répartis sur l'ensemble des clubs
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taux d'Activité</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-slate-900">
                    {members.length > 0
                      ? Math.round((members.filter((m) => m.status === "Active").length / members.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    {members.filter((m) => m.status === "Active").length} actifs / {members.filter((m) => m.status === "Expired").length} expirés
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alertes IA Générées</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                      <History className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-slate-900">{alertLogs.length}</p>
                  <p className="text-[10px] text-purple-600 font-bold mt-1">Rappels automatisés à 5 jours</p>
                </div>
              </div>

              {/* Graphical Analysis of Registrations per Month */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Cards */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider mb-6">
                    Inscriptions mensuelles des élèves (2026)
                  </h3>
                  
                  {/* Dynamic Custom Bar Chart */}
                  <div className="h-60 flex items-end justify-between gap-4 pt-4 border-b border-slate-100 px-2">
                    {getMonthlyStats().map((month) => {
                      const maxCount = Math.max(...getMonthlyStats().map((m) => m.count), 1);
                      const heightPercent = (month.count / maxCount) * 100;
                      return (
                        <div key={month.name} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="relative w-full flex flex-col items-center justify-end h-full">
                            {/* Hover tooltip */}
                            <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none">
                              {month.count} élève{month.count > 1 ? "s" : ""}
                            </div>
                            {/* Visual Bar */}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="w-full sm:w-10 bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 rounded-t-lg shadow-sm transition-all"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 font-mono mt-1">
                            {month.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium font-mono px-2">
                    <span>* Graphique mis à jour en temps réel à chaque inscription</span>
                    <span className="text-slate-500 font-bold">Total: {members.length} inscrits</span>
                  </div>
                </div>

                {/* Gym Breakdown Distribution */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">
                      Répartition des élèves par Club
                    </h3>
                    <div className="space-y-4">
                      {getGymMemberDistribution().map((gymItem, idx) => {
                        const total = members.length || 1;
                        const percent = Math.round((gymItem.count / total) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 truncate block max-w-[150px]">{gymItem.name}</span>
                              <span className="font-bold text-slate-500 whitespace-nowrap">
                                {gymItem.count} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  backgroundColor: gymItem.color,
                                  width: `${percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6 text-center text-[11px] text-slate-400 italic">
                    Chaque gérant de club gère ses propres formules tarifaires de manière autonome.
                  </div>
                </div>
              </div>

              {/* Detailed Real-Time Gym Summary Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50">
                  <h3 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Résumé de performance des Écoles Clients (Salles)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-6">Nom de la Salle</th>
                        <th className="py-3 px-6">Compte Gérant</th>
                        <th className="py-3 px-6 text-center">Élèves Totaux</th>
                        <th className="py-3 px-6 text-center">Actifs</th>
                        <th className="py-3 px-6 text-center">Expirés</th>
                        <th className="py-3 px-6 text-right">Statut SaaS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {gyms.map((gym) => {
                        const gymMems = members.filter((m) => m.gymId === gym.id);
                        const activeCount = gymMems.filter((m) => m.status === "Active").length;
                        const expiredCount = gymMems.filter((m) => m.status === "Expired").length;

                        return (
                          <tr key={gym.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-6 font-display font-bold text-slate-950 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gym.primaryColor }} />
                              <span>{gym.name}</span>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-slate-500">{gym.managerEmail || "Non configuré"}</td>
                            <td className="py-3.5 px-6 text-center font-bold text-slate-900">{gymMems.length}</td>
                            <td className="py-3.5 px-6 text-center text-emerald-600 font-semibold">{activeCount}</td>
                            <td className="py-3.5 px-6 text-center text-slate-400">{expiredCount}</td>
                            <td className="py-3.5 px-6 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                                Actif
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SUBSCRIPTION AND NOTIFICATION MANAGEMENT MODAL */}
      {isManageModalOpen && selectedGymForManage && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Panel: Info & Expiry Controls */}
            <div className="md:w-1/2 p-6 bg-slate-50 border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Super Admin • Gestion d'Abonnement</span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
                    {selectedGymForManage.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedGymForManage.id}</p>
                </div>

                {/* Expiry Date Settings */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CalendarRange className="w-4 h-4 text-blue-600" />
                    <span>Modifier la date d'expiration</span>
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date d'échéance :</label>
                    <input
                      type="date"
                      value={extendExpiryDate}
                      onChange={(e) => setExtendExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Quick Extension buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickExtendSubscription(1)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-600 font-bold py-1.5 px-2 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer text-center"
                    >
                      +1 Mois
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExtendSubscription(3)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-600 font-bold py-1.5 px-2 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer text-center"
                    >
                      +3 Mois
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickExtendSubscription(12)}
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-[10px] text-slate-600 font-bold py-1.5 px-2 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer text-center"
                    >
                      +1 An
                    </button>
                  </div>
                </div>

                {/* Lock/Unlock Access Settings */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Statut d'Accès Multi-Tenant</span>
                  </h4>
                  
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Bloquer l'accès suspend instantanément l'authentification du gérant, tout en conservant toutes ses données adhérents intactes.
                  </p>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Raison de l'action (Optionnel) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Facture non réglée ou fin de période d'essai"
                      value={reasonMessage}
                      onChange={(e) => setReasonMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={savingStatus || selectedGymForManage.status === "active"}
                      onClick={() => handleUpdateSubscriptionStatus("active")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedGymForManage.status === "active"
                          ? "bg-slate-50 text-slate-400 border-slate-200"
                          : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10"
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Activer Accès</span>
                    </button>
                    
                    <button
                      type="button"
                      disabled={savingStatus || selectedGymForManage.status === "blocked"}
                      onClick={() => handleUpdateSubscriptionStatus("blocked")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedGymForManage.status === "blocked"
                          ? "bg-slate-50 text-slate-400 border-slate-200"
                          : "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-md shadow-red-500/10"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquer Accès</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageModalOpen(false);
                    setSelectedGymForManage(null);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Fermer la gestion
                </button>
              </div>
            </div>

            {/* Right Panel: Send Custom Real-time Notification & History */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Alerte en temps réel</span>
                  </h4>
                  <h3 className="text-lg font-display font-bold text-slate-900 leading-tight">
                    Informer le Gestionnaire
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Envoyez un message direct ou une alerte d'abonnement qui s'affichera instantanément sur le tableau de bord du gérant.
                  </p>
                </div>

                {/* Form to Send Notification */}
                <form onSubmit={handleSendNotification} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Type de message :</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNotifType("info")}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          notifType === "info"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifType("warning")}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          notifType === "warning"
                            ? "bg-amber-50 border-amber-300 text-amber-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Attention
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifType("danger")}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          notifType === "danger"
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Urgent
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Titre de l'alerte :</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Renouvellement de votre abonnement"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Message d'explications :</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Ex: Votre abonnement GymSync arrive à échéance dans 5 jours. Veuillez procéder au paiement depuis votre espace pour éviter l'interruption."
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={sendingNotif}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingNotif ? "Envoi..." : "Envoyer l'Alerte"}</span>
                    </button>
                  </div>
                </form>

                {/* Notifications History List */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Historique des alertes récentes ({selectedGymForManage.notifications?.length || 0})
                  </h4>
                  
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {!selectedGymForManage.notifications || selectedGymForManage.notifications.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-2">Aucune alerte envoyée pour le moment.</p>
                    ) : (
                      selectedGymForManage.notifications.map((notif) => (
                        <div key={notif.id} className="pt-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-semibold ${
                              notif.type === 'danger' ? 'text-red-600' : notif.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                            }`}>
                              [{notif.type.toUpperCase()}] {notif.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">{notif.message}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              notif.read ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-600 animate-pulse"
                            }`}>
                              {notif.read ? "Lu" : "Non lu"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
