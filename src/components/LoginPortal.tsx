import React, { useState, useEffect } from "react";
import { ShieldCheck, Dumbbell, ArrowRight, Sparkles, Lock, Mail, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Gym } from "../types";

interface LoginPortalProps {
  onSelectRole: (role: "admin" | "manager", gymId?: string) => void;
}

export default function LoginPortal({ onSelectRole }: LoginPortalProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDemoAccs, setShowDemoAccs] = useState<boolean>(false);
  const [gyms, setGyms] = useState<Gym[]>([]);

  useEffect(() => {
    fetch("/api/gyms")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGyms(data);
        }
      })
      .catch((err) => console.error("Error loading gyms list", err));
  }, []);

  const matchedGym = gyms.find(
    (g) => g.managerEmail?.toLowerCase() === email.trim().toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Veuillez saisir votre identifiant et votre mot de passe.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Identifiants incorrects.");
      }

      // Authentication successful
      onSelectRole(data.role, data.gymId);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 text-slate-800 relative overflow-hidden font-sans">
      {/* Background graphic elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold tracking-tight text-xl text-slate-900">
              GymSync Multi-Tenant
            </h1>
            <p className="text-xs text-slate-500">Gestion d'Adhérents & Salles</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs text-slate-600 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Local & Cloud Sanity Sync</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto w-full py-12 flex flex-col items-center justify-center z-10 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            {matchedGym && matchedGym.logo ? (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={matchedGym.logo}
                alt={matchedGym.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover mx-auto border border-slate-200 shadow-md mb-2"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100 mb-2">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900">
              {matchedGym ? `Espace ${matchedGym.name}` : "Connexion GymSync"}
            </h2>
            <p className="text-slate-500 text-xs">
              {matchedGym 
                ? "Bienvenue ! Saisissez le mot de passe de votre espace gérant." 
                : "Saisissez vos identifiants pour accéder à votre espace de gestion."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2.5 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Identifiant ou Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@gymsync.com ou gérant email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Mot de passe
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              } ${matchedGym ? "hover:brightness-110 shadow-black/5" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"}`}
              style={matchedGym ? { backgroundColor: matchedGym.primaryColor } : undefined}
            >
              {isSubmitting ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo account helper collapsing section */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDemoAccs(!showDemoAccs)}
              className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-blue-600 font-bold transition-colors uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Identifiants de démonstration
              </span>
              {showDemoAccs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showDemoAccs && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
                >
                  <div>
                    <span className="font-bold text-slate-800 block text-[10px] uppercase">Administrateur Système :</span>
                    <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">admin@gymsync.com</code> / <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">admin123</code>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-800 block text-[10px] uppercase">Gérants de salle (Préréglés) :</span>
                    <div className="space-y-1 mt-1">
                      <div>
                        Club FitZone: <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">manager@fitzone.com</code> / <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">password123</code>
                      </div>
                      <div>
                        Club Zen: <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">manager@zen.com</code> / <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[11px]">password123</code>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Note : Les gérants créés par le Super Admin sur l'interface d'administration système s'y connecteront directement par la suite avec leurs identifiants personnalisés !
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center border-t border-slate-200 pt-6 z-10 text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 GymSync Multi-Tenant. Tous droits réservés.</p>
        <p className="flex items-center gap-1">
          <span>Plateforme sécurisée sans paiement en ligne</span>
          <span className="text-slate-300">•</span>
          <span>CMS Headless Sanity supporté</span>
        </p>
      </div>
    </div>
  );
}
