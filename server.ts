import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@sanity/client";
import { Gym, Member, Invoice, AlertLog, SanityConfig, ManagerLog, OneTimeSession } from "./src/types.js";

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// Helper to calculate relative dates
function getRelativeDate(days: number): string {
  const date = new Date("2026-06-25T12:00:00Z"); // Anchor to the metadata date
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// Seed Initial Data
const initialGyms: Gym[] = [
  {
    id: "gym-1",
    name: "FitZone Arena",
    slug: "fitzone-arena",
    logo: "", // fallback to nice default
    primaryColor: "#0f766e", // Teal 700
    secondaryColor: "#f97316", // Orange 500
    email: "contact@fitzone-arena.com",
    phone: "+33 1 23 45 67 89",
    address: "12 Rue de la Pompe, 75016 Paris",
    subscriptionPlans: [
      { id: "plan-month", name: "Pass Mensuel", durationMonths: 1, price: 39 },
      { id: "plan-quarter", name: "Formule Trimestre", durationMonths: 3, price: 99 },
      { id: "plan-year", name: "Abonnement Annuel", durationMonths: 12, price: 349 },
    ],
    createdAt: "2026-01-10T10:00:00Z",
    managerEmail: "manager@fitzone.com",
    managerPassword: "password123"
  },
  {
    id: "gym-2",
    name: "Zen Wellness Club",
    slug: "zen-wellness",
    logo: "",
    primaryColor: "#6b21a8", // Purple 800
    secondaryColor: "#06b6d4", // Cyan 500
    email: "info@zen-wellness.fr",
    phone: "+33 1 98 76 54 32",
    address: "85 Boulevard Saint-Germain, 75006 Paris",
    subscriptionPlans: [
      { id: "plan-zen-month", name: "Sérénité Mensuelle", durationMonths: 1, price: 49 },
      { id: "plan-zen-quarter", name: "Sérénité Trimestrielle", durationMonths: 3, price: 129 },
      { id: "plan-zen-year", name: "Harmonie Annuelle", durationMonths: 12, price: 449 },
    ],
    createdAt: "2026-02-15T14:30:00Z",
    managerEmail: "manager@zen.com",
    managerPassword: "password123"
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
    subscriptionStart: getRelativeDate(-25), // Started 25 days ago
    subscriptionEnd: getRelativeDate(5),    // Expires in EXACTLY 5 days! (2026-06-30)
    status: "Active",
    registrationNumber: "ADH-2026-0001",
    createdAt: getRelativeDate(-25),
  },
  {
    id: "mem-2",
    gymId: "gym-1",
    name: "Amélie Martin",
    email: "amelie.martin@yahoo.fr",
    phone: "+33 6 98 76 54 32",
    subscriptionType: "Abonnement Annuel",
    subscriptionStart: getRelativeDate(-100),
    subscriptionEnd: getRelativeDate(265), // Active, far in the future
    status: "Active",
    registrationNumber: "ADH-2026-0002",
    createdAt: getRelativeDate(-100),
  },
  {
    id: "mem-3",
    gymId: "gym-1",
    name: "Thomas Dubois",
    email: "thomas.dubois@outlook.fr",
    phone: "+33 6 55 44 33 22",
    subscriptionType: "Pass Mensuel",
    subscriptionStart: getRelativeDate(-35), // Expired 5 days ago
    subscriptionEnd: getRelativeDate(-5),
    status: "Expired",
    registrationNumber: "ADH-2026-0003",
    createdAt: getRelativeDate(-35),
  },
  {
    id: "mem-4",
    gymId: "gym-1",
    name: "Sophie Leroy",
    email: "sophie.leroy@gmail.com",
    phone: "+33 6 88 99 00 11",
    subscriptionType: "Formule Trimestre",
    subscriptionStart: getRelativeDate(-85),
    subscriptionEnd: getRelativeDate(5),    // Expires in EXACTLY 5 days! (2026-06-30)
    status: "Active",
    registrationNumber: "ADH-2026-0004",
    createdAt: getRelativeDate(-85),
  },
  // Members for Gym 2
  {
    id: "mem-5",
    gymId: "gym-2",
    name: "Lucas Bernard",
    email: "lucas.b@gmail.com",
    phone: "+33 7 11 22 33 44",
    subscriptionType: "Sérénité Mensuelle",
    subscriptionStart: getRelativeDate(-25),
    subscriptionEnd: getRelativeDate(5),    // Expires in EXACTLY 5 days! (2026-06-30)
    status: "Active",
    registrationNumber: "ADH-2026-0101",
    createdAt: getRelativeDate(-25),
  },
  {
    id: "mem-6",
    gymId: "gym-2",
    name: "Chloé Petit",
    email: "chloe.petit@gmail.com",
    phone: "+33 7 99 88 77 66",
    subscriptionType: "Harmonie Annuelle",
    subscriptionStart: getRelativeDate(-10),
    subscriptionEnd: getRelativeDate(355),
    status: "Active",
    registrationNumber: "ADH-2026-0102",
    createdAt: getRelativeDate(-10),
  }
];

const initialInvoices: Invoice[] = [
  {
    id: "inv-1",
    memberId: "mem-1",
    gymId: "gym-1",
    invoiceNumber: "FAC-2026-0001",
    date: getRelativeDate(-25),
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
    date: getRelativeDate(-100),
    amount: 349,
    paymentMethod: "Carte Bancaire (Hors-Ligne)",
    status: "Paid",
    planName: "Abonnement Annuel"
  },
  {
    id: "inv-5",
    memberId: "mem-5",
    gymId: "gym-2",
    invoiceNumber: "FAC-2026-0101",
    date: getRelativeDate(-25),
    amount: 49,
    paymentMethod: "Chèque",
    status: "Paid",
    planName: "Sérénité Mensuelle"
  }
];

const initialAlertLogs: AlertLog[] = [];

const defaultSanityConfig: SanityConfig = {
  projectId: "",
  dataset: "",
  token: "",
  useSanity: false,
};

// Initialize DB file
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify({
      gyms: initialGyms,
      members: initialMembers,
      invoices: initialInvoices,
      alertLogs: initialAlertLogs,
      sanityConfig: defaultSanityConfig,
    }, null, 2)
  );
}

// Database Read/Write Utility
interface Schema {
  gyms: Gym[];
  members: Member[];
  invoices: Invoice[];
  alertLogs: AlertLog[];
  sanityConfig: SanityConfig;
  managerLogs?: ManagerLog[];
  oneTimeSessions?: OneTimeSession[];
}

function readDb(): Schema {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data) as Schema;
    if (!parsed.managerLogs) {
      parsed.managerLogs = [];
    }
    if (!parsed.oneTimeSessions) {
      parsed.oneTimeSessions = [];
    }
    return parsed;
  } catch (error) {
    console.error("Error reading db.json", error);
    return {
      gyms: initialGyms,
      members: initialMembers,
      invoices: initialInvoices,
      alertLogs: initialAlertLogs,
      sanityConfig: defaultSanityConfig,
      managerLogs: [],
      oneTimeSessions: []
    };
  }
}

function writeDb(data: Schema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing db.json", error);
  }
}

function addManagerLog(db: Schema, gymId: string, action: string, details: string) {
  if (!db.managerLogs) {
    db.managerLogs = [];
  }
  const newLog: ManagerLog = {
    id: `mlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    gymId,
    action,
    details,
    createdAt: new Date().toISOString()
  };
  db.managerLogs.unshift(newLog);

  // If Sanity is active, sync this log in the background
  if (db.sanityConfig && db.sanityConfig.useSanity) {
    const client = getSanityClient(db.sanityConfig);
    if (client) {
      client.createOrReplace({
        _type: "managerLog",
        _id: `managerlog-${newLog.id}`,
        gymId: newLog.gymId,
        action: newLog.action,
        details: newLog.details,
        createdAt: newLog.createdAt,
      }).catch((err) => console.error("Sanity managerLog sync failed", err));
    }
  }
}

// Check subscription and block/notify gyms if necessary
function checkSubscriptionStatus(db: Schema): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  let databaseChanged = false;

  if (!db.gyms) db.gyms = [];

  db.gyms = db.gyms.map((gym: Gym) => {
    // Default subscriptionEnd to 30 days from creation if not set
    if (!gym.subscriptionEnd) {
      const createdDate = gym.createdAt ? new Date(gym.createdAt) : new Date();
      createdDate.setDate(createdDate.getDate() + 30);
      gym.subscriptionEnd = createdDate.toISOString().split('T')[0];
      databaseChanged = true;
    }

    if (!gym.status) {
      gym.status = 'active';
      databaseChanged = true;
    }

    if (!gym.notifications) {
      gym.notifications = [];
      databaseChanged = true;
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
          type: 'warning'
        });
        databaseChanged = true;
      }
    }

    // Auto block: past subscription end date
    if (diffDays <= 0 && gym.status === 'active') {
      gym.status = 'blocked';
      gym.notifications.push({
        id: `system-expire-blocked-${Date.now()}`,
        title: "Accès suspendu - Abonnement expiré",
        message: `Votre abonnement a expiré le ${gym.subscriptionEnd}. L'accès à votre espace de gestion a été suspendu automatiquement. Veuillez contacter le super administrateur pour renouveler votre abonnement.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'danger'
      });
      databaseChanged = true;
    }

    return gym;
  });

  return databaseChanged;
}

// Sanity Client Helper
function getSanityClient(config: SanityConfig) {
  if (!config.projectId || !config.dataset || !config.token) {
    return null;
  }
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    token: config.token,
    useCdn: false,
    apiVersion: "2023-05-03",
  });
}

// Bootstrap Server wrapping inside async function to avoid top-level await in CJS output
async function startServer() {
  const app = express();

  // Increase payload limit for Base64 image uploads
  app.use(express.json({ limit: "10mb" }));

  // ---------------- API ENDPOINTS ----------------

  // User Login Authentication
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "L'identifiant et le mot de passe sont requis" });
    }

    // Check for Super Admin
    if (
      (email === "admin@gymsync.com" || email === "admin") &&
      (password === "admin123" || password === "admin")
    ) {
      return res.json({
        success: true,
        role: "admin",
        message: "Connexion réussie en tant que Super Administrateur"
      });
    }

    // Check for Gym Manager
    const db = readDb();
    const changed = checkSubscriptionStatus(db);
    if (changed) {
      writeDb(db);
    }

    const gym = db.gyms.find(
      (g) => g.managerEmail?.toLowerCase() === email.toLowerCase() && g.managerPassword === password
    );

    if (gym) {
      if (gym.status === "blocked") {
        return res.status(403).json({
          success: false,
          message: `L'accès pour la salle de sport « ${gym.name} » est actuellement bloqué en raison d'un abonnement expiré. Veuillez contacter le Super Administrateur pour régler votre situation.`
        });
      }

      return res.json({
        success: true,
        role: "manager",
        gymId: gym.id,
        gymName: gym.name,
        message: `Connexion réussie en tant que Gérant de ${gym.name}`
      });
    }

    return res.status(401).json({
      success: false,
      message: "Identifiants de connexion incorrects. Veuillez vérifier l'e-mail ou le mot de passe."
    });
  });

  // Get Sanity Configuration
  app.get("/api/sanity-config", (req, res) => {
    const db = readDb();
    res.json(db.sanityConfig);
  });

  // Save and Test Sanity Configuration
  app.post("/api/sanity-config", async (req, res) => {
    const config = req.body as SanityConfig;
    const db = readDb();
    
    db.sanityConfig = config;
    writeDb(db);

    if (config.useSanity) {
      const client = getSanityClient(config);
      if (!client) {
        return res.status(400).json({
          success: false,
          message: "Configuration Sanity incomplète (Project ID, Dataset ou Token manquant).",
        });
      }

      try {
        // Test the Sanity client with a query
        await client.fetch(`*[_type == "gym"][0...1]`);
        res.json({
          success: true,
          message: "Connexion à Sanity réussie ! Base de données connectée en Cloud.",
        });
      } catch (err: any) {
        console.error("Sanity Test Connection Failed:", err);
        // fallback useSanity to false to keep app working
        db.sanityConfig.useSanity = false;
        writeDb(db);
        res.status(500).json({
          success: false,
          message: `Erreur de connexion Sanity : ${err.message}. L'application reste en mode de stockage local sécurisé.`,
        });
      }
    } else {
      res.json({
        success: true,
        message: "Stockage configuré en mode Local Fallback.",
      });
    }
  });

  // Push/Sync all local data to Sanity
  app.post("/api/sanity-config/sync", async (req, res) => {
    const db = readDb();
    const client = getSanityClient(db.sanityConfig);
    
    if (!client) {
      return res.status(400).json({
        success: false,
        message: "Veuillez configurer et activer Sanity avant de lancer la synchronisation.",
      });
    }

    try {
      console.log("Synchronizing to Sanity Cloud...");
      
      // 1. Sync Gyms
      for (const gym of db.gyms) {
        await client.createOrReplace({
          _type: "gym",
          _id: `gym-${gym.id}`,
          name: gym.name,
          slug: gym.slug,
          logo: gym.logo || "",
          slogan: gym.slogan || "",
          primaryColor: gym.primaryColor,
          secondaryColor: gym.secondaryColor,
          email: gym.email,
          phone: gym.phone,
          address: gym.address,
          createdAt: gym.createdAt,
          managerEmail: gym.managerEmail || "",
          managerPassword: gym.managerPassword || "",
          subscriptionPlans: gym.subscriptionPlans || [],
        });
      }

      // 2. Sync Members
      for (const mem of db.members) {
        await client.createOrReplace({
          _type: "member",
          _id: `mem-${mem.id}`,
          gymId: mem.gymId,
          name: mem.name,
          email: mem.email,
          phone: mem.phone,
          photo: mem.photo || "",
          subscriptionType: mem.subscriptionType,
          subscriptionStart: mem.subscriptionStart,
          subscriptionEnd: mem.subscriptionEnd,
          status: mem.status,
          registrationNumber: mem.registrationNumber,
          createdAt: mem.createdAt,
          age: mem.age || 0,
          height: mem.height || 0,
          medicalHistory: mem.medicalHistory || "",
          emergencyContactName: mem.emergencyContactName || "",
          emergencyContactPhone: mem.emergencyContactPhone || "",
          neighborhood: mem.neighborhood || "",
          physicalGoals: mem.physicalGoals || "",
          allergies: mem.allergies || "",
          occupation: mem.occupation || "",
          gender: mem.gender || "",
        });
      }

      // 3. Sync Invoices
      for (const inv of db.invoices) {
        await client.createOrReplace({
          _type: "invoice",
          _id: `inv-${inv.id}`,
          memberId: inv.memberId,
          gymId: inv.gymId,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          amount: inv.amount,
          paymentMethod: inv.paymentMethod,
          status: inv.status,
          planName: inv.planName,
        });
      }

      // 4. Sync One-Time Sessions
      const sessionsToSync = db.oneTimeSessions || [];
      for (const sess of sessionsToSync) {
        await client.createOrReplace({
          _type: "oneTimeSession",
          _id: `session-${sess.id}`,
          gymId: sess.gymId,
          visitorName: sess.visitorName,
          visitorPhone: sess.visitorPhone || "",
          amount: sess.amount,
          paymentMethod: sess.paymentMethod,
          date: sess.date,
          createdAt: sess.createdAt,
        });
      }

      // 5. Sync Alert Logs
      const alertsToSync = db.alertLogs || [];
      for (const alert of alertsToSync) {
        await client.createOrReplace({
          _type: "alertLog",
          _id: `alertlog-${alert.id}`,
          memberId: alert.memberId,
          memberName: alert.memberName,
          gymId: alert.gymId,
          gymName: alert.gymName,
          daysRemaining: alert.daysRemaining,
          alertDate: alert.alertDate,
          customMessage: alert.customMessage || "",
          sent: alert.sent,
          sentAt: alert.sentAt,
        });
      }

      // 6. Sync Manager Logs
      const managerLogsToSync = db.managerLogs || [];
      for (const mlog of managerLogsToSync) {
        await client.createOrReplace({
          _type: "managerLog",
          _id: `managerlog-${mlog.id}`,
          gymId: mlog.gymId,
          action: mlog.action,
          details: mlog.details,
          createdAt: mlog.createdAt,
        });
      }

      res.json({
        success: true,
        message: `Synchronisation terminée ! ${db.gyms.length} salles, ${db.members.length} adhérents, ${db.invoices.length} factures, ${sessionsToSync.length} séances uniques, ${alertsToSync.length} alertes et ${managerLogsToSync.length} logs d'activité envoyés sur le Cloud Sanity.`,
      });
    } catch (err: any) {
      console.error("Sanity Sync Failed:", err);
      res.status(500).json({
        success: false,
        message: `La synchronisation a échoué : ${err.message}`,
      });
    }
  });


  // GYMS Endpoints
  app.get("/api/gyms", async (req, res) => {
    const db = readDb();
    
    // If Sanity is active, warm the local db cache with gyms fetched from Sanity Cloud
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityGyms = await client.fetch<any[]>(`*[_type == "gym"]`);
          if (sanityGyms && sanityGyms.length > 0) {
            sanityGyms.forEach((g) => {
              const gymId = g._id.startsWith("gym-") ? g._id.replace("gym-", "") : g._id;
              const gymData: Gym = {
                id: gymId,
                name: g.name,
                slug: g.slug,
                logo: g.logo || "",
                slogan: g.slogan || "",
                primaryColor: g.primaryColor,
                secondaryColor: g.secondaryColor,
                email: g.email,
                phone: g.phone,
                address: g.address,
                createdAt: g.createdAt,
                managerEmail: g.managerEmail || "",
                managerPassword: g.managerPassword || "",
                subscriptionPlans: g.subscriptionPlans || [],
                subscriptionEnd: g.subscriptionEnd || "",
                status: g.status || "active",
                notifications: g.notifications || []
              };

              const existingIndex = db.gyms.findIndex((x) => x.id === gymId);
              if (existingIndex > -1) {
                db.gyms[existingIndex] = { ...db.gyms[existingIndex], ...gymData };
              } else {
                db.gyms.push(gymData);
              }
            });
            writeDb(db);
          }
        } catch (err) {
          console.error("Failed to fetch gyms from Sanity, using local DB cache:", err);
        }
      }
    }

    const changed = checkSubscriptionStatus(db);
    if (changed) {
      writeDb(db);
    }
    res.json(db.gyms);
  });

  // Update status or subscription end of a gym (Super Admin capability)
  app.post("/api/gyms/:gymId/status", async (req, res) => {
    const { gymId } = req.params;
    const { status, subscriptionEnd, reason } = req.body;
    const db = readDb();
    const gym = db.gyms.find((g) => g.id === gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Salle de sport introuvable." });
    }

    if (status) {
      gym.status = status;
    }
    if (subscriptionEnd) {
      gym.subscriptionEnd = subscriptionEnd;
    }

    if (!gym.notifications) {
      gym.notifications = [];
    }

    // Add unblocked / payment validation notification
    if (status === 'active') {
      gym.notifications.unshift({
        id: `admin-status-active-${Date.now()}`,
        title: "Paiement Validé / Compte Activé ! 🎉",
        message: reason || `Votre situation a été régularisée par le Super Administrateur. Votre abonnement est prolongé jusqu'au ${gym.subscriptionEnd || 'nouvelle échéance'}. Merci pour votre confiance !`,
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'info'
      });
    } else if (status === 'blocked') {
      gym.notifications.unshift({
        id: `admin-status-blocked-${Date.now()}`,
        title: "Compte Suspendu par l'Administrateur ⚠️",
        message: reason || "Votre compte a été suspendu par le Super Administrateur. Veuillez régulariser vos paiements ou contacter l'administration.",
        createdAt: new Date().toISOString(),
        isRead: false,
        type: 'danger'
      });
    }

    writeDb(db);

    // If Sanity is active, sync the updated status and notifications
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "gym",
            _id: `gym-${gym.id}`,
            name: gym.name,
            slug: gym.slug,
            logo: gym.logo || "",
            slogan: gym.slogan || "",
            primaryColor: gym.primaryColor,
            secondaryColor: gym.secondaryColor,
            email: gym.email,
            phone: gym.phone,
            address: gym.address,
            createdAt: gym.createdAt,
            managerEmail: gym.managerEmail || "",
            managerPassword: gym.managerPassword || "",
            subscriptionPlans: gym.subscriptionPlans || [],
            subscriptionEnd: gym.subscriptionEnd || "",
            status: gym.status || "active",
            notifications: gym.notifications || []
          });
        } catch (err) {
          console.error("Sanity status sync failed", err);
        }
      }
    }

    res.json({ success: true, gym });
  });

  // Post notification to a specific gym (Super Admin capability)
  app.post("/api/gyms/:gymId/notifications", (req, res) => {
    const { gymId } = req.params;
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Le titre et le message de la notification sont requis." });
    }
    const db = readDb();
    const gym = db.gyms.find((g) => g.id === gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Salle de sport introuvable." });
    }

    if (!gym.notifications) {
      gym.notifications = [];
    }

    gym.notifications.unshift({
      id: `admin-manual-${Date.now()}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: type || 'info'
    });

    writeDb(db);
    res.json({ success: true, gym });
  });

  // Get notifications for a gym
  app.get("/api/gyms/:gymId/notifications", (req, res) => {
    const { gymId } = req.params;
    const db = readDb();
    const gym = db.gyms.find((g) => g.id === gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Salle de sport introuvable." });
    }
    res.json(gym.notifications || []);
  });

  // Mark a notification as read
  app.post("/api/gyms/:gymId/notifications/:notifId/read", (req, res) => {
    const { gymId, notifId } = req.params;
    const db = readDb();
    const gym = db.gyms.find((g) => g.id === gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: "Salle de sport introuvable." });
    }
    if (gym.notifications) {
      const notif = gym.notifications.find((n) => n.id === notifId);
      if (notif) {
        notif.isRead = true;
        writeDb(db);
      }
    }
    res.json({ success: true });
  });

  app.post("/api/gyms", async (req, res) => {
    const db = readDb();
    const gymData = req.body as Gym;

    const existingIndex = db.gyms.findIndex((g) => g.id === gymData.id);
    if (existingIndex > -1) {
      db.gyms[existingIndex] = { ...db.gyms[existingIndex], ...gymData };
    } else {
      gymData.id = gymData.id || `gym-${Date.now()}`;
      gymData.createdAt = new Date().toISOString();
      db.gyms.push(gymData);
    }

    addManagerLog(db, gymData.id, "Configuration de la salle", "Mise à jour des paramètres du club (couleurs, forfaits, logo, coordonnées)");
    writeDb(db);

    // If Sanity is active, upload/sync this gym
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "gym",
            _id: `gym-${gymData.id}`,
            name: gymData.name,
            slug: gymData.slug,
            logo: gymData.logo || "",
            slogan: gymData.slogan || "",
            primaryColor: gymData.primaryColor,
            secondaryColor: gymData.secondaryColor,
            email: gymData.email,
            phone: gymData.phone,
            address: gymData.address,
            createdAt: gymData.createdAt,
            managerEmail: gymData.managerEmail || "",
            managerPassword: gymData.managerPassword || "",
            subscriptionPlans: gymData.subscriptionPlans || [],
          });
        } catch (err) {
          console.error("Sanity single gym sync failed", err);
        }
      }
    }

    res.json({ success: true, gym: gymData });
  });


  // MEMBERS Endpoints
  app.get("/api/members", async (req, res) => {
    const db = readDb();
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityMembers = await client.fetch<any[]>(`*[_type == "member"]`);
          if (sanityMembers && sanityMembers.length > 0) {
            const mappedMembers = sanityMembers.map((m) => ({
              id: m._id.startsWith("mem-") ? m._id.replace("mem-", "") : m._id,
              gymId: m.gymId,
              name: m.name,
              email: m.email,
              phone: m.phone,
              photo: m.photo || "",
              subscriptionType: m.subscriptionType,
              subscriptionStart: m.subscriptionStart,
              subscriptionEnd: m.subscriptionEnd,
              status: m.status,
              registrationNumber: m.registrationNumber,
              createdAt: m.createdAt,
              age: m.age || 0,
              height: m.height || 0,
              medicalHistory: m.medicalHistory || "",
              emergencyContactName: m.emergencyContactName || "",
              emergencyContactPhone: m.emergencyContactPhone || "",
              neighborhood: m.neighborhood || "",
              physicalGoals: m.physicalGoals || "",
              allergies: m.allergies || "",
              occupation: m.occupation || "",
              gender: m.gender || "",
            }));

            let dbChanged = false;
            for (const item of mappedMembers) {
              const idx = db.members.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.members[idx] = { ...db.members[idx], ...item };
              } else {
                db.members.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }
            return res.json(mappedMembers);
          }
        } catch (err) {
          console.error("Failed to fetch all members from Sanity:", err);
        }
      }
    }
    res.json(db.members);
  });

  app.get("/api/gyms/:gymId/members", async (req, res) => {
    const db = readDb();
    const gymId = req.params.gymId;
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityMembers = await client.fetch<any[]>(
            `*[_type == "member" && gymId == $gymId]`,
            { gymId }
          );
          if (sanityMembers && sanityMembers.length > 0) {
            const mappedMembers = sanityMembers.map((m) => ({
              id: m._id.replace(/^mem-/, ""),
              gymId: m.gymId,
              name: m.name,
              email: m.email || "",
              phone: m.phone || "",
              photo: m.photo || "",
              subscriptionType: m.subscriptionType || "",
              subscriptionStart: m.subscriptionStart || "",
              subscriptionEnd: m.subscriptionEnd || "",
              status: m.status || "Active",
              registrationNumber: m.registrationNumber || "",
              createdAt: m.createdAt || new Date().toISOString(),
              age: m.age || 0,
              height: m.height || 0,
              medicalHistory: m.medicalHistory || "",
              emergencyContactName: m.emergencyContactName || "",
              emergencyContactPhone: m.emergencyContactPhone || "",
              neighborhood: m.neighborhood || "",
              physicalGoals: m.physicalGoals || "",
              allergies: m.allergies || "",
              occupation: m.occupation || "",
              gender: m.gender || "",
            }));
            
            // Also update our local cache to keep it in sync!
            let dbChanged = false;
            for (const item of mappedMembers) {
              const idx = db.members.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.members[idx] = { ...db.members[idx], ...item };
              } else {
                db.members.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }

            return res.json(mappedMembers);
          }
        } catch (err) {
          console.error("Failed to fetch members from Sanity, falling back to local DB:", err);
        }
      }
    }
    const gymMembers = db.members.filter((m) => m.gymId === gymId);
    res.json(gymMembers);
  });

  app.post("/api/members", async (req, res) => {
    const db = readDb();
    const memData = req.body as Member;

    const existingIndex = db.members.findIndex((m) => m.id === memData.id);
    if (existingIndex > -1) {
      db.members[existingIndex] = { ...db.members[existingIndex], ...memData };
      addManagerLog(db, memData.gymId, "Modification d'adhérent", `Mise à jour des informations de l'adhérent ${memData.name} (${memData.registrationNumber || 'Nouveau'})`);
    } else {
      memData.id = memData.id || `mem-${Date.now()}`;
      memData.createdAt = new Date().toISOString();
      // Generate simple reg number
      const gymCode = memData.gymId.replace("gym-", "");
      const count = db.members.filter(m => m.gymId === memData.gymId).length + 1;
      memData.registrationNumber = memData.registrationNumber || `ADH-${gymCode}-${count.toString().padStart(4, "0")}`;
      db.members.push(memData);
      addManagerLog(db, memData.gymId, "Inscription d'adhérent", `Nouvel adhérent ${memData.name} inscrit avec succès (${memData.registrationNumber})`);
    }

    writeDb(db);

    // If Sanity is active, sync
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "member",
            _id: `mem-${memData.id}`,
            gymId: memData.gymId,
            name: memData.name,
            email: memData.email,
            phone: memData.phone,
            photo: memData.photo || "",
            subscriptionType: memData.subscriptionType,
            subscriptionStart: memData.subscriptionStart,
            subscriptionEnd: memData.subscriptionEnd,
            status: memData.status,
            registrationNumber: memData.registrationNumber,
            createdAt: memData.createdAt,
            age: memData.age || 0,
            height: memData.height || 0,
            medicalHistory: memData.medicalHistory || "",
            emergencyContactName: memData.emergencyContactName || "",
            emergencyContactPhone: memData.emergencyContactPhone || "",
            neighborhood: memData.neighborhood || "",
            physicalGoals: memData.physicalGoals || "",
            allergies: memData.allergies || "",
            occupation: memData.occupation || "",
            gender: memData.gender || "",
          });
        } catch (err) {
          console.error("Sanity member sync failed", err);
        }
      }
    }

    res.json({ success: true, member: memData });
  });

  app.delete("/api/members/:id", async (req, res) => {
    const db = readDb();
    const { id } = req.params;
    
    const member = db.members.find((m) => m.id === id);
    if (member) {
      addManagerLog(db, member.gymId, "Suppression d'adhérent", `L'adhérent ${member.name} (${member.registrationNumber}) a été supprimé définitivement du système`);
    }
    
    db.members = db.members.filter((m) => m.id !== id);
    db.invoices = db.invoices.filter((i) => i.memberId !== id);
    writeDb(db);

    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.delete(`mem-${id}`);
        } catch (err) {
          console.error("Sanity member delete failed", err);
        }
      }
    }

    res.json({ success: true });
  });


  // INVOICES Endpoints
  app.get("/api/invoices", async (req, res) => {
    const db = readDb();
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityInvoices = await client.fetch<any[]>(`*[_type == "invoice"]`);
          if (sanityInvoices && sanityInvoices.length > 0) {
            const mappedInvoices = sanityInvoices.map((inv) => ({
              id: inv._id.startsWith("inv-") ? inv._id.replace("inv-", "") : inv._id,
              memberId: inv.memberId,
              gymId: inv.gymId,
              invoiceNumber: inv.invoiceNumber,
              date: inv.date,
              amount: inv.amount,
              paymentMethod: inv.paymentMethod,
              status: inv.status,
              planName: inv.planName,
            }));

            let dbChanged = false;
            for (const item of mappedInvoices) {
              const idx = db.invoices.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.invoices[idx] = { ...db.invoices[idx], ...item };
              } else {
                db.invoices.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }
            return res.json(mappedInvoices);
          }
        } catch (err) {
          console.error("Failed to fetch all invoices from Sanity:", err);
        }
      }
    }
    res.json(db.invoices);
  });

  app.get("/api/gyms/:gymId/invoices", async (req, res) => {
    const db = readDb();
    const gymId = req.params.gymId;
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityInvoices = await client.fetch<any[]>(
            `*[_type == "invoice" && gymId == $gymId]`,
            { gymId }
          );
          if (sanityInvoices && sanityInvoices.length > 0) {
            const mappedInvoices = sanityInvoices.map((inv) => ({
              id: inv._id.replace(/^inv-/, ""),
              memberId: inv.memberId,
              gymId: inv.gymId,
              invoiceNumber: inv.invoiceNumber,
              date: inv.date,
              amount: inv.amount || 0,
              paymentMethod: inv.paymentMethod || "Espèces",
              status: inv.status || "Paid",
              planName: inv.planName || "",
            }));

            // update local cache
            let dbChanged = false;
            for (const item of mappedInvoices) {
              const idx = db.invoices.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.invoices[idx] = { ...db.invoices[idx], ...item };
              } else {
                db.invoices.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }

            return res.json(mappedInvoices);
          }
        } catch (err) {
          console.error("Failed to fetch invoices from Sanity, falling back to local:", err);
        }
      }
    }
    const gymInvoices = db.invoices.filter((i) => i.gymId === gymId);
    res.json(gymInvoices);
  });

  app.post("/api/invoices", async (req, res) => {
    const db = readDb();
    const invoiceData = req.body as Invoice;

    invoiceData.id = invoiceData.id || `inv-${Date.now()}`;
    invoiceData.invoiceNumber = invoiceData.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`;
    db.invoices.push(invoiceData);

    const associatedMember = db.members.find((m) => m.id === invoiceData.memberId);
    const memberName = associatedMember ? associatedMember.name : "Inconnu";
    addManagerLog(db, invoiceData.gymId, "Génération de facture", `Facture ${invoiceData.invoiceNumber} d'un montant de ${invoiceData.amount.toLocaleString('fr-FR')} FCFA générée pour ${memberName} (${invoiceData.planName})`);

    writeDb(db);

    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "invoice",
            _id: `inv-${invoiceData.id}`,
            memberId: invoiceData.memberId,
            gymId: invoiceData.gymId,
            invoiceNumber: invoiceData.invoiceNumber,
            date: invoiceData.date,
            amount: invoiceData.amount,
            paymentMethod: invoiceData.paymentMethod,
            status: invoiceData.status,
            planName: invoiceData.planName,
          });
        } catch (err) {
          console.error("Sanity invoice sync failed", err);
        }
      }
    }

    res.json({ success: true, invoice: invoiceData });
  });


  // ONE-TIME SESSIONS Endpoints
  app.get("/api/one-time-sessions", async (req, res) => {
    const db = readDb();
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanitySessions = await client.fetch<any[]>(`*[_type == "oneTimeSession"]`);
          if (sanitySessions && sanitySessions.length > 0) {
            const mappedSessions = sanitySessions.map((s) => ({
              id: s._id.startsWith("session-") ? s._id.replace("session-", "") : s._id,
              gymId: s.gymId,
              visitorName: s.visitorName || "Visiteur",
              visitorPhone: s.visitorPhone || "",
              amount: s.amount || 0,
              paymentMethod: s.paymentMethod || "Espèces",
              date: s.date,
              createdAt: s.createdAt,
            }));

            db.oneTimeSessions = db.oneTimeSessions || [];
            let dbChanged = false;
            for (const item of mappedSessions) {
              const idx = db.oneTimeSessions.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.oneTimeSessions[idx] = { ...db.oneTimeSessions[idx], ...item };
              } else {
                db.oneTimeSessions.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }
            return res.json(mappedSessions);
          }
        } catch (err) {
          console.error("Failed to fetch all sessions from Sanity:", err);
        }
      }
    }
    res.json(db.oneTimeSessions || []);
  });

  app.get("/api/gyms/:gymId/one-time-sessions", async (req, res) => {
    const db = readDb();
    const gymId = req.params.gymId;
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanitySessions = await client.fetch<any[]>(
            `*[_type == "oneTimeSession" && gymId == $gymId]`,
            { gymId }
          );
          if (sanitySessions && sanitySessions.length > 0) {
            const mappedSessions = sanitySessions.map((s) => ({
              id: s._id.replace(/^session-/, ""),
              gymId: s.gymId,
              visitorName: s.visitorName || "Visiteur",
              visitorPhone: s.visitorPhone || "",
              amount: s.amount || 0,
              paymentMethod: s.paymentMethod || "Espèces",
              date: s.date,
              createdAt: s.createdAt,
            }));

            // update local cache
            db.oneTimeSessions = db.oneTimeSessions || [];
            let dbChanged = false;
            for (const item of mappedSessions) {
              const idx = db.oneTimeSessions.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.oneTimeSessions[idx] = { ...db.oneTimeSessions[idx], ...item };
              } else {
                db.oneTimeSessions.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }

            return res.json(mappedSessions);
          }
        } catch (err) {
          console.error("Failed to fetch sessions from Sanity, falling back to local:", err);
        }
      }
    }
    const localSessions = (db.oneTimeSessions || []).filter((s) => s.gymId === gymId);
    res.json(localSessions);
  });

  app.post("/api/one-time-sessions", async (req, res) => {
    const db = readDb();
    const sessionData = req.body as OneTimeSession;

    sessionData.id = sessionData.id || `session-${Date.now()}`;
    sessionData.createdAt = sessionData.createdAt || new Date().toISOString();
    sessionData.date = sessionData.date || new Date().toISOString().split("T")[0];
    
    db.oneTimeSessions = db.oneTimeSessions || [];
    db.oneTimeSessions.push(sessionData);

    addManagerLog(
      db,
      sessionData.gymId,
      "Séance unique enregistrée",
      `Entrée enregistrée pour ${sessionData.visitorName} d'un montant de ${sessionData.amount.toLocaleString('fr-FR')} FCFA (${sessionData.paymentMethod})`
    );

    writeDb(db);

    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "oneTimeSession",
            _id: `session-${sessionData.id}`,
            gymId: sessionData.gymId,
            visitorName: sessionData.visitorName,
            visitorPhone: sessionData.visitorPhone || "",
            amount: sessionData.amount,
            paymentMethod: sessionData.paymentMethod,
            date: sessionData.date,
            createdAt: sessionData.createdAt,
          });
        } catch (err) {
          console.error("Sanity session sync failed", err);
        }
      }
    }

    res.json({ success: true, session: sessionData });
  });

  app.delete("/api/one-time-sessions/:id", async (req, res) => {
    const db = readDb();
    const id = req.params.id;
    
    db.oneTimeSessions = db.oneTimeSessions || [];
    const sessionIndex = db.oneTimeSessions.findIndex((s) => s.id === id);
    
    if (sessionIndex > -1) {
      const sessionData = db.oneTimeSessions[sessionIndex];
      db.oneTimeSessions.splice(sessionIndex, 1);
      
      addManagerLog(
        db,
        sessionData.gymId,
        "Séance unique annulée",
        `Séance unique de ${sessionData.visitorName} d'un montant de ${sessionData.amount.toLocaleString('fr-FR')} FCFA a été supprimée`
      );
      
      writeDb(db);
      
      if (db.sanityConfig.useSanity) {
        const client = getSanityClient(db.sanityConfig);
        if (client) {
          try {
            await client.delete(`session-${id}`);
          } catch (err) {
            console.error("Sanity session delete failed", err);
          }
        }
      }
      return res.json({ success: true });
    }
    
    res.status(404).json({ success: false, message: "Séance introuvable." });
  });


  // ALERTS / NOTIFICATIONS Endpoints

  // Get Expiring Members (specifically exactly 5 days before expiration, or <= 5 days and active)
  app.get("/api/alerts/expiring", (req, res) => {
    const db = readDb();
    const anchorDate = new Date("2026-06-25T12:00:00Z"); // Anchor relative to current local time

    // Find active members whose subscription ends within the next 5 days
    const expiring = db.members.filter((m) => {
      if (m.status !== "Active") return false;
      const endDate = new Date(m.subscriptionEnd + "T12:00:00Z");
      const diffTime = endDate.getTime() - anchorDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // We flag members expiring exactly in 5 days, or within 5 days.
      return diffDays >= 0 && diffDays <= 5;
    });

    res.json(expiring);
  });

  // Generate automated message via Google GenAI (Gemini-3.5-flash)
  app.post("/api/alerts/generate", async (req, res) => {
    const { memberId, gymId } = req.body;
    if (!memberId || !gymId) {
      return res.status(400).json({ error: "Missing memberId or gymId" });
    }

    const db = readDb();
    const member = db.members.find((m) => m.id === memberId);
    const gym = db.gyms.find((g) => g.id === gymId);

    if (!member || !gym) {
      return res.status(404).json({ error: "Adhérent ou Salle introuvable" });
    }

    // Calculate remaining days
    const anchorDate = new Date("2026-06-25T12:00:00Z");
    const endDate = new Date(member.subscriptionEnd + "T12:00:00Z");
    const diffDays = Math.ceil((endDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));

    try {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY non configurée.");
      }

      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Tu es le gérant de la salle de sport "${gym.name}".
Génère une alerte amicale et professionnelle rédigée en français pour l'adhérent(e) "${member.name}" dont l'abonnement s'achève dans exactement ${diffDays} jours (le ${member.subscriptionEnd}).
Le message doit être court, chaleureux, souligner son importance dans notre communauté, et lui rappeler poliment qu'aucun paiement ne se fait en ligne (tout se règle directement au comptoir de la salle auprès du gestionnaire).
Inclus des détails spécifiques comme son abonnement ("${member.subscriptionType}").
Écris le message directement sous format textuel (comme un SMS ou un court e-mail), prêt à être copié ou envoyé, sans aucun formatage Markdown complexe. Termine par une salutation de l'équipe de ${gym.name}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "Message d'alerte automatique de relance.";
      res.json({ message: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Provide a neat fallback message in French if Gemini fails or is missing key
      const fallbackMessage = `Bonjour ${member.name},\n\nNous tenons à vous rappeler amicalement que votre abonnement "${member.subscriptionType}" chez ${gym.name} arrivera à expiration dans ${diffDays} jours, le ${member.subscriptionEnd}.\n\nPour continuer à profiter de nos installations de fitness sans interruption, nous vous invitons à vous rapprocher de notre gérant de salle lors de votre prochaine visite. Pour rappel, aucun paiement ne s'effectue en ligne, tout se règle directement sur place.\n\nSportivement,\nL'équipe ${gym.name}`;
      res.json({
        message: fallbackMessage,
        warning: "Fallback local utilisé (GEMINI_API_KEY manquante ou invalide)."
      });
    }
  });

  // Dispatch / log alert sent
  app.post("/api/alerts/dispatch", async (req, res) => {
    const { memberId, gymId, customMessage } = req.body;
    const db = readDb();

    const member = db.members.find((m) => m.id === memberId);
    const gym = db.gyms.find((g) => g.id === gymId);

    if (!member || !gym) {
      return res.status(404).json({ error: "Adhérent ou Salle introuvable" });
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
      alertDate: getRelativeDate(0),
      customMessage: customMessage || "Alerte de fin de contrat envoyée.",
      sent: true,
      sentAt: new Date().toISOString(),
    };

    db.alertLogs.unshift(newLog);
    writeDb(db);

    // If Sanity is active, sync alert log
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          await client.createOrReplace({
            _type: "alertLog",
            _id: `alertlog-${newLog.id}`,
            memberId: newLog.memberId,
            memberName: newLog.memberName,
            gymId: newLog.gymId,
            gymName: newLog.gymName,
            daysRemaining: newLog.daysRemaining,
            alertDate: newLog.alertDate,
            customMessage: newLog.customMessage || "",
            sent: newLog.sent,
            sentAt: newLog.sentAt,
          });
        } catch (err) {
          console.error("Sanity alertLog sync failed", err);
        }
      }
    }

    res.json({ success: true, log: newLog });
  });

  app.get("/api/alerts/logs", async (req, res) => {
    const db = readDb();
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityAlertLogs = await client.fetch<any[]>(`*[_type == "alertLog"]`);
          if (sanityAlertLogs && sanityAlertLogs.length > 0) {
            const mappedLogs = sanityAlertLogs.map((l) => ({
              id: l._id.replace(/^alertlog-/, ""),
              memberId: l.memberId,
              memberName: l.memberName,
              gymId: l.gymId,
              gymName: l.gymName,
              daysRemaining: l.daysRemaining || 0,
              alertDate: l.alertDate,
              customMessage: l.customMessage || "",
              sent: l.sent || false,
              sentAt: l.sentAt,
            }));

            db.alertLogs = mappedLogs;
            writeDb(db);
            return res.json(mappedLogs);
          }
        } catch (err) {
          console.error("Failed to fetch alert logs from Sanity:", err);
        }
      }
    }
    res.json(db.alertLogs);
  });

  // Get manager logs for a gym
  app.get("/api/gyms/:gymId/manager-logs", async (req, res) => {
    const { gymId } = req.params;
    const db = readDb();

    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const sanityLogs = await client.fetch<any[]>(
            `*[_type == "managerLog" && gymId == $gymId] | order(createdAt desc)`,
            { gymId }
          );
          if (sanityLogs && sanityLogs.length > 0) {
            const mappedLogs = sanityLogs.map((l) => ({
              id: l._id.replace(/^managerlog-/, ""),
              gymId: l.gymId,
              action: l.action,
              details: l.details,
              createdAt: l.createdAt,
            }));

            db.managerLogs = db.managerLogs || [];
            let dbChanged = false;
            for (const item of mappedLogs) {
              const idx = db.managerLogs.findIndex(x => x.id === item.id);
              if (idx > -1) {
                db.managerLogs[idx] = { ...db.managerLogs[idx], ...item };
              } else {
                db.managerLogs.push(item);
              }
              dbChanged = true;
            }
            if (dbChanged) {
              writeDb(db);
            }
            mappedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(mappedLogs);
          }
        } catch (err) {
          console.error("Failed to fetch manager logs from Sanity, falling back to local:", err);
        }
      }
    }

    const logs = (db.managerLogs || []).filter((l) => l.gymId === gymId);
    res.json(logs);
  });

  // Clear manager logs for a gym
  app.post("/api/gyms/:gymId/manager-logs/clear", async (req, res) => {
    const { gymId } = req.params;
    const db = readDb();
    if (db.managerLogs) {
      db.managerLogs = db.managerLogs.filter((l) => l.gymId !== gymId);
    }
    writeDb(db);

    // If Sanity is active, delete them from Sanity too
    if (db.sanityConfig.useSanity) {
      const client = getSanityClient(db.sanityConfig);
      if (client) {
        try {
          const logsToDelete = await client.fetch<any[]>(
            `*[_type == "managerLog" && gymId == $gymId]`,
            { gymId }
          );
          for (const log of logsToDelete) {
            await client.delete(log._id);
          }
        } catch (err) {
          console.error("Sanity managerLogs clear failed", err);
        }
      }
    }

    res.json({ success: true });
  });


  // ---------------- STATIC SERVING / VITE MIDDLEWARE ----------------

  // In production, serve the compiled react static bundle
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // In development, we use Vite in middleware mode.
    // We'll dynamically import createServer from 'vite' inside the startup script if running from tsx.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GymSync Server] Running full-stack dashboard on http://0.0.0.0:${PORT}`);
  });
}

startServer();
