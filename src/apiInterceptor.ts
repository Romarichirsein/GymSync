import { Gym, Member, Invoice, AlertLog, SanityConfig, OneTimeSession, ManagerLog } from "./types";

const DB_KEY = "gymsync_db";
let needsSync = true;

const initialGyms: Gym[] = [
  {
    id: "gym-1",
    name: "FitZone Arena",
    slug: "fitzone-arena",
    logo: "",
    primaryColor: "#0f766e",
    secondaryColor: "#f97316",
    email: "contact@fitzone-arena.com",
    phone: "+33 1 23 45 67 89",
    address: "12 Rue de la Pompe, 75016 Paris",
    subscriptionPlans: [
      { id: "plan-month", name: "Pass Mensuel", durationMonths: 1, price: 39 },
      { id: "plan-quarter", name: "Formule Trimestre", durationMonths: 3, price: 99 },
      { id: "plan-year", name: "Abonnement Annuel", durationMonths: 12, price: 349 }
    ],
    createdAt: "2026-01-10T10:00:00Z",
    managerEmail: "manager@fitzone.com",
    managerPassword: "password123",
    subscriptionEnd: "2026-02-09",
    status: "blocked",
    notifications: [
      {
        id: "system-expire-blocked-1782486011235",
        title: "Accès suspendu - Abonnement expiré",
        message: "Votre abonnement a expiré le 2026-02-09. L'accès à votre espace de gestion a été suspendu automatiquement. Veuillez contacter le super administrateur pour renouveler votre abonnement.",
        createdAt: "2026-06-26T15:00:11.235Z",
        isRead: false,
        type: "danger"
      }
    ]
  },
  {
    id: "gym-2",
    name: "Zen Wellness Club",
    slug: "zen-wellness",
    logo: "",
    primaryColor: "#6b21a8",
    secondaryColor: "#06b6d4",
    email: "info@zen-wellness.fr",
    phone: "+33 1 98 76 54 32",
    address: "85 Boulevard Saint-Germain, 75006 Paris",
    subscriptionPlans: [
      { id: "plan-zen-month", name: "Sérénité Mensuelle", durationMonths: 1, price: 49 },
      { id: "plan-zen-quarter", name: "Sérénité Trimestrielle", durationMonths: 3, price: 129 },
      { id: "plan-zen-year", name: "Harmonie Annuelle", durationMonths: 12, price: 449 }
    ],
    createdAt: "2026-02-15T14:30:00Z",
    managerEmail: "manager@zen.com",
    managerPassword: "password123",
    subscriptionEnd: "2026-03-17",
    status: "blocked",
    notifications: [
      {
        id: "system-expire-blocked-1782486011235",
        title: "Accès suspendu - Abonnement expiré",
        message: "Votre abonnement a expiré le 2026-03-17. L'accès à votre espace de gestion a été suspendu automatiquement. Veuillez contacter le super administrateur pour renouveler votre abonnement.",
        createdAt: "2026-06-26T15:00:11.235Z",
        isRead: false,
        type: "danger"
      }
    ]
  }
];

const initialMembers: Member[] = [
  {
    id: "mem-1",
    gymId: "gym-1",
    name: "Jean Dupont",
    email: "jean.dupont@gmail.com",
    phone: "+33 6 12 34 56 78",
    subscriptionType: "Pass Mensuel",
    subscriptionStart: "2026-05-31",
    subscriptionEnd: "2026-06-30",
    status: "Active",
    registrationNumber: "ADH-2026-0001",
    createdAt: "2026-05-31"
  },
  {
    id: "mem-2",
    gymId: "gym-1",
    name: "Amélie Martin",
    email: "amelie.martin@yahoo.fr",
    phone: "+33 6 98 76 54 32",
    subscriptionType: "Abonnement Annuel",
    subscriptionStart: "2026-03-17",
    subscriptionEnd: "2027-03-17",
    status: "Active",
    registrationNumber: "ADH-2026-0002",
    createdAt: "2026-03-17"
  },
  {
    id: "mem-3",
    gymId: "gym-1",
    name: "Thomas Dubois",
    email: "thomas.dupois@outlook.fr",
    phone: "+33 6 55 44 33 22",
    subscriptionType: "Pass Mensuel",
    subscriptionStart: "2026-05-21",
    subscriptionEnd: "2026-06-20",
    status: "Expired",
    registrationNumber: "ADH-2026-0003",
    createdAt: "2026-05-21"
  },
  {
    id: "mem-4",
    gymId: "gym-1",
    name: "Sophie Leroy",
    email: "sophie.leroy@gmail.com",
    phone: "+33 6 88 99 00 11",
    subscriptionType: "Formule Trimestre",
    subscriptionStart: "2026-04-01",
    subscriptionEnd: "2026-06-30",
    status: "Active",
    registrationNumber: "ADH-2026-0004",
    createdAt: "2026-04-01"
  },
  {
    id: "mem-5",
    gymId: "gym-2",
    name: "Lucas Bernard",
    email: "lucas.b@gmail.com",
    phone: "+33 7 11 22 33 44",
    subscriptionType: "Sérénité Mensuelle",
    subscriptionStart: "2026-05-31",
    subscriptionEnd: "2026-06-30",
    status: "Active",
    registrationNumber: "ADH-2026-0101",
    createdAt: "2026-05-31"
  },
  {
    id: "mem-6",
    gymId: "gym-2",
    name: "Chloé Petit",
    email: "chloe.petit@gmail.com",
    phone: "+33 7 99 88 77 66",
    subscriptionType: "Harmonie Annuelle",
    subscriptionStart: "2026-06-15",
    subscriptionEnd: "2027-06-15",
    status: "Active",
    registrationNumber: "ADH-2026-0102",
    createdAt: "2026-06-15"
  }
];

const initialInvoices: Invoice[] = [
  {
    id: "inv-1",
    memberId: "mem-1",
    gymId: "gym-1",
    invoiceNumber: "FAC-2026-0001",
    date: "2026-05-31",
    amount: 39,
    paymentMethod: "Espèces",
    status: "Paid",
    planName: "Pass Mensuel"
  },
  {
    id: "inv-2",
    memberId: "mem-2",
    gymId: "gym-1",
    invoiceNumber: "FAC-2026-0002",
    date: "2026-03-17",
    amount: 349,
    paymentMethod: "Virement",
    status: "Paid",
    planName: "Abonnement Annuel"
  }
];

interface DB {
  gyms: Gym[];
  members: Member[];
  invoices: Invoice[];
  alertLogs: AlertLog[];
  sanityConfig: SanityConfig;
  oneTimeSessions?: OneTimeSession[];
  managerLogs?: ManagerLog[];
}

function getLocalDb(): DB {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    const initial: DB = {
      gyms: initialGyms,
      members: initialMembers,
      invoices: initialInvoices,
      alertLogs: [],
      sanityConfig: { projectId: "", dataset: "", token: "", useSanity: false },
      oneTimeSessions: [],
      managerLogs: []
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  const parsed = JSON.parse(data) as DB;
  if (!parsed.oneTimeSessions) parsed.oneTimeSessions = [];
  if (!parsed.managerLogs) parsed.managerLogs = [];
  return parsed;
}

function saveLocalDb(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function cleanId(id: string | undefined | null): string {
  if (!id) return "";
  return id.replace(/^(gym-mem-|mem-gym-|gym-|mem-|inv-|session-|managerlog-|mlog-)+/, "");
}

function localCheckSubscriptionStatus(db: DB): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  let changed = false;

  db.gyms = db.gyms.map((gym: Gym) => {
    if (!gym.subscriptionEnd) {
      const createdDate = gym.createdAt ? new Date(gym.createdAt) : new Date();
      createdDate.setDate(createdDate.getDate() + 30);
      gym.subscriptionEnd = createdDate.toISOString().split("T")[0];
      changed = true;
    }
    if (!gym.status) {
      gym.status = "active";
      changed = true;
    }
    if (!gym.notifications) {
      gym.notifications = [];
      changed = true;
    }

    const endOffset = new Date(gym.subscriptionEnd);
    endOffset.setHours(0, 0, 0, 0);
    const endOffsetTime = endOffset.getTime();
    const diffTime = endOffsetTime - todayTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Auto warning: 5 days or less remaining
    if (diffDays <= 5 && diffDays > 0) {
      const alertId = `system-expire-warning-${gym.subscriptionEnd}`;
      const hasWarning = gym.notifications.some((n: any) => n.id === alertId);
      if (!hasWarning) {
        gym.notifications.push({
          id: alertId,
          title: "Abonnement expirant bientôt !",
          message: `Attention, l'abonnement de votre salle se termine dans ${diffDays} jour(s) (le ${gym.subscriptionEnd}). Veuillez contacter le super administrateur pour régulariser votre cotisation afin d'éviter la suspension automatique de vos accès.`,
          createdAt: new Date().toISOString(),
          isRead: false,
          type: "warning"
        });
        changed = true;
      }
    }

    // Auto block: past subscription end date
    if (diffDays <= 0 && gym.status === "active") {
      gym.status = "blocked";
      gym.notifications.push({
        id: `system-expire-blocked-${Date.now()}`,
        title: "Accès suspendu - Abonnement expiré",
        message: `Votre abonnement a expiré le ${gym.subscriptionEnd}. L'accès à votre espace de gestion a été suspendu automatiquement. Veuillez contacter le super administrateur pour renouveler votre abonnement.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: "danger"
      });
      changed = true;
    }

    return gym;
  });

  return changed;
}

// Simulated response routing
async function handleLocalStorageFallback(url: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  const method = (init?.method || "GET").toUpperCase();
  const bodyData = init?.body ? JSON.parse(init.body as string) : null;

  if (method !== "GET" && path !== "/api/login") {
    needsSync = true;
  }

  // 1. GET /api/gyms
  if (path === "/api/gyms" && method === "GET") {
    const db = getLocalDb();
    const changed = localCheckSubscriptionStatus(db);
    if (changed) saveLocalDb(db);
    return new Response(JSON.stringify(db.gyms), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 2. POST /api/login
  if (path === "/api/login" && method === "POST") {
    const { email, password } = bodyData || {};
    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: "L'identifiant et le mot de passe sont requis" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (
      (email === "admin@gymsync.com" || email === "admin") &&
      (password === "admin123" || password === "admin")
    ) {
      return new Response(JSON.stringify({
        success: true,
        role: "admin",
        message: "Connexion réussie en tant que Super Administrateur"
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const db = getLocalDb();
    localCheckSubscriptionStatus(db);
    saveLocalDb(db);

    const gym = db.gyms.find(
      (g) => g.managerEmail?.toLowerCase() === email.toLowerCase() && g.managerPassword === password
    );

    if (gym) {
      if (gym.status === "blocked") {
        return new Response(JSON.stringify({
          success: false,
          message: `L'accès pour la salle de sport « ${gym.name} » est actuellement bloqué en raison d'un abonnement expiré. Veuillez contacter le Super Administrateur pour régler votre situation.`
        }), { status: 403, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: true,
        role: "manager",
        gymId: gym.id,
        gymName: gym.name,
        message: `Connexion réussie en tant que Gérant de ${gym.name}`
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: false,
      message: "Identifiants de connexion incorrects. Veuillez vérifier l'e-mail ou le mot de passe."
    }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  // 3. POST /api/gyms
  if (path === "/api/gyms" && method === "POST") {
    const db = getLocalDb();
    const gymData = bodyData as Gym;
    gymData.updatedAt = new Date().toISOString();
    const existingIndex = db.gyms.findIndex((g) => cleanId(g.id) === cleanId(gymData.id));
    if (existingIndex > -1) {
      db.gyms[existingIndex] = { ...db.gyms[existingIndex], ...gymData };
      
      // Log update activity
      db.managerLogs = db.managerLogs || [];
      db.managerLogs.unshift({
        id: `mlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gymId: cleanId(gymData.id),
        action: "Configuration de la salle",
        details: "Mise à jour des paramètres du club (couleurs, forfaits, logo, coordonnées)",
        createdAt: new Date().toISOString()
      });
      
      saveLocalDb(db);
      return new Response(JSON.stringify({ success: true, gym: db.gyms[existingIndex] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const newGym: Gym = {
      ...gymData,
      id: gymData.id || `gym-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "active",
      notifications: [],
      updatedAt: new Date().toISOString()
    };
    db.gyms.push(newGym);
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, gym: newGym }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 4. POST /api/gyms/:gymId/status
  const statusMatch = path.match(/^\/api\/gyms\/([^/]+)\/status$/);
  if (statusMatch && method === "POST") {
    const gymId = statusMatch[1];
    const { status, subscriptionEnd, reason } = bodyData || {};
    const db = getLocalDb();
    const gym = db.gyms.find((g) => cleanId(g.id) === cleanId(gymId));
    if (!gym) {
      return new Response(JSON.stringify({ success: false, message: "Salle de sport introuvable." }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    if (status) gym.status = status;
    if (subscriptionEnd) gym.subscriptionEnd = subscriptionEnd;
    gym.updatedAt = new Date().toISOString();
    if (!gym.notifications) gym.notifications = [];

    if (status === "active") {
      gym.notifications.unshift({
        id: `admin-status-active-${Date.now()}`,
        title: "Paiement Validé / Compte Activé ! 🎉",
        message: reason || `Votre situation a été régularisée par le Super Administrateur. Votre abonnement est prolongé jusqu'au ${gym.subscriptionEnd || "nouvelle échéance"}. Merci pour votre confiance !`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: "info"
      });
    } else if (status === "blocked") {
      gym.notifications.unshift({
        id: `admin-status-blocked-${Date.now()}`,
        title: "Compte Suspendu par l'Administrateur ⚠️",
        message: reason || "Votre compte a été suspendu par le Super Administrateur. Veuillez régulariser vos paiements ou contacter l'administration.",
        createdAt: new Date().toISOString(),
        isRead: false,
        type: "danger"
      });
    }

    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, gym }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 5. GET /api/gyms/:gymId/notifications
  const notificationsMatch = path.match(/^\/api\/gyms\/([^/]+)\/notifications$/);
  if (notificationsMatch && method === "GET") {
    const gymId = notificationsMatch[1];
    const db = getLocalDb();
    const gym = db.gyms.find((g) => cleanId(g.id) === cleanId(gymId));
    return new Response(JSON.stringify(gym?.notifications || []), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 6. POST /api/gyms/:gymId/notifications/:notifId/read
  const notifReadMatch = path.match(/^\/api\/gyms\/([^/]+)\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === "POST") {
    const gymId = notifReadMatch[1];
    const notifId = notifReadMatch[2];
    const db = getLocalDb();
    const gym = db.gyms.find((g) => cleanId(g.id) === cleanId(gymId));
    if (gym && gym.notifications) {
      const notif = gym.notifications.find((n: any) => n.id === notifId);
      if (notif) {
        notif.isRead = true;
      }
    }
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 7. GET /api/members
  if (path === "/api/members" && method === "GET") {
    const db = getLocalDb();
    return new Response(JSON.stringify(db.members), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 8. GET /api/gyms/:gymId/members
  const gymMembersMatch = path.match(/^\/api\/gyms\/([^/]+)\/members$/);
  if (gymMembersMatch && method === "GET") {
    const gymId = gymMembersMatch[1];
    const db = getLocalDb();
    const gymMembers = db.members.filter((m) => cleanId(m.gymId) === cleanId(gymId));
    return new Response(JSON.stringify(gymMembers), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 9. POST /api/members
  if (path === "/api/members" && method === "POST") {
    const db = getLocalDb();
    const memberData = bodyData as Member;
    memberData.gymId = cleanId(memberData.gymId);
    memberData.updatedAt = new Date().toISOString();
    let member: Member;
    if (memberData.id) {
      // Update
      const idx = db.members.findIndex((m) => m.id === memberData.id);
      if (idx !== -1) {
        db.members[idx] = { ...db.members[idx], ...memberData };
        member = db.members[idx];
      } else {
        member = memberData;
      }
    } else {
      // Create
      const gymId = memberData.gymId;
      const count = db.members.filter((m) => cleanId(m.gymId) === cleanId(gymId)).length;
      const regNum = `ADH-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      member = {
        ...memberData,
        id: `mem-${Date.now()}`,
        registrationNumber: regNum,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString()
      };
      db.members.push(member);
    }
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, member }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 10. DELETE /api/members/:id
  const memberDeleteMatch = path.match(/^\/api\/members\/([^/]+)$/);
  if (memberDeleteMatch && method === "DELETE") {
    const id = memberDeleteMatch[1];
    const db = getLocalDb();
    db.members = db.members.filter((m) => m.id !== id);
    db.invoices = db.invoices.filter((i) => i.memberId !== id);
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 11. GET /api/invoices
  if (path === "/api/invoices" && method === "GET") {
    const db = getLocalDb();
    return new Response(JSON.stringify(db.invoices), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 12. GET /api/gyms/:gymId/invoices
  const gymInvoicesMatch = path.match(/^\/api\/gyms\/([^/]+)\/invoices$/);
  if (gymInvoicesMatch && method === "GET") {
    const gymId = gymInvoicesMatch[1];
    const db = getLocalDb();
    const gymInvoices = db.invoices.filter((i) => cleanId(i.gymId) === cleanId(gymId));
    return new Response(JSON.stringify(gymInvoices), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 13. POST /api/invoices
  if (path === "/api/invoices" && method === "POST") {
    const db = getLocalDb();
    const invoiceData = bodyData as Invoice;
    invoiceData.gymId = cleanId(invoiceData.gymId);
    invoiceData.updatedAt = new Date().toISOString();
    let invoice: Invoice;
    if (invoiceData.id) {
      const idx = db.invoices.findIndex((i) => i.id === invoiceData.id);
      if (idx !== -1) {
        db.invoices[idx] = { ...db.invoices[idx], ...invoiceData };
        invoice = db.invoices[idx];
      } else {
        invoice = invoiceData;
      }
    } else {
      const count = db.invoices.length;
      const invNum = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
      invoice = {
        ...invoiceData,
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        date: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString()
      };
      db.invoices.push(invoice);
    }
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, invoice }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 14. GET /api/alerts/expiring
  if (path === "/api/alerts/expiring" && method === "GET") {
    const db = getLocalDb();
    const anchorDate = new Date("2026-06-25T12:00:00Z");
    const expiring = db.members.filter((m) => {
      if (m.status !== "Active") return false;
      const endDate = new Date(m.subscriptionEnd + "T12:00:00Z");
      const diffTime = endDate.getTime() - anchorDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 5;
    });
    return new Response(JSON.stringify(expiring), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 15. POST /api/alerts/generate
  if (path === "/api/alerts/generate" && method === "POST") {
    const { memberId, gymId, daysRemaining } = bodyData || {};
    const db = getLocalDb();
    const member = db.members.find((m) => m.id === memberId);
    const gym = db.gyms.find((g) => cleanId(g.id) === cleanId(gymId));
    if (!member || !gym) {
      return new Response(JSON.stringify({ error: "Adhérent ou Salle introuvable" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const text = `Bonjour ${member.name}, votre abonnement ${member.subscriptionType} chez ${gym.name} arrive à expiration dans exactement ${daysRemaining} jours (le ${member.subscriptionEnd}). Pensez à renouveler votre formule pour continuer à profiter de nos équipements de musculation et cours collectifs. À très vite !`;
    return new Response(JSON.stringify({ message: text }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 16. POST /api/alerts/dispatch
  if (path === "/api/alerts/dispatch" && method === "POST") {
    const { memberId, gymId, customMessage } = bodyData || {};
    const db = getLocalDb();
    const member = db.members.find((m) => m.id === memberId);
    const gym = db.gyms.find((g) => cleanId(g.id) === cleanId(gymId));
    if (!member || !gym) {
      return new Response(JSON.stringify({ error: "Adhérent ou Salle introuvable" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const anchorDate = new Date("2026-06-25T12:00:00Z");
    const endDate = new Date(member.subscriptionEnd + "T12:00:00Z");
    const diffDays = Math.ceil((endDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));

    const newLog: AlertLog = {
      id: `log-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      gymId: gym.id,
      gymName: gym.name,
      daysRemaining: diffDays,
      alertDate: new Date().toISOString().split("T")[0],
      customMessage: customMessage || "Alerte de fin de contrat envoyée.",
      sent: true,
      sentAt: new Date().toISOString()
    };

    db.alertLogs.unshift(newLog);
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, log: newLog }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 17. GET /api/alerts/logs
  if (path === "/api/alerts/logs" && method === "GET") {
    const db = getLocalDb();
    return new Response(JSON.stringify(db.alertLogs), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 18. GET /api/sanity-config
  if (path === "/api/sanity-config" && method === "GET") {
    const db = getLocalDb();
    return new Response(JSON.stringify(db.sanityConfig), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 19. POST /api/sanity-config
  if (path === "/api/sanity-config" && method === "POST") {
    const db = getLocalDb();
    db.sanityConfig = bodyData;
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 20. POST /api/sanity-config/sync
  if (path === "/api/sanity-config/sync" && method === "POST") {
    return new Response(JSON.stringify({ success: true, count: 0, message: "Synchronisation simulée avec succès en mode local." }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 21. DELETE /api/gyms/:gymId
  const deleteGymMatch = path.match(/^\/api\/gyms\/([^/]+)$/);
  if (deleteGymMatch && method === "DELETE") {
    const gymId = deleteGymMatch[1];
    const db = getLocalDb();
    
    const cleanId = (id: string) => id.replace(/^(gym-)+/, "");
    const gymIndex = db.gyms.findIndex((g) => cleanId(g.id) === cleanId(gymId));
    if (gymIndex === -1) {
      return new Response(JSON.stringify({ success: false, message: "Salle de sport introuvable." }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const gymName = db.gyms[gymIndex].name;
    const targetGymId = db.gyms[gymIndex].id;
    
    // Cascading delete
    db.gyms.splice(gymIndex, 1);
    db.members = db.members.filter((m) => cleanId(m.gymId) !== cleanId(targetGymId));
    db.invoices = db.invoices.filter((inv) => cleanId(inv.gymId) !== cleanId(targetGymId));
    if (db.oneTimeSessions) {
      db.oneTimeSessions = db.oneTimeSessions.filter((s) => cleanId(s.gymId) !== cleanId(targetGymId));
    }
    if (db.managerLogs) {
      db.managerLogs = db.managerLogs.filter((l) => cleanId(l.gymId) !== cleanId(targetGymId));
    }
    db.alertLogs = db.alertLogs.filter((l) => cleanId(l.gymId) !== cleanId(targetGymId));

    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, message: `La salle de sport "${gymName}" et toutes ses données associées ont été supprimées avec succès en mode local.` }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 22. GET /api/one-time-sessions
  if (path === "/api/one-time-sessions" && method === "GET") {
    const db = getLocalDb();
    return new Response(JSON.stringify(db.oneTimeSessions || []), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 23. GET /api/gyms/:gymId/one-time-sessions
  const getSessionsMatch = path.match(/^\/api\/gyms\/([^/]+)\/one-time-sessions$/);
  if (getSessionsMatch && method === "GET") {
    const gymId = getSessionsMatch[1];
    const db = getLocalDb();
    const sessions = (db.oneTimeSessions || []).filter((s) => cleanId(s.gymId) === cleanId(gymId));
    return new Response(JSON.stringify(sessions), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (path === "/api/one-time-sessions" && method === "POST") {
    const db = getLocalDb();
    const sessionData = bodyData || {};
    sessionData.gymId = cleanId(sessionData.gymId);
    sessionData.id = sessionData.id || `session-${Date.now()}`;
    sessionData.createdAt = sessionData.createdAt || new Date().toISOString();
    sessionData.date = sessionData.date || new Date().toISOString().split("T")[0];
    sessionData.updatedAt = new Date().toISOString();

    db.oneTimeSessions = db.oneTimeSessions || [];
    db.oneTimeSessions.push(sessionData);

    db.managerLogs = db.managerLogs || [];
    db.managerLogs.unshift({
      id: `mlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gymId: cleanId(sessionData.gymId),
      action: "Séance unique enregistrée",
      details: `Entrée enregistrée pour ${sessionData.visitorName} d'un montant de ${sessionData.amount.toLocaleString('fr-FR')} FCFA (${sessionData.paymentMethod})`,
      createdAt: new Date().toISOString()
    });

    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true, session: sessionData }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 25. DELETE /api/one-time-sessions/:id
  const deleteSessionMatch = path.match(/^\/api\/one-time-sessions\/([^/]+)$/);
  if (deleteSessionMatch && method === "DELETE") {
    const sessionId = deleteSessionMatch[1];
    const db = getLocalDb();
    db.oneTimeSessions = db.oneTimeSessions || [];
    const index = db.oneTimeSessions.findIndex((s) => s.id === sessionId);
    if (index > -1) {
      const sess = db.oneTimeSessions[index];
      db.oneTimeSessions.splice(index, 1);

      db.managerLogs = db.managerLogs || [];
      db.managerLogs.unshift({
        id: `mlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gymId: cleanId(sess.gymId),
        action: "Séance unique annulée",
        details: `Entrée de ${sess.visitorName} d'un montant de ${sess.amount.toLocaleString('fr-FR')} FCFA a été supprimée/annulée`,
        createdAt: new Date().toISOString()
      });

      saveLocalDb(db);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: false, message: "Séance introuvable." }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // 26. GET /api/gyms/:gymId/manager-logs
  const getLogsMatch = path.match(/^\/api\/gyms\/([^/]+)\/manager-logs$/);
  if (getLogsMatch && method === "GET") {
    const gymId = getLogsMatch[1];
    const db = getLocalDb();
    const logs = (db.managerLogs || []).filter((l) => cleanId(l.gymId) === cleanId(gymId));
    return new Response(JSON.stringify(logs), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 27. POST /api/gyms/:gymId/manager-logs/clear
  const clearLogsMatch = path.match(/^\/api\/gyms\/([^/]+)\/manager-logs\/clear$/);
  if (clearLogsMatch && method === "POST") {
    const gymId = clearLogsMatch[1];
    const db = getLocalDb();
    if (db.managerLogs) {
      db.managerLogs = db.managerLogs.filter((l) => cleanId(l.gymId) !== cleanId(gymId));
    }
    saveLocalDb(db);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (path === "/api/sync" && method === "POST") {
    const db = getLocalDb();
    return new Response(JSON.stringify({ success: true, db }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: false, message: "Route inconnue en mode local." }), { status: 404, headers: { "Content-Type": "application/json" } });
}

// Intercepts successful online fetch responses and keeps localStorage DB in sync
function updateLocalDbFromOnlineResponse(url: string, method: string, data: any) {
  if (!data) return;
  try {
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;
    const db = getLocalDb();
    let changed = false;

    if (path === "/api/gyms" && method === "GET" && Array.isArray(data)) {
      db.gyms = data;
      changed = true;
    }
    else if (path === "/api/gyms" && method === "POST" && data.success && data.gym) {
      const idx = db.gyms.findIndex((g) => cleanId(g.id) === cleanId(data.gym.id));
      if (idx > -1) {
        db.gyms[idx] = data.gym;
      } else {
        db.gyms.push(data.gym);
      }
      changed = true;
    }
    else if (path.match(/^\/api\/gyms\/([^/]+)\/status$/) && method === "POST" && data.success && data.gym) {
      const idx = db.gyms.findIndex((g) => cleanId(g.id) === cleanId(data.gym.id));
      if (idx > -1) {
        db.gyms[idx] = data.gym;
        changed = true;
      }
    }
    else if ((path === "/api/members" || path.match(/^\/api\/gyms\/([^/]+)\/members$/)) && method === "GET" && Array.isArray(data)) {
      db.members = data;
      changed = true;
    }
    else if (path === "/api/members" && method === "POST" && data.success && data.member) {
      const idx = db.members.findIndex((m) => m.id === data.member.id);
      if (idx > -1) {
        db.members[idx] = data.member;
      } else {
        db.members.push(data.member);
      }
      changed = true;
    }
    else if (path.match(/^\/api\/members\/([^/]+)$/) && method === "DELETE" && data.success) {
      const memberId = path.split("/").pop();
      if (memberId) {
        db.members = db.members.filter((m) => m.id !== memberId);
        db.invoices = db.invoices.filter((i) => i.memberId !== memberId);
        changed = true;
      }
    }
    else if ((path === "/api/invoices" || path.match(/^\/api\/gyms\/([^/]+)\/invoices$/)) && method === "GET" && Array.isArray(data)) {
      db.invoices = data;
      changed = true;
    }
    else if (path === "/api/invoices" && method === "POST" && data.success && data.invoice) {
      const idx = db.invoices.findIndex((i) => i.id === data.invoice.id);
      if (idx > -1) {
        db.invoices[idx] = data.invoice;
      } else {
        db.invoices.push(data.invoice);
      }
      changed = true;
    }
    else if ((path === "/api/one-time-sessions" || path.match(/^\/api\/gyms\/([^/]+)\/one-time-sessions$/)) && method === "GET" && Array.isArray(data)) {
      db.oneTimeSessions = data;
      changed = true;
    }
    else if (path === "/api/one-time-sessions" && method === "POST" && data.success && data.session) {
      db.oneTimeSessions = db.oneTimeSessions || [];
      const idx = db.oneTimeSessions.findIndex((s) => s.id === data.session.id);
      if (idx > -1) {
        db.oneTimeSessions[idx] = data.session;
      } else {
        db.oneTimeSessions.push(data.session);
      }
      changed = true;
    }
    else if (path.match(/^\/api\/one-time-sessions\/([^/]+)$/) && method === "DELETE" && data.success) {
      const sessionId = path.split("/").pop();
      if (sessionId && db.oneTimeSessions) {
        db.oneTimeSessions = db.oneTimeSessions.filter((s) => s.id !== sessionId);
        changed = true;
      }
    }
    else if (path.match(/^\/api\/gyms\/([^/]+)\/manager-logs$/) && method === "GET" && Array.isArray(data)) {
      db.managerLogs = data;
      changed = true;
    }
    else if (path === "/api/sync" && method === "POST" && data.success && data.db) {
      localStorage.setItem(DB_KEY, JSON.stringify(data.db));
      return;
    }

    if (changed) {
      saveLocalDb(db);
    }
  } catch (err) {
    console.warn("Failed parsing online path in interceptor:", err);
  }
}

let syncPromise: Promise<void> | null = null;

async function performSync() {
  const localDb = localStorage.getItem(DB_KEY);
  if (!localDb) return;
  try {
    const parsed = JSON.parse(localDb);
    const response = await originalFetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.db) {
        localStorage.setItem(DB_KEY, JSON.stringify(data.db));
        console.log("[Interceptor Sync] Synchronized offline changes with server successfully.");
        window.dispatchEvent(new Event("gymsync_data_synced"));
        needsSync = false;
      }
    }
  } catch (err) {
    console.warn("[Interceptor Sync] Failed to synchronize offline data:", err);
  }
}

// Override window.fetch with fallback capabilities
const originalFetch = window.fetch;

const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);

  if (url.startsWith("/api")) {
    // If online and we have unsynced changes, perform synchronization first before any API calls
    if (navigator.onLine && url !== "/api/sync" && url !== "/api/login" && needsSync) {
      if (!syncPromise) {
        syncPromise = performSync().finally(() => {
          syncPromise = null;
        });
      }
      await syncPromise;
    }

    try {
      const response = await originalFetch(input, init);
      
      // If Vercel or other hosts serve HTML index for missing /api routes, clone and inspect
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const cloned = response.clone();
        cloned.json().then((data) => {
          updateLocalDbFromOnlineResponse(url, init?.method || "GET", data);
        }).catch((err) => console.warn("Failed to update local db from online response", err));
        return response;
      }

      if (contentType && contentType.includes("text/html")) {
        const cloned = response.clone();
        const text = await cloned.text();
        if (text.trim().startsWith("<")) {
          console.warn("Express backend returned HTML index file fallback (e.g. static hosting on Vercel). Falling back to client-side localStorage simulation...");
          return handleLocalStorageFallback(url, init);
        }
      }

      if (!response.ok) {
        console.warn(`Express backend returned status ${response.status}. Falling back to client-side localStorage simulation...`);
        return handleLocalStorageFallback(url, init);
      }

      return response;
    } catch (error) {
      console.warn("Express backend offline or inaccessible, falling back to client-side localStorage simulation...", error);
      return handleLocalStorageFallback(url, init);
    }
  }

  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, "fetch", {
    value: customFetch,
    writable: true,
    configurable: true,
  });
} catch (error) {
  console.warn("Direct redefinition of window.fetch blocked. Attempting prototype modification...", error);
  try {
    Object.defineProperty(Object.getPrototypeOf(window), "fetch", {
      value: customFetch,
      writable: true,
      configurable: true,
    });
  } catch (protoError) {
    console.error("Could not override window.fetch on prototype.", protoError);
    // Ultimate fallback attempt
    try {
      (window as any).fetch = customFetch;
    } catch (directError) {
      console.error("Direct assignment also failed.", directError);
    }
  }
}
