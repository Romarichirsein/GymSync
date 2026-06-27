export interface Gym {
  id: string;
  name: string;
  slug: string;
  logo?: string; // Base64 or URL
  slogan?: string; // Slogan of the gym
  primaryColor: string; // Hex code, e.g. "#1e40af"
  secondaryColor: string; // Hex code, e.g. "#f97316"
  email: string;
  phone: string;
  address: string;
  subscriptionPlans: SubscriptionPlan[];
  createdAt: string;
  managerEmail?: string;
  managerPassword?: string;
  
  // Subscription and notification control
  subscriptionEnd?: string; // YYYY-MM-DD
  status?: 'active' | 'blocked';
  notifications?: GymNotification[];
}

export interface GymNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'danger';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
}

export interface Member {
  id: string;
  gymId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string; // Base64 or URL
  subscriptionType: string; // plan id or name (e.g., 'Monthly')
  subscriptionStart: string; // YYYY-MM-DD
  subscriptionEnd: string; // YYYY-MM-DD
  status: 'Active' | 'Suspended' | 'Expired';
  registrationNumber: string; // e.g. ADH-2026-0001
  createdAt: string;
  
  // New fields
  age?: number;
  height?: number; // in cm
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  neighborhood?: string; // quartier
  physicalGoals?: string;
  allergies?: string;
  occupation?: string; // fonction / profession
  gender?: string; // sexe
}

export interface Invoice {
  id: string;
  memberId: string;
  gymId: string;
  invoiceNumber: string; // e.g. FAC-2026-0001
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: string; // 'Espèces' | 'Chèque' | 'Virement' etc (no in-app payment)
  status: 'Paid' | 'Pending';
  planName: string;
}

export interface AlertLog {
  id: string;
  memberId: string;
  memberName: string;
  gymId: string;
  gymName: string;
  daysRemaining: number;
  alertDate: string;
  customMessage?: string; // Gemini generated French text
  sent: boolean;
  sentAt?: string;
}

export interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
  useSanity: boolean;
}

export interface ManagerLog {
  id: string;
  gymId: string;
  action: string;
  details: string;
  createdAt: string;
}

