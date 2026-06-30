import React, { useState, useEffect, useRef } from "react";
import { Gym, Member, Invoice, SubscriptionPlan, AlertLog, GymNotification, OneTimeSession } from "../types";
import {
  Users,
  Search,
  Plus,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  Sparkles,
  Mail,
  Phone,
  User,
  Trash2,
  Edit2,
  MapPin,
  ArrowLeft,
  X,
  Upload,
  Printer,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Building,
  Zap,
  TrendingUp,
  Sun,
  Moon,
  Bell,
  Wifi,
  WifiOff,
  History,
  ClipboardList,
  PieChart as ChartIcon
} from "lucide-react";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

interface ManagerDashboardProps {
  gymId: string;
  onBack: () => void;
}

export default function ManagerDashboard({ gymId, onBack }: ManagerDashboardProps) {
  // Offline State
  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== "undefined" ? !navigator.onLine : false);

  // Gym details & brand colors state
  const [gym, setGym] = useState<Gym | null>(() => {
    try {
      const cached = localStorage.getItem(`gym_${gymId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem(`members_${gymId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // If we already have cached data, don't show full-page loading blocker so UI is instant offline!
    try {
      const cached = localStorage.getItem(`members_${gymId}`);
      return !cached;
    } catch {
      return true;
    }
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [notifications, setNotifications] = useState<GymNotification[]>(() => {
    try {
      const cached = localStorage.getItem(`notifications_${gymId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Deep Research / Advanced Filters States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [hasMedicalHistoryFilter, setHasMedicalHistoryFilter] = useState<boolean>(false);
  const [physicalGoalFilter, setPhysicalGoalFilter] = useState<string>("");

  // Form Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);

  // Active Expiration Alerts
  const [expiringMembers, setExpiringMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem(`expiringMembers_${gymId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedAlertMember, setSelectedAlertMember] = useState<Member | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [geminiMessage, setGeminiMessage] = useState<string>("");
  const [generatingAlert, setGeneratingAlert] = useState<boolean>(false);

  // Invoice Modal
  const [selectedInvoiceMember, setSelectedInvoiceMember] = useState<Member | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [invoiceDetails, setInvoiceDetails] = useState<Partial<Invoice> | null>(null);

  // File Upload drag & drop state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chartType, setChartType] = useState<"donut" | "bar">("donut");
  const [shortcutMemberId, setShortcutMemberId] = useState<string>("");

  // One-time sessions state
  const [oneTimeSessions, setOneTimeSessions] = useState<OneTimeSession[]>(() => {
    try {
      const cached = localStorage.getItem(`sessions_${gymId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Manager Custom Settings States
  const [activeView, setActiveView] = useState<"members" | "sessions" | "stats" | "config" | "logs">(() => {
    try {
      const cached = localStorage.getItem(`activeView_${gymId}`) as any;
      return ["members", "sessions", "stats", "config", "logs"].includes(cached) ? cached : "members";
    } catch {
      return "members";
    }
  });
  const [managerLogs, setManagerLogs] = useState<any[]>([]);

  // One-time session form states
  const [sessName, setSessName] = useState("");
  const [sessPhone, setSessPhone] = useState("");
  const [sessAmount, setSessAmount] = useState<number | "other">(1500);
  const [customAmount, setCustomAmount] = useState("");
  const [sessPaymentMethod, setSessPaymentMethod] = useState("Espèces");
  const [sessDate, setSessDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionReportPeriod, setSessionReportPeriod] = useState<"week" | "month">("month");
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [logStartDate, setLogStartDate] = useState<string>("");
  const [logEndDate, setLogEndDate] = useState<string>("");

  const fetchManagerLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/gyms/${gymId}/manager-logs`);
      if (res.ok) {
        const data = await res.json();
        setManagerLogs(data);
      }
    } catch (err) {
      console.error("Error loading manager logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleClearManagerLogs = async () => {
    if (!window.confirm("Voulez-vous vraiment effacer tout l'historique d'activité de ce club ? Cette action est irréversible.")) {
      return;
    }
    try {
      const res = await fetch(`/api/gyms/${gymId}/manager-logs/clear`, { method: "POST" });
      if (res.ok) {
        setManagerLogs([]);
        showToast("Historique d'activité effacé avec succès.", "success");
      }
    } catch (err) {
      console.error("Error clearing logs", err);
      showToast("Une erreur s'est produite lors de la suppression.", "error");
    }
  };

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("manager-dark-mode") === "true";
  });
  const [allGyms, setAllGyms] = useState<Gym[]>(() => {
    try {
      const cached = localStorage.getItem("allGyms");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [allMembers, setAllMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem("allMembers");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Track read notification IDs in localStorage
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`read_notifications_${gymId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [configLogo, setConfigLogo] = useState<string>(() => gym?.logo || "");
  const [configSlogan, setConfigSlogan] = useState<string>(() => gym?.slogan || "");
  const [configPrimary, setConfigPrimary] = useState<string>(() => gym?.primaryColor || "#0f766e");
  const [configSecondary, setConfigSecondary] = useState<string>(() => gym?.secondaryColor || "#f97316");
  const [configPlans, setConfigPlans] = useState<SubscriptionPlan[]>(() => gym?.subscriptionPlans || []);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Setup Dynamic Brand styles based on tenant settings (supports real-time dynamic preview as states update)
  const primaryColor = configPrimary || "#0f766e";
  const secondaryColor = configSecondary || "#f97316";
  const displayLogo = configLogo || "";

  // Memoized active memberships distribution by subscription plan
  const planDistributionData = React.useMemo(() => {
    const activeMembers = members.filter((m) => m.status === "Active");
    const counts: Record<string, number> = {};
    
    // Initialize standard config plans from the gym
    if (gym?.subscriptionPlans) {
      gym.subscriptionPlans.forEach((plan) => {
        counts[plan.name] = 0;
      });
    }

    // Accumulate actual counts
    activeMembers.forEach((m) => {
      const planName = m.subscriptionType || "Autre";
      counts[planName] = (counts[planName] || 0) + 1;
    });

    // We filter out 0 values to keep the charts crisp and clean
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [members, gym?.subscriptionPlans]);

  // Memoized stats per gym for active members and estimated monthly revenues
  const statsPerGym = React.useMemo(() => {
    // Managers must only see the stats of their own gym (gymId)
    const filteredGyms = allGyms.filter((g) => g.id === gymId);
    return filteredGyms.map((g) => {
      const gymMembers = allMembers.filter((m) => m.gymId === g.id);
      const activeMembers = gymMembers.filter((m) => m.status === "Active");
      const suspendedMembers = gymMembers.filter((m) => m.status === "Suspended");
      const expiredMembers = gymMembers.filter((m) => m.status === "Expired");

      const estimatedRevenue = activeMembers.reduce((sum, m) => {
        const plan = g.subscriptionPlans?.find((p) => p.name === m.subscriptionType);
        const planPrice = plan ? plan.price : 15000;
        const duration = plan && plan.durationMonths ? plan.durationMonths : 1;
        return sum + (planPrice / duration);
      }, 0);

      const sessionsRevenue = oneTimeSessions.reduce((sum, s) => sum + s.amount, 0);

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        logo: g.logo,
        primaryColor: g.primaryColor || "#0f766e",
        secondaryColor: g.secondaryColor || "#f97316",
        totalMembers: gymMembers.length,
        activeCount: activeMembers.length,
        suspendedCount: suspendedMembers.length,
        expiredCount: expiredMembers.length,
        estimatedRevenue: Math.round(estimatedRevenue),
        sessionsRevenue,
        totalRevenue: Math.round(estimatedRevenue) + sessionsRevenue
      };
    });
  }, [allGyms, allMembers, gymId, oneTimeSessions]);

  // Overall statistics across all gyms (for the current manager, this is only their gym)
  const overallStats = React.useMemo(() => {
    const totalActive = statsPerGym.reduce((sum, g) => sum + g.activeCount, 0);
    const totalSubscriptionRevenue = statsPerGym.reduce((sum, g) => sum + g.estimatedRevenue, 0);
    const totalSessionRevenue = statsPerGym.reduce((sum, g) => sum + g.sessionsRevenue, 0);
    const totalRevenue = totalSubscriptionRevenue + totalSessionRevenue;
    const totalMembers = statsPerGym.reduce((sum, g) => sum + g.totalMembers, 0);
    const filteredGyms = allGyms.filter((g) => g.id === gymId);
    return {
      totalActive,
      totalSubscriptionRevenue,
      totalSessionRevenue,
      totalRevenue,
      totalMembers,
      gymsCount: filteredGyms.length
    };
  }, [statsPerGym, allGyms, gymId]);

  const showToast = (text: string, type: "success" | "error" | "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    localStorage.setItem("manager-dark-mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(`activeView_${gymId}`, activeView);
  }, [activeView, gymId]);

  // Network connection listeners for instant feedback & sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Connexion internet rétablie. Synchronisation en cours...", "success");
      loadGymData();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast("Connexion internet perdue. Navigation en mode hors-ligne active.", "info");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Helper to calculate days until a subscription ends
  const getDaysUntilExpiration = (endDateStr: string): number => {
    if (!endDateStr) return Infinity;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return Infinity;
    }
  };

  // Memoized auto-generated list of notifications for subscription expirations in < 5 days
  const generatedNotifications = React.useMemo(() => {
    const notificationsList: GymNotification[] = [];

    members.forEach((m) => {
      if (m.status !== "Active") return;
      const days = getDaysUntilExpiration(m.subscriptionEnd);
      // Alerts are generated for any member expiring in less than 5 days
      if (days >= 0 && days < 5) {
        const notifId = `expiring_${m.id}_${m.subscriptionEnd}`;
        const title = days === 0 
          ? "Abonnement expire aujourd'hui !" 
          : days === 1 
          ? "Abonnement expire demain !" 
          : `Abonnement expire dans ${days} jours`;

        notificationsList.push({
          id: notifId,
          title,
          message: `L'abonnement de ${m.name} (${m.subscriptionType}) s'achève le ${m.subscriptionEnd}.`,
          createdAt: new Date().toISOString(), // Fallback creation date
          isRead: readNotificationIds.includes(notifId),
          type: days <= 1 ? "danger" : "warning"
        });
      }
    });

    // Sort by unread first, then by urgency (danger first)
    return notificationsList.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.type !== b.type) return a.type === "danger" ? -1 : 1;
      return 0;
    });
  }, [members, readNotificationIds]);

  // Persist read notification IDs in localStorage on change
  useEffect(() => {
    localStorage.setItem(`read_notifications_${gymId}`, JSON.stringify(readNotificationIds));
  }, [readNotificationIds, gymId]);

  const handleMarkAsRead = (notifId: string) => {
    // 1. Local/Calculated notifications
    if (notifId.startsWith("expiring_")) {
      if (!readNotificationIds.includes(notifId)) {
        setReadNotificationIds((prev) => [...prev, notifId]);
      }
      return;
    }

    // 2. Server notifications fallback
    fetch(`/api/gyms/${gymId}/notifications/${notifId}/read`, {
      method: "POST"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n));
        }
      })
      .catch((err) => {
        console.warn("Failed to notify backend, marking locally", err);
        setNotifications(notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      });
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = generatedNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      setReadNotificationIds((prev) => {
        const next = new Set([...prev, ...unreadIds]);
        return Array.from(next);
      });
    }
    showToast("Toutes les notifications d'expiration ont été lues.", "success");
  };

  // Fetch Gym and Members with resilient offline caching
  const loadGymData = () => {
    // If we have cached data, don't block the screen with full screen loading
    const hasCache = localStorage.getItem(`members_${gymId}`) !== null;
    if (!hasCache) {
      setLoading(true);
    }

    fetch("/api/gyms")
      .then((res) => res.json())
      .then((gymsList: Gym[]) => {
        setAllGyms(gymsList);
        localStorage.setItem("allGyms", JSON.stringify(gymsList));
        
        const currentGym = gymsList.find((g) => g.id === gymId);
        if (currentGym) {
          if (currentGym.status === "blocked") {
            onBack();
            return;
          }
          setGym(currentGym);
          localStorage.setItem(`gym_${gymId}`, JSON.stringify(currentGym));
          setConfigLogo(currentGym.logo || "");
          setConfigSlogan(currentGym.slogan || "");
          setConfigPrimary(currentGym.primaryColor || "#0f766e");
          setConfigSecondary(currentGym.secondaryColor || "#f97316");
          setConfigPlans(currentGym.subscriptionPlans || []);
        }
      })
      .catch((err) => {
        console.warn("Error loading gym config, relying on cache.", err);
        showToast("Affichage des configurations de l'établissement hors-ligne.", "info");
      });

    Promise.all([
      fetch(`/api/gyms/${gymId}/members`).then((res) => res.json()),
      fetch("/api/members").then((res) => res.json()),
      fetch("/api/alerts/expiring").then((res) => res.json()),
      fetch(`/api/gyms/${gymId}/notifications`).then((res) => res.json()),
      fetch(`/api/gyms/${gymId}/one-time-sessions`).then((res) => res.json())
    ])
      .then(([membersList, allMembersList, expiringList, notificationsList, sessionsList]) => {
        setMembers(membersList);
        localStorage.setItem(`members_${gymId}`, JSON.stringify(membersList));

        if (Array.isArray(sessionsList)) {
          setOneTimeSessions(sessionsList);
          localStorage.setItem(`sessions_${gymId}`, JSON.stringify(sessionsList));
        }

        if (Array.isArray(allMembersList)) {
          setAllMembers(allMembersList);
          localStorage.setItem("allMembers", JSON.stringify(allMembersList));
        }
        
        // filter expiring list to only this gym
        const gymExpiring = expiringList.filter((m: Member) => m.gymId === gymId);
        setExpiringMembers(gymExpiring);
        localStorage.setItem(`expiringMembers_${gymId}`, JSON.stringify(gymExpiring));

        if (Array.isArray(notificationsList)) {
          setNotifications(notificationsList);
          localStorage.setItem(`notifications_${gymId}`, JSON.stringify(notificationsList));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Network error loading members, using localStorage backup.", err);
        showToast("Données chargées depuis le cache local (mode hors-ligne).", "info");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGymData();
  }, [gymId]);

  useEffect(() => {
    if (activeView === "logs") {
      fetchManagerLogs();
    }
  }, [activeView, gymId]);

  // Handle Photo input conversion
  const processPhotoFile = (file: File) => {
    if (file.size > 1000 * 1024) {
      showToast("La taille de l'image ne doit pas dépasser 1 Mo.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (editingMember) {
        setEditingMember({ ...editingMember, photo: event.target?.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhotoFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPhotoFile(e.dataTransfer.files[0]);
    }
  };

  // Add Member Form Actions
  const handleOpenAddModal = () => {
    const defaultPlan = gym?.subscriptionPlans[0];
    const startDate = "2026-06-25"; // Anchor date
    const endDate = calculateEndDate(startDate, defaultPlan?.durationMonths || 1);

    setEditingMember({
      name: "",
      email: "",
      phone: "",
      photo: "",
      subscriptionType: defaultPlan?.name || "Pass Mensuel",
      subscriptionStart: startDate,
      subscriptionEnd: endDate,
      status: "Active",
      gymId: gymId,
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  // Automatically calculate subscription end date when changing start date or plan
  const calculateEndDate = (startDateStr: string, durationMonths: number): string => {
    const date = new Date(startDateStr + "T12:00:00Z");
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split("T")[0];
  };

  const handlePlanChange = (planName: string) => {
    if (!editingMember) return;
    const selectedPlan = gym?.subscriptionPlans.find((p) => p.name === planName);
    const duration = selectedPlan?.durationMonths || 1;
    const end = calculateEndDate(editingMember.subscriptionStart || "2026-06-25", duration);
    setEditingMember({
      ...editingMember,
      subscriptionType: planName,
      subscriptionEnd: end,
    });
  };

  const handleStartDateChange = (startStr: string) => {
    if (!editingMember) return;
    const selectedPlan = gym?.subscriptionPlans.find((p) => p.name === editingMember.subscriptionType);
    const duration = selectedPlan?.durationMonths || 1;
    const end = calculateEndDate(startStr, duration);
    setEditingMember({
      ...editingMember,
      subscriptionStart: startStr,
      subscriptionEnd: end,
    });
  };

  // Save Member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name || !editingMember.email) {
      showToast("Veuillez saisir le nom complet et l'email de l'adhérent.", "error");
      return;
    }

    setLoading(true);
    fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingMember),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(`L'adhérent "${data.member.name}" a été enregistré !`, "success");
          setIsMemberModalOpen(false);
          setEditingMember(null);
          loadGymData();
        } else {
          showToast("Erreur lors de l'enregistrement de l'adhérent.", "error");
        }
      })
      .catch((err) => {
        console.error("Save member error", err);
        showToast("Impossible d'enregistrer l'adhérent.", "error");
      })
      .finally(() => setLoading(false));
  };

  // Save Gym Custom Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;

    setSavingConfig(true);
    const updatedGym: Gym = {
      ...gym,
      logo: configLogo,
      slogan: configSlogan,
      primaryColor: configPrimary,
      secondaryColor: configSecondary,
      subscriptionPlans: configPlans,
    };

    fetch("/api/gyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedGym),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("La configuration de votre salle a été mise à jour avec succès !", "success");
          setGym(updatedGym);
          loadGymData();
        } else {
          showToast("Une erreur est survenue lors de l'enregistrement.", "error");
        }
      })
      .catch((err) => {
        console.error("Error saving config", err);
        showToast("Impossible de sauvegarder la configuration.", "error");
      })
      .finally(() => setSavingConfig(false));
  };

  const handleAddPlan = () => {
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: "Nouvelle Formule",
      durationMonths: 1,
      price: 30,
    };
    setConfigPlans([...configPlans, newPlan]);
  };

  const handleUpdatePlan = (id: string, field: keyof SubscriptionPlan, value: any) => {
    setConfigPlans(
      configPlans.map((plan) => {
        if (plan.id === id) {
          return { ...plan, [field]: value };
        }
        return plan;
      })
    );
  };

  const handleDeletePlan = (id: string) => {
    if (configPlans.length <= 1) {
      showToast("Vous devez garder au moins une formule d'abonnement.", "error");
      return;
    }
    setConfigPlans(configPlans.filter((p) => p.id !== id));
  };

  // Delete Member
  const handleDeleteMember = (id: string, name: string) => {
    if (!confirm(`Êtes-vous certain de vouloir supprimer l'adhérent "${name}" ? Ses factures seront également supprimées.`)) {
      return;
    }

    setLoading(true);
    fetch(`/api/members/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(`Adhérent "${name}" supprimé définitivement.`, "success");
          loadGymData();
        } else {
          showToast("Erreur lors de la suppression.", "error");
        }
      })
      .catch((err) => {
        console.error("Delete failed", err);
        showToast("Une erreur réseau est survenue.", "error");
      })
      .finally(() => setLoading(false));
  };

  // Trigger Gemini AI Expiration reminder Draft
  const handleOpenAlertGenerator = (member: Member) => {
    setSelectedAlertMember(member);
    setGeminiMessage("");
    setIsAlertModalOpen(true);
    setGeneratingAlert(true);

    fetch("/api/alerts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, gymId: gymId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGeminiMessage(data.message);
        if (data.warning) {
          console.warn(data.warning);
        }
      })
      .catch((err) => {
        console.error("Gemini failed", err);
        setGeminiMessage("Erreur lors de la génération du message d'alerte IA.");
      })
      .finally(() => setGeneratingAlert(false));
  };

  // Dispatch/Simulate sending the alert log
  const handleSendAlert = () => {
    if (!selectedAlertMember) return;
    setLoading(true);

    fetch("/api/alerts/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: selectedAlertMember.id,
        gymId: gymId,
        customMessage: geminiMessage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast(`Alerte d'expiration envoyée avec succès à ${selectedAlertMember.name} !`, "success");
          setIsAlertModalOpen(false);
          setSelectedAlertMember(null);
          setGeminiMessage("");
          loadGymData();
        } else {
          showToast("Échec de l'envoi de l'alerte.", "error");
        }
      })
      .catch((err) => {
        console.error("Dispatch error", err);
        showToast("Impossible d'enregistrer l'envoi de l'alerte.", "error");
      })
      .finally(() => setLoading(false));
  };

  // Generate / Preview Invoice Sheets
  const handleOpenInvoiceGenerator = (member: Member) => {
    setSelectedInvoiceMember(member);
    const selectedPlan = gym?.subscriptionPlans.find((p) => p.name === member.subscriptionType);
    const invoiceNum = `FAC-${gymId.replace("gym-", "")}-${Date.now().toString().slice(-6)}`;
    
    setInvoiceDetails({
      memberId: member.id,
      gymId: gymId,
      invoiceNumber: invoiceNum,
      date: "2026-06-25", // current simulated date
      amount: selectedPlan?.price || 40,
      planName: member.subscriptionType,
      paymentMethod: "Espèces", // Default
      status: "Paid",
    });
    setIsInvoiceModalOpen(true);
  };

  const handleSaveAndPrintInvoice = () => {
    if (!invoiceDetails || !selectedInvoiceMember) return;
    setLoading(true);

    fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceDetails),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("La facture a été enregistrée avec succès !", "success");
          setIsInvoiceModalOpen(false);
          loadGymData();
          // Open print dialog
          setTimeout(() => {
            window.print();
          }, 400);
        }
      })
      .catch((err) => {
        console.error("Error creating invoice", err);
        showToast("Échec d'enregistrement de la facture.", "error");
      })
      .finally(() => setLoading(false));
  };

  const handleSaveAndDownloadPDFInvoice = () => {
    if (!invoiceDetails || !selectedInvoiceMember) return;
    setLoading(true);

    fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceDetails),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("La facture a été enregistrée avec succès !", "success");
          setIsInvoiceModalOpen(false);
          loadGymData();
          // Generate PDF
          setTimeout(() => {
            handleDownloadPDFInvoice();
          }, 200);
        }
      })
      .catch((err) => {
        console.error("Error creating invoice", err);
        showToast("Échec d'enregistrement de la facture.", "error");
      })
      .finally(() => setLoading(false));
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = sessAmount === "other" ? parseFloat(customAmount) : sessAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast("Veuillez saisir un tarif valide.", "error");
      return;
    }

    setSubmittingSession(true);
    const newSession: Partial<OneTimeSession> = {
      gymId,
      visitorName: sessName.trim() || "Visiteur",
      visitorPhone: sessPhone.trim() || undefined,
      amount: finalAmount,
      paymentMethod: sessPaymentMethod,
      date: sessDate
    };

    fetch("/api/one-time-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSession)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Séance unique enregistrée avec succès !", "success");
          setSessName("");
          setSessPhone("");
          setCustomAmount("");
          loadGymData();
        } else {
          showToast("Échec de l'enregistrement de la séance.", "error");
        }
      })
      .catch((err) => {
        console.error("Error creating session", err);
        showToast("Erreur de connexion lors de l'enregistrement.", "error");
      })
      .finally(() => setSubmittingSession(false));
  };

  const handleDeleteSession = (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment annuler la séance enregistrée pour ${name} ?`)) {
      return;
    }
    setLoading(true);
    fetch(`/api/one-time-sessions/${id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Séance annulée avec succès.", "success");
          loadGymData();
        } else {
          showToast("Impossible d'annuler la séance.", "error");
        }
      })
      .catch((err) => {
        console.error("Error deleting session", err);
        showToast("Erreur réseau.", "error");
      })
      .finally(() => setLoading(false));
  };

  const handleDownloadPDFSessionTicket = (session: OneTimeSession) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 150]
    });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text((gym?.name || "GYMSYNC").toUpperCase(), 40, 15, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    if (gym?.slogan) {
      doc.text(gym.slogan, 40, 20, { align: "center" });
    }
    doc.text(gym?.address || "", 40, 24, { align: "center" });
    doc.text(`Tél : ${gym?.phone || ""}`, 40, 28, { align: "center" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(5, 32, 75, 32);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("TICKET DE SÉANCE", 40, 39, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`N° Ticket : SESS-${session.id.slice(-6).toUpperCase()}`, 8, 48);
    doc.text(`Date : ${session.date}`, 8, 53);
    
    const timeStr = session.createdAt ? new Date(session.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }) : "";
    if (timeStr) {
      doc.text(`Heure : ${timeStr}`, 8, 58);
    }

    doc.line(5, 63, 75, 63);

    doc.setFont("Helvetica", "bold");
    doc.text("Bénéficiaire :", 8, 70);
    doc.setFont("Helvetica", "normal");
    doc.text(session.visitorName, 30, 70);
    if (session.visitorPhone) {
      doc.text(`Téléphone : ${session.visitorPhone}`, 8, 75);
    }

    doc.line(5, 82, 75, 82);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DESCRIPTION", 8, 89);
    doc.text("MONTANT", 72, 89, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Accès Séance Unique Gym", 8, 97);
    doc.setFont("Helvetica", "bold");
    doc.text(`${session.amount.toLocaleString("fr-FR")} FCFA`, 72, 97, { align: "right" });

    doc.line(5, 103, 75, 103);

    doc.setFontSize(11);
    doc.text("TOTAL PAYÉ", 8, 112);
    doc.text(`${session.amount.toLocaleString("fr-FR")} FCFA`, 72, 112, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Règlement : ${session.paymentMethod}`, 8, 118);

    doc.line(5, 124, 75, 124);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("MERCI DE VOTRE VISITE !", 40, 132, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Conservez ce ticket durant votre séance.", 40, 137, { align: "center" });
    doc.text("GymSync Multi-Tenant SaaS Platform", 40, 142, { align: "center" });

    doc.save(`ticket_seance_${session.visitorName.toLowerCase().replace(/\s+/g, "_")}_${session.id.slice(-6)}.pdf`);
  };

  // Helper to convert hex color to RGB for jsPDF
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 15, g: 118, b: 110 }; // Default teal
  };

  // Helper to draw a beautiful company logo/text watermark on PDF documents
  const drawWatermark = (doc: jsPDF, orientation: "portrait" | "landscape", logoDataUrl?: string) => {
    const width = orientation === "portrait" ? 210 : 297;
    const height = orientation === "portrait" ? 297 : 210;
    
    const centerX = width / 2;
    const centerY = height / 2;

    const resolvedLogo = logoDataUrl || (gym?.logo && gym.logo.startsWith("data:image") ? gym.logo : "");

    if (resolvedLogo) {
      try {
        const logoSize = 80; // 80mm size watermark in the center
        const x = centerX - logoSize / 2;
        const y = centerY - logoSize / 2;
        
        // Save state and set opacity for the background watermark
        const gState = new (doc as any).GState({ opacity: 0.05 });
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.addImage(resolvedLogo, "JPEG", x, y, logoSize, logoSize);
        doc.restoreGraphicsState();
      } catch (e) {
        console.error("Error drawing logo watermark:", e);
      }
    } else {
      // Fallback: Elegant rotated text watermark of Gym name
      try {
        const text = (gym?.name || "GYMSYNC").toUpperCase();
        
        // Save state and set opacity for elegant subtle feel
        const gState = new (doc as any).GState({ opacity: 0.04 });
        doc.saveGraphicsState();
        doc.setGState(gState);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(44);
        doc.setTextColor(148, 163, 184); // slate-400
        
        doc.text(text, centerX, centerY, {
          align: "center",
          angle: 30
        });
        
        doc.restoreGraphicsState();
      } catch (e) {
        console.error("Error drawing text watermark:", e);
      }
    }
  };

  // Helper to resolve the gym logo as a base64 Data URL (supports both standard URLs and data URIs)
  const getLogoDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!url) return resolve("");
      if (url.startsWith("data:image")) return resolve(url);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.error("Error converting image to data URL:", e);
        }
        resolve("");
      };
      img.onerror = () => {
        resolve("");
      };
      img.src = url;
    });
  };

  // Generate and download a beautiful PDF for Members List
  const handleDownloadPDFMembers = async () => {
    if (filteredMembers.length === 0) {
      showToast("La liste filtrée est vide. Aucun adhérent à exporter.", "info");
      return;
    }

    showToast("Préparation de l'exportation PDF avec le logo de la salle...", "info");

    // Resolve the logo image to Data URL if it is a remote link
    const logoDataUrl = gym?.logo ? await getLogoDataUrl(gym.logo) : "";

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const rgb = hexToRgb(primaryColor);

    // Draw watermark for page 1 under everything
    drawWatermark(doc, "landscape", logoDataUrl);

    // Header details (Left-aligned) with logo support
    let textX = 14;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "JPEG", 14, 12, 16, 16);
        textX = 34;
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }

    // Set header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(gym?.name || "GymSync Club", textX, 18);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Adresse : ${gym?.address || "Non configurée"} | Tél : ${gym?.phone || "Non renseigné"}`, textX, 23);
    doc.text(`Email : ${gym?.email || "Non renseigné"}`, textX, 27);

    // Title of report
    const isFiltered = filteredMembers.length !== members.length;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(
      isFiltered
        ? "REGISTRE FILTRÉ DES ADHÉRENTS (Export Personnalisé)"
        : "REGISTRE GÉNÉRAL DES ADHÉRENTS (Back-end Sanity Cloud)",
      14,
      37
    );

    // Horizontal colored separator
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.6);
    doc.line(14, 39, 283, 39);

    // Generation details
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Document généré le : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")} | Effectif : ${filteredMembers.length} adhérent(s) ${isFiltered ? "(filtré)" : ""}`, 14, 44);

    const head = [
      [
        "Matricule",
        "Nom Complet",
        "Formule & Période",
        "Quartier",
        "Coordonnées",
        "Physique",
        "Contact Urgence",
        "Suivi & Objectifs",
        "Statut"
      ]
    ];

    const body = filteredMembers.map((m) => {
      const physique = [
        m.age ? `${m.age} ans` : null,
        m.height ? `${m.height} cm` : null
      ].filter(Boolean).join(" / ") || "-";

      const urgence = [
        m.emergencyContactName,
        m.emergencyContactPhone
      ].filter(Boolean).join("\nTél: ") || "-";

      const sante = [
        m.medicalHistory ? `Médical: ${m.medicalHistory}` : null,
        m.physicalGoals ? `Objectifs: ${m.physicalGoals}` : null
      ].filter(Boolean).join("\n") || "-";

      const validity = `${m.subscriptionType}\nDu ${m.subscriptionStart}\nAu ${m.subscriptionEnd}`;

      const contact = `Email: ${m.email}\nTél: ${m.phone}`;

      const statusText = m.status === "Active" ? "Actif" : m.status === "Suspended" ? "Suspendu" : "Expiré";

      return [
        m.registrationNumber,
        m.name,
        validity,
        m.neighborhood || "-",
        contact,
        physique,
        urgence,
        sante,
        statusText
      ];
    });

    autoTable(doc, {
      startY: 48,
      head: head,
      body: body,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold"
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85], // Slate-700
        valign: "middle"
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: "bold" }, // Matricule
        1: { cellWidth: 32, fontStyle: "bold" }, // Nom Complet
        2: { cellWidth: 35 }, // Formule & Validité
        3: { cellWidth: 22 }, // Quartier
        4: { cellWidth: 42 }, // Contact
        5: { cellWidth: 18 }, // Physique (Age/Height)
        6: { cellWidth: 30 }, // Urgence
        7: { cellWidth: 62 }, // Santé & Objectifs
        8: { cellWidth: 18, fontStyle: "bold" } // Statut
      },
      margin: { top: 48, left: 14, right: 14, bottom: 20 },
      willDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawWatermark(doc, "landscape", logoDataUrl);
        }
      },
      didDrawPage: (data) => {
        // Add page number in footer
        const pageCount = doc.getNumberOfPages();
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} sur ${pageCount}`,
          doc.internal.pageSize.width - 25,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          "Application GymSync SaaS Multi-Tenant - Données synchronisées avec Sanity Cloud Backend",
          14,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`registre_adherents_${gym?.slug || "club"}_${new Date().getFullYear()}.pdf`);
    showToast("Le registre des adhérents PDF a été généré avec succès !", "success");
  };

  // Generate and download a crisp, beautiful PDF Invoice using jsPDF
  const handleDownloadPDFInvoice = () => {
    if (!invoiceDetails || !selectedInvoiceMember) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const rgb = hexToRgb(primaryColor);

    // Draw watermark for page 1 under everything
    drawWatermark(doc, "portrait");

    // Header details (Left-aligned)
    let textX = 14;
    if (gym?.logo && gym.logo.startsWith("data:image")) {
      try {
        doc.addImage(gym.logo, "JPEG", 14, 15, 16, 16);
        textX = 34;
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(gym?.name || "GymSync Club", textX, 21);

    if (gym?.slogan) {
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(8);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`« ${gym.slogan} »`, textX, 25);
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    const addressLines = doc.splitTextToSize(gym?.address || "Adresse non renseignée", textX === 14 ? 80 : 70);
    doc.text(addressLines, textX, gym?.slogan ? 29 : 27);
    doc.text(`Tél : ${gym?.phone || "-"} | Email : ${gym?.email || "-"}`, textX, gym?.slogan ? 39 : 37);

    // Title / Metadata (Right-aligned)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text("REÇU / FACTURE D'ABONNEMENT", 120, 25);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(invoiceDetails.invoiceNumber || "FAC-XXXX", 120, 32);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date d'émission : ${invoiceDetails.date || "2026-06-25"}`, 120, 38);
    doc.text(`Mode de règlement : ${invoiceDetails.paymentMethod || "Espèces"}`, 120, 42);
    doc.text(`Statut : ${invoiceDetails.status === "Paid" ? "ACQUITTÉE" : "EN ATTENTE"}`, 120, 46);

    // Colored banner line
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.8);
    doc.line(14, 52, 196, 52);

    // Customer section box
    doc.setFillColor(248, 250, 252); // bg-slate-50
    doc.rect(14, 58, 182, 32, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text("DESTINATAIRE :", 20, 65);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(30, 41, 59);
    doc.text(selectedInvoiceMember.name, 20, 71);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(`Matricule : ${selectedInvoiceMember.registrationNumber}`, 20, 77);
    doc.text(`Contact : ${selectedInvoiceMember.phone} | ${selectedInvoiceMember.email}`, 20, 83);

    // Subscriptions details table
    const head = [["Désignation de la formule", "Période de Validité", "Montant"]];
    
    const amount = invoiceDetails.amount || 0;

    const body = [
      [
        invoiceDetails.planName || "Abonnement Club",
        `${selectedInvoiceMember.subscriptionStart} au ${selectedInvoiceMember.subscriptionEnd}`,
        `${amount.toLocaleString('fr-FR')} FCFA`
      ]
    ];

    autoTable(doc, {
      startY: 96,
      head: head,
      body: body,
      theme: "striped",
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold"
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        valign: "middle"
      },
      margin: { left: 14, right: 14 },
      tableWidth: 182,
      willDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawWatermark(doc, "portrait");
        }
      }
    });

    // Totals Box
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Draw border for Total
    doc.setDrawColor(226, 232, 240); // border-slate-200
    doc.line(115, finalY, 196, finalY);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text("TOTAL PAYÉ :", 115, finalY + 10);
    // Align with the right-most edge of the table (196), ensuring ample gap from 115
    doc.text(`${amount.toLocaleString('fr-FR')} FCFA`, 196, finalY + 10, { align: "right" });

    // Notice & Conditions
    const noticeY = finalY + 30;
    doc.setFillColor(248, 250, 252); // bg-slate-50
    doc.rect(14, noticeY, 182, 28, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("CONDITIONS DE RÈGLEMENT", 18, noticeY + 6);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const termsText = `Règlement enregistré sous le mode : ${invoiceDetails.paymentMethod || "Espèces"} (Statut : ${invoiceDetails.status === 'Paid' ? 'ACQUITTÉE' : 'EN ATTENTE'}). Tout règlement est perçu directement sur place en main propre par le gérant de la salle en Francs CFA (XOF/XAF).`;
    const splitTerms = doc.splitTextToSize(termsText, 174);
    doc.text(splitTerms, 18, noticeY + 12);

    // Footer note
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Merci pour votre confiance et à bientôt dans votre espace de fitness !`, 105, noticeY + 45, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Émis par GymSync Multi-Tenant SaaS Platform — ID: ${gymId}`, 105, noticeY + 50, { align: "center" });

    // Save the PDF
    doc.save(`facture_${selectedInvoiceMember.name.toLowerCase().replace(/\s+/g, "_")}_${invoiceDetails.invoiceNumber}.pdf`);
    showToast("La facture PDF a été générée et téléchargée !", "success");
  };

  // Download Gym Member directory as CSV file (fully Excel compatible in French locale)
  const handleDownloadCSV = () => {
    if (members.length === 0) {
      showToast("La liste est vide. Aucun adhérent à exporter.", "info");
      return;
    }

    // Header columns
    const headers = [
      "Matricule",
      "Nom Complet",
      "Sexe",
      "Âge",
      "Email",
      "Téléphone",
      "Quartier",
      "Profession",
      "Formule d'Abonnement",
      "Date Début",
      "Date Fin",
      "Statut",
      "Taille (cm)",
      "Contact d'urgence",
      "Téléphone d'urgence",
      "Antécédents Médicaux",
      "Allergies",
      "Objectifs Physiques",
      "Date d'Inscription"
    ];

    const rows = members.map((m) => [
      m.registrationNumber || "",
      m.name || "",
      m.gender || "",
      m.age !== undefined ? m.age.toString() : "",
      m.email || "",
      m.phone || "",
      m.neighborhood || "",
      m.occupation || "",
      m.subscriptionType || "",
      m.subscriptionStart || "",
      m.subscriptionEnd || "",
      m.status || "",
      m.height !== undefined ? m.height.toString() : "",
      m.emergencyContactName || "",
      m.emergencyContactPhone || "",
      m.medicalHistory || "",
      m.allergies || "",
      m.physicalGoals || "",
      m.createdAt ? new Date(m.createdAt).toLocaleDateString("fr-FR") : ""
    ]);

    // Build CSV Content in UTF-8 with BOM for Excel compatibility in French locales
    const csvContent =
      "\uFEFF" +
      [
        headers.join(";"),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(";")
        )
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `liste_adherents_${gym?.slug || "club"}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Le fichier d'export Excel/CSV a été téléchargé avec succès !", "success");
  };

  // Download Manager Activity Logs as CSV file
  const handleDownloadLogsCSV = () => {
    if (managerLogs.length === 0) {
      showToast("Le journal est vide. Aucun log à exporter.", "info");
      return;
    }

    const headers = ["Date & Heure", "Type d'Action", "Détails de l'Opération"];
    const rows = managerLogs.map((log) => [
      new Date(log.createdAt).toLocaleString("fr-FR"),
      log.action || "",
      log.details || ""
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(";"),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(";")
        )
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_activite_${gym?.slug || "club"}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Le journal d'activité (CSV) a été téléchargé avec succès !", "success");
  };

  // Download Manager Activity Logs as JSON file
  const handleDownloadLogsJSON = () => {
    if (managerLogs.length === 0) {
      showToast("Le journal est vide. Aucun log à exporter.", "info");
      return;
    }

    const jsonString = JSON.stringify(managerLogs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_activite_${gym?.slug || "club"}_${new Date().getFullYear()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Le journal d'activité (JSON) a été téléchargé avec succès !", "success");
  };

  // Filter Members based on search terms and advanced deep research filters
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.neighborhood && m.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || m.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPlan =
      selectedPlanFilter === "all" || m.subscriptionType === selectedPlanFilter;

    const matchesNeighborhood =
      !neighborhoodFilter ||
      (m.neighborhood && m.neighborhood.toLowerCase().includes(neighborhoodFilter.toLowerCase()));

    // Age Group logic
    let matchesAge = true;
    if (ageGroupFilter !== "all") {
      const age = m.age || 0;
      if (ageGroupFilter === "ados") {
        matchesAge = age < 18;
      } else if (ageGroupFilter === "jeunes") {
        matchesAge = age >= 18 && age <= 35;
      } else if (ageGroupFilter === "adultes") {
        matchesAge = age >= 36 && age <= 50;
      } else if (ageGroupFilter === "seniors") {
        matchesAge = age > 50;
      }
    }

    const matchesMedical =
      !hasMedicalHistoryFilter ||
      (m.medicalHistory && m.medicalHistory.trim().length > 0 && m.medicalHistory !== "-");

    const matchesGoal =
      !physicalGoalFilter ||
      (m.physicalGoals && m.physicalGoals.toLowerCase().includes(physicalGoalFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesPlan && matchesNeighborhood && matchesAge && matchesMedical && matchesGoal;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Toast */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100"
              : message.type === "error"
              ? "bg-red-50 border-red-200 text-red-800 shadow-red-100"
              : "bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </motion.div>
      )}

      {/* Header Panel with Dynamic Gym Theme Colors */}
      <header
        className="text-white py-6 px-6 shadow-xl relative z-30 transition-all no-print"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}e0, ${primaryColor}), url('/assets/gym_bg_fallback.jpg')`,
          backgroundColor: primaryColor,
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-none pointer-events-none">
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>

          {/* Dynamic Graphic Blobs */}
          <div
            className="absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none translate-x-1/3 -translate-y-1/3"
            style={{ backgroundColor: secondaryColor }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/5"
              title="Retour aux portails"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {displayLogo ? (
              <img
                src={displayLogo}
                alt={gym?.name || "Logo de la salle"}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover bg-white border border-white/20 shadow-md"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl border border-white/20 shadow-md"
                style={{ backgroundColor: secondaryColor }}
              >
                {gym?.name?.[0] || "G"}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white">
                  {gym?.name || "Espace Gestionnaire"}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/15 rounded border border-white/10">
                  Manager Club
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{gym?.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Network Connection Badge */}
            {isOffline ? (
              <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/30 text-rose-200 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Hors-ligne</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl">
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>En ligne</span>
              </div>
            )}

            <div className="text-right hidden sm:block mr-1">
              <span className="text-[10px] font-bold text-white/60 block uppercase tracking-widest">
                Solde de Caisse
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {members.filter(m => m.status === 'Active').reduce((sum, m) => {
                  const plan = gym?.subscriptionPlans.find(p => p.name === m.subscriptionType);
                  return sum + (plan ? plan.price : 15000);
                }, 0).toLocaleString('fr-FR')} FCFA / mois
              </span>
            </div>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/10 shadow-sm flex items-center justify-center relative select-none"
                title="Alertes d'expiration de forfait"
              >
                <Bell className={`w-4 h-4 ${generatedNotifications.some(n => !n.isRead) ? "animate-pulse" : ""}`} />
                {generatedNotifications.some(n => !n.isRead) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-slate-900 px-1 leading-none shadow-sm">
                    {generatedNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setShowNotificationsDropdown(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Abonnements expirant bientôt ({generatedNotifications.length})
                      </span>
                      {generatedNotifications.some(n => !n.isRead) && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 uppercase transition-colors"
                        >
                          Tout lire
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {generatedNotifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                          Aucun abonnement n'expire à moins de 5 jours.
                        </div>
                      ) : (
                        generatedNotifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-3.5 transition-colors text-left flex gap-3 ${
                              n.isRead 
                                ? "opacity-60 bg-white dark:bg-slate-900" 
                                : "bg-teal-50/20 dark:bg-teal-950/10 border-l-2 border-teal-500"
                            }`}
                          >
                            <div className="mt-1 flex-shrink-0">
                              <span className={`w-2 h-2 rounded-full block ${n.type === 'danger' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1 font-medium">
                                {n.message}
                              </p>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline mt-2 block"
                                >
                                  Marquer comme lu
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl transition-all cursor-pointer border border-white/10 shadow-sm flex items-center justify-center gap-1.5 font-medium text-xs group select-none"
              title={darkMode ? "Basculer en mode clair" : "Basculer en mode sombre"}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline">Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-200" />
                  <span className="hidden md:inline">Sombre</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 no-print">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setActiveView("members")}
            className="py-4 font-display text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-2"
            style={{
              color: activeView === "members" ? primaryColor : (darkMode ? "#94a3b8" : "#64748b"),
            }}
          >
            <Users className="w-4 h-4" />
            <span>Base Adhérents ({members.length})</span>
            {activeView === "members" && (
              <motion.div
                layoutId="managerActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveView("sessions")}
            className="py-4 font-display text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-2"
            style={{
              color: activeView === "sessions" ? primaryColor : (darkMode ? "#94a3b8" : "#64748b"),
            }}
          >
            <Zap className="w-4 h-4" />
            <span>Séances Uniques ({oneTimeSessions.length})</span>
            {activeView === "sessions" && (
              <motion.div
                layoutId="managerActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveView("stats")}
            className="py-4 font-display text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-2"
            style={{
              color: activeView === "stats" ? primaryColor : (darkMode ? "#94a3b8" : "#64748b"),
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Statistiques</span>
            {activeView === "stats" && (
              <motion.div
                layoutId="managerActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveView("config")}
            className="py-4 font-display text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-2"
            style={{
              color: activeView === "config" ? primaryColor : (darkMode ? "#94a3b8" : "#64748b"),
            }}
          >
            <Briefcase className="w-4 h-4" />
            <span>Configuration Club Settings</span>
            {activeView === "config" && (
              <motion.div
                layoutId="managerActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveView("logs")}
            className="py-4 font-display text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-2"
            style={{
              color: activeView === "logs" ? primaryColor : (darkMode ? "#94a3b8" : "#64748b"),
            }}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Journal d'Activité</span>
            {activeView === "logs" && (
              <motion.div
                layoutId="managerActiveTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      {activeView === "members" ? (
        <>
          <div className="max-w-7xl w-full mx-auto px-6 pt-6 no-print space-y-4">
            {/* 1. Subscription expiration warning alert */}
            {gym?.subscriptionEnd && (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((new Date(gym.subscriptionEnd).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 5 && diffDays > 0) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse text-amber-900">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-amber-100/85 rounded-xl text-amber-700">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900 leading-tight">Attention, votre abonnement GymSync arrive à échéance !</h4>
                        <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                          Il reste seulement <strong className="text-amber-800 font-extrabold">{diffDays} jour{diffDays > 1 ? 's' : ''}</strong> avant l'expiration de votre formule. Après cette échéance, l'accès à votre espace sera automatiquement bloqué par le système. Veuillez contacter l'administrateur pour renouveler votre licence.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else if (diffDays <= 0) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-red-900">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-red-100 rounded-xl text-red-700 animate-bounce">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900 leading-tight">Abonnement Expiré - Accès Restreint</h4>
                        <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                          Votre période d'abonnement s'est achevée le <strong className="text-red-750 font-extrabold">{gym.subscriptionEnd.split('T')[0]}</strong>. Pour continuer à gérer vos adhérents et formules, veuillez contacter immédiatement l'administrateur pour valider votre paiement.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* 2. Real-Time Admin Alerts Center (unreads list) */}
            {notifications.filter(n => !n.read).length > 0 && (
              <div className="space-y-3">
                {notifications.filter(n => !n.read).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      notif.type === 'danger' 
                        ? 'bg-red-50/50 border-red-200 text-red-900' 
                        : notif.type === 'warning' 
                          ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                          : 'bg-blue-50/50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        notif.type === 'danger' ? 'bg-red-100 text-red-700' : notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Message de l'Administrateur Système</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-white border border-slate-200">Nouveau</span>
                        </div>
                        <h4 className="font-display font-bold text-slate-900 text-sm mt-0.5 leading-snug">{notif.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">{notif.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[11px] font-bold shrink-0 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                    >
                      Marquer comme lu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <main className="max-w-7xl w-full mx-auto p-6 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8 no-print">
        {/* Left column: Quick Stats & AI Alerts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Metrics Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chiffres Clés
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 transition-colors">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
                  {members.length}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Adhérents
                </span>
              </div>
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition-colors">
                <span
                  className="text-2xl font-bold block font-mono"
                  style={{ color: primaryColor }}
                >
                  {members.filter((m) => m.status === "Active").length}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  Actifs
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Raccourcis Rapides
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Shortcut 1: Add Member */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm hover:shadow-md border border-transparent select-none"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Adhérent</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />

              {/* Shortcut 2: Generate Invoice */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Générer une facture en un clic
                </label>
                <div className="flex flex-col gap-2">
                  <select
                    value={shortcutMemberId}
                    onChange={(e) => setShortcutMemberId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 transition-colors text-slate-800 dark:text-slate-100"
                    style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                  >
                    <option value="">-- Choisir un adhérent --</option>
                    {[...members]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.subscriptionType})
                        </option>
                      ))}
                  </select>
                  
                  <button
                    type="button"
                    disabled={!shortcutMemberId}
                    onClick={() => {
                      const selMember = members.find((m) => m.id === shortcutMemberId);
                      if (selMember) {
                        handleOpenInvoiceGenerator(selMember);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border select-none ${
                      shortcutMemberId
                        ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
                        : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-950 dark:text-slate-600 dark:border-slate-850 cursor-not-allowed"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Créer la Facture</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Memberships Plan Distribution Recharts Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-5 h-5 text-blue-500" />
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Formules Actives
                </h3>
              </div>
              
              {/* Toggle switch for Donut vs Bar */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setChartType("donut")}
                  className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartType === "donut"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Secteur
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    chartType === "bar"
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Barres
                </button>
              </div>
            </div>

            {/* Chart Area */}
            {planDistributionData.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl p-4 text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-350 dark:text-slate-600">
                  <ChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Aucun abonnement actif</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Les statistiques s'afficheront dès qu'un adhérent aura un abonnement actif.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-[200px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "donut" ? (
                      <PieChart>
                        <Pie
                          data={planDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {planDistributionData.map((entry, index) => {
                            const colorsList = [
                              primaryColor,
                              secondaryColor,
                              "#3b82f6", // Blue
                              "#8b5cf6", // Violet
                              "#10b981", // Emerald
                              "#f59e0b", // Amber
                              "#ec4899", // Pink
                              "#06b6d4"  // Cyan
                            ];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colorsList[index % colorsList.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px",
                            fontFamily: "Inter, sans-serif"
                          }}
                          itemStyle={{ color: "#fff" }}
                          formatter={(value: any, name: any) => [`${value} adhérent(s)`, name]}
                        />
                      </PieChart>
                    ) : (
                      <BarChart
                        data={planDistributionData}
                        layout="vertical"
                        margin={{ left: 5, right: 15, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                          width={75}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "11px",
                            fontFamily: "Inter, sans-serif"
                          }}
                          itemStyle={{ color: "#fff" }}
                          formatter={(value: any, name: any) => [`${value} adhérent(s)`, "Total"]}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {planDistributionData.map((entry, index) => {
                            const colorsList = [
                              primaryColor,
                              secondaryColor,
                              "#3b82f6",
                              "#8b5cf6",
                              "#10b981",
                              "#f59e0b",
                              "#ec4899",
                              "#06b6d4"
                            ];
                            return (
                              <Cell
                                key={`bar-cell-${index}`}
                                fill={colorsList[index % colorsList.length]}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                  
                  {/* Center info for Donut mode */}
                  {chartType === "donut" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-800 font-mono">
                        {members.filter((m) => m.status === "Active").length}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Actifs
                      </span>
                    </div>
                  )}
                </div>

                {/* Custom Legend for precise display */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
                  {planDistributionData.map((entry, index) => {
                    const colorsList = [
                      primaryColor,
                      secondaryColor,
                      "#3b82f6",
                      "#8b5cf6",
                      "#10b981",
                      "#f59e0b",
                      "#ec4899",
                      "#06b6d4"
                    ];
                    const activeCount = members.filter((m) => m.status === "Active").length;
                    const pct = activeCount > 0 ? Math.round((entry.value / activeCount) * 100) : 0;
                    return (
                      <div key={entry.name} className="flex items-start gap-2 text-[11px] leading-tight">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: colorsList[index % colorsList.length] }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate" title={entry.name}>
                            {entry.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {entry.value} ({pct}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI AUTOMATIC EXPIRATION ALERTS PANEL (exactly 5 days!) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Relances Automatiques (5 jrs)
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30 font-mono">
                {expiringMembers.length}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Le système a détecté {expiringMembers.length} adhérent(e)s actif(s) dont l'inscription s'achève dans exactement 5 jours. Rédigez un message IA personnalisé via Gemini.
            </p>

            {expiringMembers.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl p-4 text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                Aucune expiration à 5 jours détectée aujourd'hui.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {expiringMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-amber-50/35 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/20 p-3 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{member.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Fin : {member.subscriptionEnd} (5j)
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAlertGenerator(member)}
                      className="text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:brightness-110 shadow-sm transition-all whitespace-nowrap cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Rédiger Relance IA</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Member Database Directory */}
        <div className="lg:col-span-3 space-y-6">
          {/* Action header bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm transition-colors">
            {/* Search inputs & Toggles */}
            <div className="w-full xl:max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 border rounded-xl py-2 pl-9 pr-10 text-sm focus:outline-none transition-colors"
                  style={{
                    borderColor: searchTerm ? primaryColor : "#e2e8f0"
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-0.5 rounded-full hover:bg-slate-100"
                    title="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Advanced Search Toggle Button */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap"
                  style={{
                    borderColor: showAdvancedFilters ? primaryColor : "#e2e8f0",
                    backgroundColor: showAdvancedFilters ? `${primaryColor}10` : "#f8fafc",
                    color: showAdvancedFilters ? primaryColor : "#475569",
                  }}
                  title="Recherches Approfondies / Filtres Avancés"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Recherches Approfondies</span>
                  {showAdvancedFilters && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </button>

                {/* Cloud Real-Time Sync Button */}
                <button
                  onClick={() => {
                    showToast("Synchronisation en temps réel avec le cloud Sanity...", "info");
                    loadGymData();
                  }}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer group whitespace-nowrap"
                  title="Forcer la mise à jour en temps réel des données depuis Sanity Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
                  <span>Temps Réel</span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </button>
              </div>
            </div>

            {/* CSV Download, PDF Download & Create buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-sm"
                title="Télécharger la liste complète au format Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Exporter Excel / CSV</span>
              </button>

              <button
                onClick={handleDownloadPDFMembers}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Télécharger la liste filtrée au format PDF"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Exporter PDF {filteredMembers.length !== members.length ? `(${filteredMembers.length})` : ""}</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Inscrire un Adhérent</span>
              </button>
            </div>
          </div>

          {/* Advanced / Deep Research Filters Panel */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Plan filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Formule d'abonnement</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-slate-300 text-slate-700 font-medium"
                  value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
                >
                  <option value="all">Toutes les formules</option>
                  {gym?.subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.name}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Neighborhood filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quartier de résidence</label>
                <input
                  type="text"
                  placeholder="Ex: Plateau, Cocody..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-slate-300 text-slate-700 font-medium"
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                />
              </div>

              {/* Age group filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tranche d'âge</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-slate-300 text-slate-700 font-medium"
                  value={ageGroupFilter}
                  onChange={(e) => setAgeGroupFilter(e.target.value)}
                >
                  <option value="all">Tous âges</option>
                  <option value="ados">Ados (-18 ans)</option>
                  <option value="jeunes">Jeunes (18-35 ans)</option>
                  <option value="adultes">Adultes (36-50 ans)</option>
                  <option value="seniors">Seniors (+50 ans)</option>
                </select>
              </div>

              {/* Physical goals filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objectif Physique</label>
                <input
                  type="text"
                  placeholder="Ex: perte de poids, cardio..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-slate-300 text-slate-700 font-medium"
                  value={physicalGoalFilter}
                  onChange={(e) => setPhysicalGoalFilter(e.target.value)}
                />
              </div>

              {/* Medical history checkbox & reset button */}
              <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasMedicalHistoryFilter}
                    onChange={(e) => setHasMedicalHistoryFilter(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Afficher uniquement les profils avec antécédents médicaux / contre-indications</span>
                </label>

                <button
                  onClick={() => {
                    setSelectedPlanFilter("all");
                    setNeighborhoodFilter("");
                    setAgeGroupFilter("all");
                    setHasMedicalHistoryFilter(false);
                    setPhysicalGoalFilter("");
                    setSearchTerm("");
                    showToast("Filtres réinitialisés.", "info");
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            </motion.div>
          )}

          {/* Directory tabs filter */}
          <div className="flex border-b border-slate-200 gap-1 no-print">
            {[
              { id: "all", label: "Tous les adhérents", count: members.length },
              { id: "active", label: "Actifs", count: members.filter(m => m.status === 'Active').length },
              { id: "suspended", label: "Suspendus", count: members.filter(m => m.status === 'Suspended').length },
              { id: "expired", label: "Expirés", count: members.filter(m => m.status === 'Expired').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className="px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer"
                style={{
                  color: statusFilter === tab.id ? primaryColor : "#64748b",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    statusFilter === tab.id ? "bg-slate-100" : "bg-slate-50"
                  }`}>
                    {tab.count}
                  </span>
                </div>
                {statusFilter === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </button>
            ))}
          </div>
          
          {/* Active search or filters summary */}
          {(searchTerm || statusFilter !== "all" || selectedPlanFilter !== "all" || neighborhoodFilter || ageGroupFilter !== "all" || hasMedicalHistoryFilter || physicalGoalFilter) && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs text-slate-600 animate-fade-in no-print">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="leading-none">
                  <strong className="text-slate-800 font-bold">{filteredMembers.length}</strong> adhérent{filteredMembers.length !== 1 ? "s" : ""} trouvé{filteredMembers.length !== 1 ? "s" : ""}
                  {searchTerm && <> pour &ldquo;<strong className="text-slate-800 font-bold">{searchTerm}</strong>&rdquo;</>}
                  {statusFilter !== "all" && <> avec statut &ldquo;<strong className="text-slate-800 font-bold">{statusFilter}</strong>&rdquo;</>}
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSelectedPlanFilter("all");
                  setNeighborhoodFilter("");
                  setAgeGroupFilter("all");
                  setHasMedicalHistoryFilter(false);
                  setPhysicalGoalFilter("");
                  showToast("Recherche et filtres réinitialisés", "info");
                }}
                className="text-slate-500 hover:text-red-600 hover:underline font-bold cursor-pointer text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors select-none"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            </div>
          )}

          {/* Grid listing */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 p-12 text-center rounded-2xl shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Aucun adhérent trouvé</h3>
              <p className="text-slate-500 text-xs mt-1">
                Aucun profil ne correspond à vos filtres ou à votre terme de recherche.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {/* Member photo upload or placeholder */}
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-inner uppercase"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-slate-800 truncate text-base leading-tight">
                          {member.name}
                        </h3>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                            member.status === "Active"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : member.status === "Suspended"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {member.status === "Active" ? "Actif" : member.status === "Suspended" ? "Suspendu" : "Expiré"}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                        ID : {member.registrationNumber}
                      </p>

                      <div className="mt-2.5 space-y-1 text-xs text-slate-500 font-medium">
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{member.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.phone || "Non renseigné"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Health and Profil Indicators */}
                  {(member.age || member.height || member.neighborhood || member.medicalHistory || member.physicalGoals || member.emergencyContactName || member.allergies || member.occupation || member.gender) && (
                    <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl text-[11px] text-slate-600 mb-3 space-y-2">
                      <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Sexe</span>
                          <span className="text-slate-800 font-semibold">{member.gender || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Âge</span>
                          <span className="text-slate-800 font-semibold">{member.age ? `${member.age} ans` : "—"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Taille</span>
                          <span className="text-slate-800 font-semibold">{member.height ? `${member.height} cm` : "—"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Domicile</span>
                          <span className="text-slate-800 font-semibold truncate block" title={member.neighborhood}>{member.neighborhood || "—"}</span>
                        </div>
                      </div>

                      {(member.medicalHistory || member.physicalGoals || member.allergies || member.occupation) && (
                        <div className="space-y-2 border-b border-slate-100 pb-1.5">
                          {member.occupation && (
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Fonction / Profession</span>
                              <span className="text-slate-700 font-medium">{member.occupation}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {member.medicalHistory && (
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Santé</span>
                                <span className="text-slate-700 block truncate" title={member.medicalHistory}>{member.medicalHistory}</span>
                              </div>
                            )}
                            {member.allergies && (
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">Allergies</span>
                                <span className="text-red-600 block truncate font-medium" title={member.allergies}>{member.allergies}</span>
                              </div>
                            )}
                          </div>
                          {member.physicalGoals && (
                            <div>
                              <span className="text-[9px] text-slate-400 block uppercase font-bold">Objectifs</span>
                              <span className="text-slate-700 block truncate" title={member.physicalGoals}>{member.physicalGoals || "Aucun"}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {member.emergencyContactName && (
                        <div className="text-[10px] bg-red-50/50 border border-red-100/50 p-2 rounded-lg text-red-800">
                          <span className="block text-[8px] text-red-500 uppercase font-extrabold tracking-wider">
                            Urgence :
                          </span>
                          <span className="font-bold">{member.emergencyContactName}</span>
                          {member.emergencyContactPhone && (
                            <span className="font-mono ml-1.5 font-semibold text-red-600">({member.emergencyContactPhone})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub Info */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600 mb-4 font-medium">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                        Formule d'Abonnement
                      </span>
                      <span className="text-slate-800 font-semibold">{member.subscriptionType}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                        Date Fin d'inscription
                      </span>
                      <span className="text-slate-800 font-semibold">{member.subscriptionEnd}</span>
                    </div>
                  </div>

                  {/* Member Actions */}
                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenInvoiceGenerator(member)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Émettre Facture</span>
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(member)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Modifier les fiches"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer l'adhérent définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>
      </main>
    </>
  ) : activeView === "sessions" ? (
    <main className="max-w-7xl w-full mx-auto p-6 flex-grow space-y-8 no-print animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Gestion des Séances Uniques
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Enregistrez les entrées et paiements uniques pour les séances à la carte (1000, 1500, 2000 FCFA).
          </p>
        </div>
        <button
          onClick={loadGymData}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-sm w-fit animate-fade-in"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" style={{ animation: loading ? "spin 1.5s linear infinite" : "none" }} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {oneTimeSessions.filter(s => s.date === new Date().toISOString().split("T")[0]).length}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Séances Aujourd'hui
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {oneTimeSessions
                .filter(s => s.date === new Date().toISOString().split("T")[0])
                .reduce((sum, s) => sum + s.amount, 0)
                .toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Recette d'Aujourd'hui
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {oneTimeSessions.reduce((sum, s) => sum + s.amount, 0).toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Recettes Séances Cumulées
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Quick Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
          <div>
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
              Enregistrer une Séance Unique
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Saisissez les détails de l'entrée visiteur.
            </p>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nom du visiteur
              </label>
              <input
                type="text"
                value={sessName}
                onChange={(e) => setSessName(e.target.value)}
                placeholder="Ex: Visiteur, Jean, etc."
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Téléphone (facultatif)
              </label>
              <input
                type="text"
                value={sessPhone}
                onChange={(e) => setSessPhone(e.target.value)}
                placeholder="Ex: +225 0707..."
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Date de séance
              </label>
              <input
                type="date"
                value={sessDate}
                onChange={(e) => setSessDate(e.target.value)}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tarif de la séance (FCFA)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 1500, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSessAmount(val)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold font-mono transition-colors cursor-pointer text-center ${
                      sessAmount === val
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {val.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSessAmount("other")}
                className={`w-full mt-2 py-2 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer text-center ${
                  sessAmount === "other"
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                }`}
              >
                Autre Montant
              </button>
              {sessAmount === "other" && (
                <div className="relative mt-2 animate-slide-up">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Saisir montant en FCFA"
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 font-mono"
                    required
                  />
                  <span className="absolute right-4 top-3 text-xs font-bold text-slate-400 font-sans">FCFA</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mode de règlement
              </label>
              <select
                value={sessPaymentMethod}
                onChange={(e) => setSessPaymentMethod(e.target.value)}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 cursor-pointer"
              >
                <option value="Espèces">Espèces (Cash)</option>
                <option value="Mobile Money">Mobile Money (OM/MTN/Wave)</option>
                <option value="Autre">Autre Moyen</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submittingSession}
              style={{ backgroundColor: primaryColor }}
              className="w-full text-white text-xs font-bold py-3.5 rounded-xl transition-colors cursor-pointer shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 mt-4"
            >
              <span>Enregistrer l'Entrée</span>
            </button>
          </form>
        </div>

        {/* Right: History & Grouped Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Periodic Reports Grouping panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                  Rapports consolidés des séances
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Chiffre d'affaires agrégé de vos entrées.
                </p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200/50 dark:border-slate-800">
                <button
                  onClick={() => setSessionReportPeriod("month")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    sessionReportPeriod === "month"
                      ? "bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setSessionReportPeriod("week")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    sessionReportPeriod === "week"
                      ? "bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Hebdomadaire
                </button>
              </div>
            </div>

            {/* Reports grouping calculation & render */}
            {(() => {
              const groups: Record<string, { label: string; count: number; total: number }> = {};
              
              oneTimeSessions.forEach((s) => {
                const dateObj = new Date(s.date);
                if (sessionReportPeriod === "month") {
                  const monthLabel = dateObj.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
                  const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                  const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
                  
                  if (!groups[key]) {
                    groups[key] = { label: formattedLabel, count: 0, total: 0 };
                  }
                  groups[key].count += 1;
                  groups[key].total += s.amount;
                } else {
                  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
                  const dayNum = d.getUTCDay() || 7;
                  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                  
                  const label = `Semaine ${weekNo} (${d.getFullYear()})`;
                  const key = `${d.getFullYear()}-W${weekNo}`;
                  
                  if (!groups[key]) {
                    groups[key] = { label, count: 0, total: 0 };
                  }
                  groups[key].count += 1;
                  groups[key].total += s.amount;
                }
              });

              const sortedGroups = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));

              if (sortedGroups.length === 0) {
                return (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Aucune séance enregistrée pour calculer les rapports.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-1">
                  {sortedGroups.map(([key, item]) => (
                    <div key={key} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.count} séance{item.count > 1 ? "s" : ""}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                        {item.total.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* History table list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
            <div>
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                Historique des entrées séances
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Visualisez les dernières séances et téléchargez les tickets de reçu.
              </p>
            </div>

            {oneTimeSessions.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
                Aucune séance unique enregistrée dans cet établissement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Visiteur</th>
                      <th className="pb-3 text-right">Tarif</th>
                      <th className="pb-3 text-center">Mode</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oneTimeSessions
                      .slice()
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((sess) => (
                        <tr key={sess.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors text-slate-600 dark:text-slate-350">
                          <td className="py-3 font-mono text-slate-500">{sess.date}</td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{sess.visitorName}</span>
                            {sess.visitorPhone && (
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{sess.visitorPhone}</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100 font-mono">
                            {sess.amount.toLocaleString("fr-FR")} FCFA
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200/80 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
                              {sess.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleDownloadPDFSessionTicket(sess)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Télécharger le ticket de reçu"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(sess.id, sess.visitorName)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer l'entrée"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  ) : activeView === "stats" ? (
    <main className="max-w-7xl w-full mx-auto p-6 flex-grow space-y-8 no-print animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 tracking-tight">
            Statistiques & Performance de la Salle
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Analyse et chiffre d'affaires mensuel estimé de votre établissement.
          </p>
        </div>
        <button
          onClick={loadGymData}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-sm w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: loading ? "1.5s" : "0s" }} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {overallStats.totalRevenue.toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Chiffre d'Affaires Global
            </span>
            <div className="flex gap-3 text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 font-mono">
              <span>Abon. : {overallStats.totalSubscriptionRevenue.toLocaleString("fr-FR")} F</span>
              <span>Séances : {overallStats.totalSessionRevenue.toLocaleString("fr-FR")} F</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {overallStats.totalActive.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Adhérents Actifs
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block font-mono">
              {overallStats.gymsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Établissement Géré
            </span>
          </div>
        </div>
      </div>

      {/* Salles list details with progress & stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
            Indicateurs Détaillés de la Salle de Sport
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Indicateurs détaillés de votre établissement avec répartition des abonnements, des séances et des totaux généraux.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="pb-3 pl-2">Salle de Sport</th>
                <th className="pb-3 text-center">Adhérents Actifs</th>
                <th className="pb-3 text-center">Expirés / Susp.</th>
                <th className="pb-3 text-right">Abonnements</th>
                <th className="pb-3 text-right">Séances Uniques</th>
                <th className="pb-3 text-right font-bold text-slate-800 dark:text-slate-100">Total Général</th>
                <th className="pb-3 pr-2 text-right w-40">Part de Revenu</th>
              </tr>
            </thead>
            <tbody>
              {statsPerGym.map((g) => {
                const percent = overallStats.totalRevenue > 0 ? (g.totalRevenue / overallStats.totalRevenue) * 100 : 0;
                return (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="py-4 pl-2 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 uppercase" style={{ backgroundColor: g.primaryColor }}>
                        {g.logo ? (
                          <img src={g.logo} alt={g.name} className="w-8 h-8 rounded-lg object-cover animate-fade-in" referrerPolicy="no-referrer" />
                        ) : (
                          g.name.substring(0, 2)
                        )}
                      </div>
                      <div>
                        <span className="block font-semibold text-slate-800 dark:text-slate-100">{g.name}</span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">/{g.slug}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-bold font-mono">
                        {g.activeCount}
                      </span>
                    </td>
                    <td className="py-4 text-center font-mono font-medium text-slate-500 dark:text-slate-400">
                      {g.suspendedCount + g.expiredCount}
                    </td>
                    <td className="py-4 text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                      {g.estimatedRevenue.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="py-4 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                      {g.sessionsRevenue.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="py-4 text-right font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {g.totalRevenue.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">{percent.toFixed(1)}%</span>
                        <div className="w-20 bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${percent}%`, backgroundColor: g.primaryColor }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizations (Recharts Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Members Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
              Adhérents Actifs par Établissement
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsPerGym} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="activeCount" fill={primaryColor} radius={[6, 6, 0, 0]} name="Adhérents Actifs">
                  {statsPerGym.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.primaryColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active subscription plans repartition (PieChart / Donut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
              Répartition des Formules d'Abonnement
            </h3>
          </div>
          <div className="h-72 w-full flex flex-col justify-between">
            {planDistributionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                Aucun adhérent actif pour le moment.
              </div>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {planDistributionData.map((entry, index) => {
                          const colorsList = [
                            primaryColor,
                            secondaryColor,
                            "#3b82f6", // Blue
                            "#8b5cf6", // Violet
                            "#10b981", // Emerald
                            "#f59e0b", // Amber
                            "#ec4899", // Pink
                            "#06b6d4"  // Cyan
                          ];
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colorsList[index % colorsList.length]}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                        formatter={(value: any) => [`${value} adhérent(s)`, "Total"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom dynamic legend to show precise statistics */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 max-h-16 overflow-y-auto pr-1">
                  {planDistributionData.map((entry, index) => {
                    const colorsList = [
                      primaryColor,
                      secondaryColor,
                      "#3b82f6",
                      "#8b5cf6",
                      "#10b981",
                      "#f59e0b",
                      "#ec4899",
                      "#06b6d4"
                    ];
                    return (
                      <div key={entry.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorsList[index % colorsList.length] }} />
                        <span className="truncate text-slate-700 dark:text-slate-300">{entry.name} :</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Revenues Monthly Estimated Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
              Revenus Mensuels Estimés par Établissement
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsPerGym} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: darkMode ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                  formatter={(value: any) => [`${Number(value).toLocaleString("fr-FR")} FCFA`, "Revenu"]}
                />
                <Bar dataKey="estimatedRevenue" fill={secondaryColor} radius={[6, 6, 0, 0]} name="Revenus Estimés">
                  {statsPerGym.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.secondaryColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  ) : activeView === "logs" ? (
    (() => {
    const filteredLogs = managerLogs.filter((log) => {
      // Search matches
      const query = logSearchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.details && log.details.toLowerCase().includes(query));

      // Date range matches
      let matchesDate = true;
      if (logStartDate) {
        const start = new Date(logStartDate);
        start.setHours(0, 0, 0, 0);
        const logDate = new Date(log.createdAt);
        if (logDate < start) matchesDate = false;
      }
      if (logEndDate) {
        const end = new Date(logEndDate);
        end.setHours(23, 59, 59, 999);
        const logDate = new Date(log.createdAt);
        if (logDate > end) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });

    return (
      <main className="activity-log-view max-w-7xl w-full mx-auto p-6 flex-grow space-y-8 no-print animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-500" />
              <span>Journal d'Activité du Gérant</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Historique complet des opérations effectuées (inscriptions, modifications, facturations, suppression) au sein de votre établissement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchManagerLogs}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-sm select-none"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: loadingLogs ? "1.5s" : "0s" }} />
              <span>Actualiser</span>
            </button>
            
            {managerLogs.length > 0 && (
              <>
                <button
                  onClick={handleDownloadLogsCSV}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-colors cursor-pointer shadow-sm select-none"
                  title="Exporter les logs d'activité sous format Excel/CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter en CSV</span>
                </button>

                <button
                  onClick={handleDownloadLogsJSON}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-colors cursor-pointer shadow-sm select-none"
                  title="Exporter les logs d'activité au format structuré JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter en JSON</span>
                </button>

                <button
                  onClick={handleClearManagerLogs}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 transition-colors cursor-pointer shadow-sm select-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider le journal</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Date Filter Panel */}
        {managerLogs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4 transition-colors">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par action ou par détails (ex: Inscription, nom d'adhérent...)"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Date range filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Du</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={logStartDate}
                    onChange={(e) => setLogStartDate(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Au</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={logEndDate}
                    onChange={(e) => setLogEndDate(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Clear filters button */}
              {(logSearchQuery || logStartDate || logEndDate) && (
                <button
                  onClick={() => {
                    setLogSearchQuery("");
                    setLogStartDate("");
                    setLogEndDate("");
                  }}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer flex items-center gap-1 py-2 px-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg transition-colors select-none"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Effacer les filtres</span>
                </button>
              )}
            </div>
          </div>
        )}

        {loadingLogs ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Chargement des logs d'activité...</p>
          </div>
        ) : managerLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Aucune activité enregistrée</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Les actions effectuées (comme l'inscription d'un nouvel adhérent ou la création de factures) s'afficheront ici en temps réel.
              </p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-55 dark:bg-amber-950/10 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Aucun résultat trouvé</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Aucune activité ne correspond à vos critères de recherche ou à la période sélectionnée.
              </p>
            </div>
            <button
              onClick={() => {
                setLogSearchQuery("");
                setLogStartDate("");
                setLogEndDate("");
              }}
              className="text-xs bg-indigo-50 dark:bg-indigo-950/25 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-4 py-2 rounded-xl border border-indigo-100/35 dark:border-indigo-900/30 transition-colors select-none cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-6">Date & Heure</th>
                    <th className="py-4 px-6">Type d'Action</th>
                    <th className="py-4 px-6">Détails de l'Opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredLogs.map((log) => {
                    // Determine badge colors based on action type
                    let badgeStyles = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                    if (log.action.includes("Inscription")) {
                      badgeStyles = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-bold";
                    } else if (log.action.includes("Facture") || log.action.includes("Génération")) {
                      badgeStyles = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 font-bold";
                    } else if (log.action.includes("Modification")) {
                      badgeStyles = "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 font-bold";
                    } else if (log.action.includes("Suppression")) {
                      badgeStyles = "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 font-bold";
                    }

                    const formattedDate = new Date(log.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 select-none">
                          {formattedDate}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] ${badgeStyles}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    );
    })()
  ) : (
      <main className="max-w-4xl w-full mx-auto p-6 flex-grow space-y-8 no-print animate-fade-in">
        {/* Main Form container */}
        <form onSubmit={handleSaveConfig} className="space-y-6">
          
          {/* Row 1: Read-only Club Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">
              Informations d'Établissement (SaaS)
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Ces informations d'enregistrement sont définies par l'Administrateur Système pour la gestion de votre licence Multi-tenant.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Nom du club</span>
                <span className="text-slate-800 font-bold">{gym?.name}</span>
              </div>
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Email Officiel</span>
                <span className="text-slate-800 font-bold">{gym?.email}</span>
              </div>
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Adresse Physique</span>
                <span className="text-slate-800 font-bold">{gym?.address}</span>
              </div>
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Téléphone</span>
                <span className="text-slate-800 font-bold">{gym?.phone}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Brand assets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider">
                Personnalisation Graphique & Branding
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Définissez l'identité visuelle de votre club. Ces éléments (Logo, couleurs) s'appliqueront instantanément sur votre tableau de bord et sur les factures imprimées pour vos adhérents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo upload box */}
              <div className="space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Logo personnalisé de la salle :
                </span>
                
                <div className="flex items-center gap-4">
                  {configLogo ? (
                    <div className="relative">
                      <img
                        src={configLogo}
                        alt="Logo de la salle"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setConfigLogo("")}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow cursor-pointer flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Aucun logo
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                      <span>Sélectionner une image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1000 * 1024) {
                              showToast("Le logo ne doit pas dépasser 1 Mo.", "error");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setConfigLogo(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PNG ou JPG, max 1 Mo. Recommandé : format carré.</p>
                  </div>
                </div>
              </div>

              {/* Slogan input field */}
              <div className="space-y-2 md:col-span-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Slogan ou Phrase d'accroche de l'école :
                </label>
                <input
                  type="text"
                  value={configSlogan}
                  onChange={(e) => setConfigSlogan(e.target.value)}
                  placeholder="ex: Votre santé, notre priorité absolue !"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-medium"
                />
                <p className="text-[10px] text-slate-400">Ce slogan s'affichera fièrement en en-tête de vos factures officielles et documents d'adhérents.</p>
              </div>

              {/* Theme colors block */}
              <div className="space-y-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Palette de Couleurs Thème :
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">
                      Couleur Primaire :
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={configPrimary}
                        onChange={(e) => setConfigPrimary(e.target.value)}
                        className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-semibold text-slate-600 uppercase">{configPrimary}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">
                      Couleur Secondaire :
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={configSecondary}
                        onChange={(e) => setConfigSecondary(e.target.value)}
                        className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-semibold text-slate-600 uppercase">{configSecondary}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Aperçu Thème :</span>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 text-white rounded-lg font-bold shadow-sm" style={{ backgroundColor: configPrimary }}>
                      Bouton Principal
                    </span>
                    <span className="px-2.5 py-1 text-white rounded-lg font-bold shadow-sm" style={{ backgroundColor: configSecondary }}>
                      Bouton Secondaire
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Subscription Plans configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Formules & Plans d'Abonnement du Club
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Définissez les formules tarifaires disponibles pour vos futurs adhérents.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPlan}
                className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-lg hover:brightness-115 transition-all cursor-pointer shadow-sm"
                style={{ backgroundColor: configPrimary }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une Formule</span>
              </button>
            </div>

            <div className="space-y-3">
              {configPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/75 border border-slate-200/60 p-3 rounded-xl"
                >
                  <div className="font-mono text-xs text-slate-400 font-bold">
                    #{index + 1}
                  </div>

                  <div className="flex-1">
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Nom de la formule</label>
                    <input
                      type="text"
                      required
                      value={plan.name}
                      onChange={(e) => handleUpdatePlan(plan.id, "name", e.target.value)}
                      placeholder="ex: Pass Trimestriel"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Durée (Mois)</label>
                    <input
                      type="number"
                      min={1}
                      max={36}
                      required
                      value={plan.durationMonths}
                      onChange={(e) => handleUpdatePlan(plan.id, "durationMonths", Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Tarif (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={plan.price}
                      onChange={(e) => handleUpdatePlan(plan.id, "price", Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end justify-end sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100 flex items-center justify-center"
                      title="Supprimer cette formule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Configuration Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-md">
              En enregistrant, vos réglages de marque et formules s'appliqueront immédiatement à tous les postes.
            </p>
            
            <button
              type="submit"
              disabled={savingConfig}
              className="text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
              style={{ backgroundColor: configPrimary }}
            >
              {savingConfig ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder les Réglages</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    )}

      {/* MEMBER CREATION / MODIFICATION MODAL */}
      {isMemberModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display font-bold text-slate-800 text-lg">
                {editingMember.id ? "Modifier la fiche de l'adhérent" : "Inscrire un nouvel adhérent"}
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo upload box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Photo de l'adhérent :
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/10"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                  }`}
                >
                  {editingMember.photo ? (
                    <div className="relative">
                      <img
                        src={editingMember.photo}
                        alt="Aperçu"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingMember({ ...editingMember, photo: "" })}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-500">
                        <label className="text-blue-600 font-bold hover:underline cursor-pointer">
                          Sélectionnez un fichier
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>{" "}
                        ou glissez-déposez ici
                      </div>
                      <p className="text-[9px] text-slate-400">JPEG, PNG max 1 Mo</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nom Complet :
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.name || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Adresse Email :
                  </label>
                  <input
                    type="email"
                    required
                    value={editingMember.email || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    placeholder="jean@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Téléphone :
                  </label>
                  <input
                    type="text"
                    value={editingMember.phone || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Formule d'Abonnement :
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    value={editingMember.subscriptionType || ""}
                    onChange={(e) => handlePlanChange(e.target.value)}
                  >
                    {gym?.subscriptionPlans.map((plan) => (
                      <option key={plan.id} value={plan.name}>
                        {plan.name} ({plan.price.toLocaleString('fr-FR')} FCFA)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date Début :
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMember.subscriptionStart || ""}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date d'Expiration (Calculée) :
                  </label>
                  <input
                    type="date"
                    required
                    readOnly
                    value={editingMember.subscriptionEnd || ""}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                    title="La date de fin est déterminée automatiquement selon la formule choisie."
                  />
                </div>
              </div>

              {/* Additional custom gym-specific fields */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Informations de Santé & Profil
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Âge :
                    </label>
                    <input
                      type="number"
                      value={editingMember.age || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, age: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="ex: 28"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Taille (cm) :
                    </label>
                    <input
                      type="number"
                      value={editingMember.height || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, height: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="ex: 175"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Sexe / Genre :
                    </label>
                    <select
                      value={editingMember.gender || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Domicile (Quartier) :
                    </label>
                    <input
                      type="text"
                      value={editingMember.neighborhood || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, neighborhood: e.target.value })}
                      placeholder="ex: Plateau, Cocody"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Fonction / Profession :
                    </label>
                    <input
                      type="text"
                      value={editingMember.occupation || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, occupation: e.target.value })}
                      placeholder="ex: Enseignant, Comptable, Étudiant..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Antécédents Médicaux :
                    </label>
                    <textarea
                      rows={2}
                      value={editingMember.medicalHistory || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, medicalHistory: e.target.value })}
                      placeholder="ex: Asthme, hernie discale, aucun..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 resize-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Allergies / Intolérances :
                    </label>
                    <textarea
                      rows={2}
                      value={editingMember.allergies || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, allergies: e.target.value })}
                      placeholder="ex: Arachides, Pénicilline, aucune..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 resize-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Objectifs Physiques :
                    </label>
                    <textarea
                      rows={2}
                      value={editingMember.physicalGoals || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, physicalGoals: e.target.value })}
                      placeholder="ex: Prise de muscle, perte de poids..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 resize-none text-xs"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-3.5 space-y-3 mb-4">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Contact d'Urgence (Proche à prévenir)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Nom complet du proche :
                      </label>
                      <input
                        type="text"
                        value={editingMember.emergencyContactName || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, emergencyContactName: e.target.value })}
                        placeholder="ex: Marie Dupont (Épouse)"
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Numéro de téléphone :
                      </label>
                      <input
                        type="text"
                        value={editingMember.emergencyContactPhone || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, emergencyContactPhone: e.target.value })}
                        placeholder="ex: +33 6 99 88 77 66"
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Statut du contrat :
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={editingMember.status || "Active"}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as any })}
                >
                  <option value="Active">Actif</option>
                  <option value="Suspended">Suspendu</option>
                  <option value="Expired">Expiré</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer la Fiche</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EXPIRATION ALERT REMINDER GENERATION MODAL */}
      {isAlertModalOpen && selectedAlertMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display font-bold text-slate-800 text-base flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                <span>Rappel d'Inscription Inteligente IA</span>
              </h3>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50/50 border border-blue-100/60 p-3 rounded-xl text-xs text-slate-700 leading-relaxed">
                Rappel rédigé amicalement en français pour <strong>{selectedAlertMember.name}</strong> ({selectedAlertMember.subscriptionType}). Fin de l'inscription dans 5 jours le {selectedAlertMember.subscriptionEnd}.
              </div>

              {generatingAlert ? (
                <div className="space-y-2 py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                  <p className="text-xs text-slate-500 mt-2">L'IA Gemini rédige un message personnalisé amical en français...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Aperçu & Personnalisation du message :
                  </label>
                  <textarea
                    rows={8}
                    value={geminiMessage}
                    onChange={(e) => setGeminiMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-blue-500 whitespace-pre-wrap"
                  />
                  <p className="text-[10px] text-slate-400 italic font-medium">
                    Note : Aucun paiement n'est requis en ligne. Les adhérents règlent directement sur place.
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={generatingAlert || !geminiMessage}
                  onClick={handleSendAlert}
                  className="text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmer l'envoi / Notifier</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PRINTABLE RECEIPT / INVOICE MODAL */}
      {isInvoiceModalOpen && selectedInvoiceMember && invoiceDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden no-print"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-display font-bold text-slate-800 text-lg">
                Générer & Émettre la Facture
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Invoice settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/50 p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Méthode de Règlement :
                  </label>
                  <select
                    value={invoiceDetails.paymentMethod}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Carte Bancaire (Hors-Ligne)">Carte Bancaire (Hors-Ligne)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Statut de la facture :
                  </label>
                  <select
                    value={invoiceDetails.status}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 font-semibold"
                  >
                    <option value="Paid">Payée (Acquittée)</option>
                    <option value="Pending">En attente (Non-Payée)</option>
                  </select>
                </div>
              </div>

              {/* Invoice Sheet Visual Preview */}
              <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-4 shadow-sm text-xs">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex items-start gap-3">
                    {gym?.logo && (
                      <img
                        src={gym.logo}
                        alt="Logo de la salle"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{gym?.name}</h4>
                      {gym?.slogan && (
                        <p className="text-[10px] text-blue-600 font-semibold italic mt-0.5">
                          « {gym.slogan} »
                        </p>
                      )}
                      <p className="text-slate-400 leading-relaxed font-medium mt-1">
                        {gym?.address}<br />
                        Tel : {gym?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-bold tracking-wider uppercase text-[10px]">
                      FACTURE ACQUITTEE
                    </span>
                    <h4 className="font-bold text-slate-800 mt-0.5">{invoiceDetails.invoiceNumber}</h4>
                    <p className="text-slate-400 font-mono mt-0.5">{invoiceDetails.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Facturé à :</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedInvoiceMember.name}</p>
                    <p className="text-slate-400">{selectedInvoiceMember.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Matricule Adhérent :</span>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedInvoiceMember.registrationNumber}</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse mt-4">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-bold">
                      <th className="pb-1.5 font-bold">Désignation de la formule</th>
                      <th className="pb-1.5 text-center font-bold">Période</th>
                      <th className="pb-1.5 text-right font-bold">Prix HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-800 font-medium">
                      <td className="py-2.5">{invoiceDetails.planName}</td>
                      <td className="py-2.5 text-center text-slate-500 font-mono">
                        {selectedInvoiceMember.subscriptionStart} au {selectedInvoiceMember.subscriptionEnd}
                      </td>
                      <td className="py-2.5 text-right font-mono">{Math.round((invoiceDetails.amount || 0) * 0.8333).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-slate-100 pt-3 flex flex-col items-end gap-1.5">
                  <div className="flex justify-between w-44 text-slate-500 text-xs">
                    <span>TVA (20%) :</span>
                    <span className="font-mono">{Math.round((invoiceDetails.amount || 0) * 0.1667).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="flex justify-between w-44 text-slate-800 font-bold text-sm pt-1.5 border-t border-slate-100">
                    <span>Total Payé :</span>
                    <span className="font-mono text-slate-900">{(invoiceDetails.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[10px] text-slate-500 text-center leading-relaxed">
                  Règlement reçu par : <strong>{invoiceDetails.paymentMethod}</strong>. Aucun paiement effectué en ligne.
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveAndDownloadPDFInvoice}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Télécharger le PDF</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveAndPrintInvoice}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Enregistrer & Imprimer</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PRINT-ONLY EMBEDDED INVOICE LAYOUT (renders on window.print()) */}
      {isInvoiceModalOpen && selectedInvoiceMember && invoiceDetails && (
        <div id="printable-invoice" className="hidden print:block p-12 bg-white text-black font-sans w-full max-w-4xl">
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div className="flex items-start gap-4">
              {gym?.logo && (
                <img
                  src={gym.logo}
                  alt="Logo de la salle"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-300 shadow-sm shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{gym?.name}</h1>
                {gym?.slogan && (
                  <p className="text-xs text-gray-700 italic font-semibold mt-1">
                    « {gym.slogan} »
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {gym?.address}<br />
                  Email : {gym?.email} | Tél : {gym?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                REÇU / FACTURE D'ABONNEMENT
              </span>
              <h2 className="text-xl font-mono font-bold mt-1">{invoiceDetails.invoiceNumber}</h2>
              <p className="text-sm text-gray-600 mt-1 font-mono">Date : {invoiceDetails.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <span className="text-xs text-gray-500 block font-bold uppercase tracking-wider">Facturé à :</span>
              <p className="font-bold text-lg text-black mt-1">{selectedInvoiceMember.name}</p>
              <p className="text-sm text-gray-600 mt-0.5">{selectedInvoiceMember.email}</p>
              <p className="text-sm text-gray-600">{selectedInvoiceMember.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block font-bold uppercase tracking-wider">Détails de l'Adhérent :</span>
              <p className="font-mono font-bold text-gray-800 text-lg mt-1">Matricule : {selectedInvoiceMember.registrationNumber}</p>
              <p className="text-sm text-gray-600 mt-0.5">Inscrit le : {selectedInvoiceMember.createdAt?.split("T")[0]}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-10">
            <thead>
              <tr className="border-b-2 border-black text-xs font-bold uppercase text-gray-500 tracking-wider">
                <th className="pb-3 font-bold">Désignation de la formule</th>
                <th className="pb-3 text-center font-bold">Période de Validité</th>
                <th className="pb-3 text-right font-bold">Prix HT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm text-black font-semibold border-b border-gray-200">
                <td className="py-4 text-base">{invoiceDetails.planName}</td>
                <td className="py-4 text-center font-mono">
                  {selectedInvoiceMember.subscriptionStart} au {selectedInvoiceMember.subscriptionEnd}
                </td>
                <td className="py-4 text-right font-mono">{Math.round((invoiceDetails.amount || 0) * 0.8333).toLocaleString('fr-FR')} FCFA</td>
              </tr>
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-2 mb-12">
            <div className="flex justify-between w-64 text-sm text-gray-600">
              <span>TVA (20%) :</span>
              <span className="font-mono">{Math.round((invoiceDetails.amount || 0) * 0.1667).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between w-64 font-bold text-lg pt-3 border-t border-black">
              <span>Total Payé :</span>
              <span className="font-mono">{(invoiceDetails.amount || 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          <div className="border border-black p-4 rounded text-xs text-gray-600 leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-black mb-1">CONDITIONS DE REGLEMENT</p>
            <p>
              Règlement enregistré sous le mode : <strong>{invoiceDetails.paymentMethod}</strong> (Statut : {invoiceDetails.status === 'Paid' ? 'ACQUITTEE' : 'EN ATTENTE'}). Aucun paiement en ligne ou intermédiaire de paiement électronique ne s'effectue sur notre application, tout règlement est perçu directement sur place en main propre par le gestionnaire.
            </p>
          </div>

          <div className="text-center text-xs text-gray-400 mt-12 font-medium">
            <p>Merci pour votre confiance et à bientôt dans votre espace de fitness {gym?.name} !</p>
            <p className="mt-1 font-mono text-[9px]">Émis par GymSync Multi-Tenant SaaS - ID: {gymId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
