import { useState, useEffect } from "react";
import {
  Home, Briefcase, Receipt, User, ChevronRight, Plus,
  TrendingUp, Wallet, ArrowDownCircle, Clock, MapPin,
  Calendar, Building2, Lock, BarChart3, FileText,
  LogOut, Bell, Eye, EyeOff, CheckCircle2, AlertCircle,
  Car, Utensils, Bed, MoreHorizontal, ArrowLeft, X,
  CreditCard, Hash, Target, Zap, Shield, Star
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────
const MOCK_USER = { name: "Kofi Mensah", email: "kofi@example.com", password: "demo123" };

const INITIAL_MISSIONS = [
  {
    id: 1, nom: "Enquête Satisfaction Orange CI", commanditaire: "Cabinet Insight",
    entreprise: "Orange Côte d'Ivoire", localite: "Abidjan, Cocody",
    dateDebut: "2025-03-01", dateFin: "2025-04-15",
    montantTotal: 75000, montantRecu: 40000, progression: 72, statut: "en_cours"
  },
  {
    id: 2, nom: "Étude Marché MTN Ghana", commanditaire: "DataScope Africa",
    entreprise: "MTN Ghana", localite: "Accra, Tema",
    dateDebut: "2025-01-10", dateFin: "2025-02-28",
    montantTotal: 120000, montantRecu: 120000, progression: 100, statut: "termine"
  },
  {
    id: 3, nom: "Sondage Produit Nestlé", commanditaire: "Qualitex Research",
    entreprise: "Nestlé West Africa", localite: "Dakar, Plateau",
    dateDebut: "2025-04-20", dateFin: "2025-05-30",
    montantTotal: 55000, montantRecu: 0, progression: 0, statut: "a_venir"
  }
];

const INITIAL_DEPENSES = [
  { id: 1, missionId: 1, categorie: "transport", montant: 12000, date: "2025-03-15", commentaire: "Taxi Cocody - Plateau", localite: "Abidjan" },
  { id: 2, missionId: 1, categorie: "repas", montant: 8500, date: "2025-03-18", commentaire: "Déjeuner terrain", localite: "Abidjan" },
  { id: 3, missionId: 1, categorie: "hebergement", montant: 25000, date: "2025-03-20", commentaire: "Hôtel 2 nuits", localite: "Abidjan" },
  { id: 4, missionId: 2, categorie: "transport", montant: 18000, date: "2025-01-22", commentaire: "Vol Abidjan-Accra", localite: "Accra" }
];

const INITIAL_PAIEMENTS = [
  { id: 1, missionId: 1, montant: 25000, date: "2025-03-05", reference: "PAY-2025-001", mission: "Enquête Orange CI" },
  { id: 2, missionId: 1, montant: 15000, date: "2025-03-25", reference: "PAY-2025-002", mission: "Enquête Orange CI" },
  { id: 3, missionId: 2, montant: 60000, date: "2025-01-15", reference: "PAY-2025-003", mission: "Étude MTN Ghana" },
  { id: 4, missionId: 2, montant: 60000, date: "2025-02-28", reference: "PAY-2025-004", mission: "Étude MTN Ghana" }
];

// ─── HELPERS ──────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const today = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const catIcon = { transport: Car, repas: Utensils, hebergement: Bed, autres: MoreHorizontal };
const catColor = { transport: "#F59E0B", repas: "#EF4444", hebergement: "#1E40AF", autres: "#6B7280" };
const catLabel = { transport: "Transport", repas: "Repas", hebergement: "Hébergement", autres: "Autres" };

const statutBadge = {
  en_cours: { label: "En cours", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  termine: { label: "Terminée", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  a_venir: { label: "À venir", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" }
};

// ─── SUPABASE SCHEMA (embedded as reference) ─────────────────────
const SUPABASE_SCHEMA = `
-- SUPABASE POSTGRESQL SCHEMA
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  commanditaire TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  localite TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  montant_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_recu NUMERIC(12,2) NOT NULL DEFAULT 0,
  progression INTEGER DEFAULT 0 CHECK (progression BETWEEN 0 AND 100),
  statut TEXT DEFAULT 'a_venir' CHECK (statut IN ('a_venir', 'en_cours', 'termine')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- COMPUTED: restant = montant_total - montant_recu
  CONSTRAINT restant_positif CHECK (montant_total >= montant_recu)
);

CREATE TABLE depenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL CHECK (categorie IN ('transport','repas','hebergement','autres')),
  montant NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  commentaire TEXT,
  localite TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  montant NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEWS for computed metrics
CREATE VIEW vue_bilan_missions AS
SELECT
  m.id, m.user_id, m.nom, m.montant_total, m.montant_recu,
  m.montant_total - m.montant_recu AS restant_a_recevoir,
  COALESCE(SUM(d.montant),0) AS total_depenses,
  m.montant_recu - COALESCE(SUM(d.montant),0) AS benefice_net
FROM missions m
LEFT JOIN depenses d ON d.mission_id = m.id
GROUP BY m.id;
`;

// ─── COMPONENTS ───────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 shadow-sm" style={{ background: bg }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ProCard({ icon: Icon, label }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3 shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 70% 50%, #3B82F6, transparent)" }} />
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon size={18} className="text-blue-300" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xs text-blue-300 mt-0.5 font-semibold">Passer à Pro</p>
      </div>
      <Lock size={14} className="text-slate-400" />
    </div>
  );
}

function ProgressBar({ value, color = "#1E40AF" }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function Badge({ statut }) {
  const s = statutBadge[statut] || statutBadge.a_venir;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handle = () => {
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      onLogin();
    } else {
      setError("Email ou mot de passe incorrect. Essayez : kofi@example.com / demo123");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #1E40AF 45%, #2563EB 100%)" }}>
      {/* Top decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60A5FA, transparent)", transform: "translate(30%, -30%)" }} />
      <div className="absolute top-24 left-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93C5FD, transparent)", transform: "translate(-40%, 0)" }} />

      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-8 px-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5 shadow-xl">
          <Shield size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">EnquêteurPro</h1>
        <p className="text-blue-200 text-sm mt-1 text-center">Gérez vos missions terrain en toute simplicité</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-3xl px-6 py-8 shadow-2xl relative z-10" style={{ minHeight: "55vh" }}>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
        <p className="text-sm text-gray-500 mb-6">Bienvenue de retour 👋</p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="kofi@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handle} className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all active:scale-95" style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)" }}>
          Se connecter
        </button>

        <div className="mt-5 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold mb-1">Compte démo</p>
          <p className="text-xs text-blue-600">Email : kofi@example.com</p>
          <p className="text-xs text-blue-600">Mot de passe : demo123</p>
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ missions, depenses, paiements }) {
  const actives = missions.filter(m => m.statut === "en_cours");
  const totalRecu = missions.reduce((s, m) => s + m.montantRecu, 0);
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const totalDu = missions.reduce((s, m) => s + (m.montantTotal - m.montantRecu), 0);
  const current = actives[0];

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-5" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 100%)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs font-medium">Bonjour 👋</p>
            <h1 className="text-xl font-bold text-white mt-0.5">{MOCK_USER.name}</h1>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full text-white text-xs flex items-center justify-center font-bold">2</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 w-fit">
          <Calendar size={12} className="text-blue-200" />
          <span className="text-blue-100 text-xs font-medium capitalize">{today()}</span>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatCard icon={Briefcase} label="Missions actives" value={`${actives.length} mission${actives.length > 1 ? "s" : ""}`} color="#1E40AF" bg="#EFF6FF" />
          <StatCard icon={TrendingUp} label="Total reçu" value={fmt(totalRecu)} color="#16A34A" bg="#F0FDF4" />
          <StatCard icon={Receipt} label="Dépenses" value={fmt(totalDepenses)} color="#F59E0B" bg="#FFFBEB" />
          <StatCard icon={Wallet} label="Restant à recevoir" value={fmt(totalDu)} color="#EF4444" bg="#FEF2F2" />
        </div>

        {/* Mission en cours */}
        {current && (
          <div className="mt-5 rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)" }}>
            <div className="px-4 pt-4 pb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Mission en cours</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Actif</span>
              </div>
            </div>
            <div className="px-4 pt-2 pb-4">
              <h3 className="text-white font-bold text-base leading-snug">{current.nom}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={12} className="text-blue-300" />
                <span className="text-blue-200 text-xs">{current.commanditaire} • {current.entreprise}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-blue-300" />
                <span className="text-blue-200 text-xs">{current.localite}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar size={12} className="text-blue-300" />
                <span className="text-blue-200 text-xs">{fmtDate(current.dateDebut)} → {fmtDate(current.dateFin)}</span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-blue-300 font-medium">Progression</span>
                  <span className="text-sm font-bold text-white">{current.progression}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-300 transition-all duration-700" style={{ width: `${current.progression}%` }} />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">Montant total</p>
                  <p className="text-white font-bold text-sm">{fmt(current.montantTotal)}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">Reçu</p>
                  <p className="text-green-300 font-bold text-sm">{fmt(current.montantRecu)}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <p className="text-blue-300 text-xs">Restant</p>
                  <p className="text-orange-300 font-bold text-sm">{fmt(current.montantTotal - current.montantRecu)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dépenses récentes */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Dépenses récentes</h2>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="space-y-2.5">
            {depenses.slice(0, 3).map(d => {
              const Icon = catIcon[d.categorie] || MoreHorizontal;
              const color = catColor[d.categorie];
              return (
                <div key={d.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{catLabel[d.categorie]}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{d.localite}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{fmtDate(d.date)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-500">-{fmt(d.montant)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Paiements récents - Timeline */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Paiements reçus</h2>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="relative pl-6">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-3">
              {paiements.slice(0, 3).map(p => (
                <div key={p.id} className="relative">
                  <div className="absolute -left-4 top-3 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white shadow-sm" />
                  <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-600">+{fmt(p.montant)}</span>
                      <span className="text-xs text-gray-400">{fmtDate(p.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Hash size={10} className="text-gray-400" />
                      <span className="text-xs text-gray-500 font-mono">{p.reference}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.mission}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pro Cards */}
        <div className="mt-5 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-700">Fonctionnalités Pro</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <ProCard icon={BarChart3} label="Statistiques avancées" />
            <ProCard icon={FileText} label="Export PDF des rapports" />
            <ProCard icon={Star} label="Rapports annuels" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionsScreen({ missions, onAdd }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 100%)" }}>
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Mes missions</p>
          <h1 className="text-xl font-bold text-white mt-0.5">{missions.length} mission{missions.length > 1 ? "s" : ""}</h1>
        </div>
        <button onClick={onAdd} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {missions.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 leading-snug">{m.nom}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Building2 size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{m.commanditaire}</span>
                </div>
              </div>
              <Badge statut={m.statut} />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-xs text-gray-400">Montant total</p>
                <p className="text-sm font-bold text-gray-900">{fmt(m.montantTotal)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-2.5">
                <p className="text-xs text-green-600">Reçu</p>
                <p className="text-sm font-bold text-green-700">{fmt(m.montantRecu)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Progression</span>
              <span className="text-xs font-bold text-gray-700">{m.progression}%</span>
            </div>
            <ProgressBar value={m.progression} color={m.statut === "termine" ? "#16A34A" : "#1E40AF"} />

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">{m.localite}</span>
              </div>
              <span className="text-gray-200">|</span>
              <div className="flex items-center gap-1">
                <Calendar size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">{fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}</span>
              </div>
            </div>

            {m.statut !== "termine" && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1">
                <AlertCircle size={11} className="text-orange-400" />
                <span className="text-xs text-orange-500 font-medium">Restant à recevoir : {fmt(m.montantTotal - m.montantRecu)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddMissionScreen({ onSave, onBack }) {
  const [form, setForm] = useState({
    nom: "", commanditaire: "", entreprise: "", localite: "",
    dateDebut: "", dateFin: "", montantTotal: "", montantRecu: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.nom || !form.commanditaire || !form.montantTotal) return;
    onSave({
      ...form,
      id: Date.now(),
      montantTotal: parseFloat(form.montantTotal) || 0,
      montantRecu: parseFloat(form.montantRecu) || 0,
      progression: 0,
      statut: form.dateDebut && new Date(form.dateDebut) <= new Date() ? "en_cours" : "a_venir"
    });
  };

  const Field = ({ label, k, type = "text", placeholder }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-5 flex items-center gap-3" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 100%)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <p className="text-blue-200 text-xs font-medium">Nouvelle mission</p>
          <h1 className="text-lg font-bold text-white">Ajouter une mission</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <Field label="Nom de la mission *" k="nom" placeholder="Ex: Enquête satisfaction Orange" />
        <Field label="Commanditaire *" k="commanditaire" placeholder="Ex: Cabinet Insight" />
        <Field label="Entreprise cliente" k="entreprise" placeholder="Ex: Orange CI" />
        <Field label="Localité" k="localite" placeholder="Ex: Abidjan, Cocody" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date début" k="dateDebut" type="date" />
          <Field label="Date fin" k="dateFin" type="date" />
        </div>
        <Field label="Montant total (FCFA) *" k="montantTotal" type="number" placeholder="75000" />
        <Field label="Montant déjà reçu (FCFA)" k="montantRecu" type="number" placeholder="0" />

        {form.montantTotal && form.montantRecu && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium">Restant à recevoir</p>
            <p className="text-lg font-bold text-blue-800 mt-0.5">
              {fmt(Math.max(0, parseFloat(form.montantTotal || 0) - parseFloat(form.montantRecu || 0)))}
            </p>
          </div>
        )}

        <button onClick={handleSave} className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all active:scale-95 mb-6" style={{ background: "linear-gradient(135deg, #1E40AF, #3B82F6)" }}>
          Enregistrer la mission
        </button>
      </div>
    </div>
  );
}

function DepensesScreen({ depenses, missions, onAdd }) {
  const total = depenses.reduce((s, d) => s + d.montant, 0);
  const bycat = {};
  depenses.forEach(d => { bycat[d.categorie] = (bycat[d.categorie] || 0) + d.montant; });

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-4" style={{ background: "linear-gradient(160deg, #92400E 0%, #F59E0B 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-200 text-xs font-medium uppercase tracking-wider">Dépenses</p>
            <h1 className="text-xl font-bold text-white mt-0.5">{fmt(total)}</h1>
          </div>
          <button onClick={onAdd} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {Object.entries(bycat).map(([cat, val]) => (
            <div key={cat} className="bg-white/15 rounded-xl p-2.5">
              <p className="text-xs text-amber-200">{catLabel[cat]}</p>
              <p className="text-sm font-bold text-white">{fmt(val)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2.5">
        {depenses.map(d => {
          const Icon = catIcon[d.categorie] || MoreHorizontal;
          const color = catColor[d.categorie];
          const mission = missions.find(m => m.id === d.missionId);
          return (
            <div key={d.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-50">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{catLabel[d.categorie]}</p>
                <p className="text-xs text-gray-500 truncate">{d.commentaire}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-400">{fmtDate(d.date)}</span>
                  {mission && <><span className="text-gray-300">•</span><span className="text-xs text-blue-500 truncate">{mission.nom.split(" ").slice(0, 3).join(" ")}</span></>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color }}>-{fmt(d.montant)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddDepenseScreen({ missions, onSave, onBack }) {
  const [form, setForm] = useState({ missionId: missions[0]?.id || "", categorie: "transport", montant: "", date: "", commentaire: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const totalRecu = missions.reduce((s, m) => s + m.montantRecu, 0);

  const handleSave = () => {
    if (!form.montant || !form.date) return;
    onSave({ ...form, id: Date.now(), montant: parseFloat(form.montant), missionId: parseInt(form.missionId) });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-5 flex items-center gap-3" style={{ background: "linear-gradient(160deg, #92400E 0%, #F59E0B 100%)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div>
          <p className="text-amber-200 text-xs font-medium">Dépenses</p>
          <h1 className="text-lg font-bold text-white">Ajouter une dépense</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mission associée</label>
          <select value={form.missionId} onChange={e => set("missionId", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400">
            {missions.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Catégorie</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(catLabel).map(([k, v]) => {
              const Icon = catIcon[k];
              const color = catColor[k];
              return (
                <button key={k} onClick={() => set("categorie", k)}
                  className={`rounded-xl p-2.5 flex flex-col items-center gap-1 border-2 transition-all ${form.categorie === k ? "border-current" : "border-gray-100 bg-gray-50"}`}
                  style={form.categorie === k ? { borderColor: color, background: color + "15" } : {}}>
                  <Icon size={16} style={{ color: form.categorie === k ? color : "#9CA3AF" }} />
                  <span className="text-xs font-medium" style={{ color: form.categorie === k ? color : "#9CA3AF" }}>{v}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Montant (FCFA)</label>
          <input type="number" value={form.montant} onChange={e => set("montant", e.target.value)} placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commentaire</label>
          <input type="text" value={form.commentaire} onChange={e => set("commentaire", e.target.value)} placeholder="Ex: Taxi pour le terrain"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
        </div>

        {form.montant && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
            <p className="text-xs text-orange-700 font-medium">Calcul automatique</p>
            <div className="mt-1.5 space-y-0.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total reçu</span><span className="font-semibold text-green-600">{fmt(totalRecu)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Cette dépense</span><span className="font-semibold text-orange-600">-{fmt(parseFloat(form.montant) || 0)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-800 border-t border-orange-100 pt-1 mt-1">
                <span>Bénéfice net</span><span className="text-blue-700">{fmt(totalRecu - (parseFloat(form.montant) || 0))}</span>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSave} className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95" style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}>
          Enregistrer la dépense
        </button>
      </div>
    </div>
  );
}

function PaiementsScreen({ paiements }) {
  const total = paiements.reduce((s, p) => s + p.montant, 0);
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-5" style={{ background: "linear-gradient(160deg, #14532D 0%, #16A34A 100%)" }}>
        <p className="text-green-200 text-xs font-medium uppercase tracking-wider">Paiements</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{fmt(total)}</h1>
        <p className="text-green-200 text-xs mt-1">{paiements.length} paiements reçus</p>
      </div>

      <div className="px-4 pt-5">
        <div className="relative pl-6">
          <div className="absolute left-2.5 top-0 bottom-4 w-0.5 bg-green-100" />
          <div className="space-y-4">
            {paiements.map((p, i) => (
              <div key={p.id} className="relative">
                <div className="absolute -left-4 top-4 w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow" />
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{fmtDate(p.date)}</p>
                      <p className="text-lg font-bold text-green-600 mt-0.5">+{fmt(p.montant)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-50 rounded-xl px-2.5 py-1.5">
                      <CheckCircle2 size={13} className="text-green-500" />
                      <span className="text-xs text-green-600 font-semibold">Reçu</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Hash size={11} className="text-gray-400" />
                      <span className="text-xs font-mono text-gray-500">{p.reference}</span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Briefcase size={11} className="text-blue-400" />
                    <span className="text-xs text-blue-500 font-medium truncate">{p.mission}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilScreen({ onLogout }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-8 pb-6 flex flex-col items-center" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 100%)" }}>
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-xl mb-3">🧑‍💼</div>
        <h1 className="text-xl font-bold text-white">{MOCK_USER.name}</h1>
        <p className="text-blue-200 text-sm mt-0.5">{MOCK_USER.email}</p>
        <span className="mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">Plan Gratuit</span>
      </div>

      <div className="px-4 pt-5 space-y-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-300" />
            <span className="font-bold text-sm">Passer à Pro</span>
          </div>
          <p className="text-xs text-blue-200">Débloquez les statistiques avancées, l'export PDF et les rapports annuels.</p>
          <button className="mt-3 bg-white text-blue-700 rounded-xl px-4 py-2 text-xs font-bold">Voir les offres →</button>
        </div>

        {[
          { icon: User, label: "Informations personnelles" },
          { icon: Bell, label: "Notifications" },
          { icon: Shield, label: "Sécurité & Confidentialité" },
          { icon: FileText, label: "Schéma base de données Supabase", special: true },
        ].map(({ icon: Icon, label, special }) => (
          <div key={label} className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border ${special ? "border-blue-100" : "border-gray-50"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${special ? "bg-blue-50" : "bg-gray-50"}`}>
              <Icon size={16} className={special ? "text-blue-500" : "text-gray-500"} />
            </div>
            <span className={`flex-1 text-sm font-medium ${special ? "text-blue-700" : "text-gray-700"}`}>{label}</span>
            <ChevronRight size={15} className="text-gray-300" />
          </div>
        ))}

        <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
          <p className="text-xs font-bold text-gray-700 mb-2 px-1">📋 Schéma SQL Supabase (aperçu)</p>
          <pre className="text-xs text-gray-500 bg-gray-900 text-green-400 rounded-xl p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed text-[10px]">{`CREATE TABLE missions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nom TEXT NOT NULL,
  montant_total NUMERIC(12,2),
  montant_recu NUMERIC(12,2),
  -- restant = montant_total - montant_recu
  statut TEXT CHECK (statut IN
    ('a_venir','en_cours','termine'))
);

CREATE TABLE depenses (
  id UUID PRIMARY KEY,
  mission_id UUID REFERENCES missions(id),
  categorie TEXT NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL
);

CREATE VIEW vue_bilan_missions AS
SELECT m.id, m.nom,
  m.montant_total - m.montant_recu
    AS restant_a_recevoir,
  SUM(d.montant) AS total_depenses,
  m.montant_recu - SUM(d.montant)
    AS benefice_net
FROM missions m
LEFT JOIN depenses d ON d.mission_id = m.id
GROUP BY m.id;`}</pre>
        </div>

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-500 font-semibold text-sm">
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────
const tabs = [
  { id: "dashboard", icon: Home, label: "Accueil" },
  { id: "missions", icon: Briefcase, label: "Missions" },
  { id: "depenses", icon: Receipt, label: "Dépenses" },
  { id: "profil", icon: User, label: "Profil" }
];

function BottomNav({ active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 shadow-2xl z-50">
      <div className="grid grid-cols-4 px-2 py-2">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onChange(id)} className="flex flex-col items-center gap-1 py-1 transition-all">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-blue-50" : ""}`}>
                <Icon size={19} className={isActive ? "text-blue-600" : "text-gray-400"} />
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [subscreen, setSubscreen] = useState(null);
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [depenses, setDepenses] = useState(INITIAL_DEPENSES);
  const [paiements, setPaiements] = useState(INITIAL_PAIEMENTS);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const handleAddMission = (m) => {
    setMissions(prev => [m, ...prev]);
    setSubscreen(null);
    setTab("missions");
  };

  const handleAddDepense = (d) => {
    setDepenses(prev => [d, ...prev]);
    setSubscreen(null);
    setTab("depenses");
  };

  const renderScreen = () => {
    if (subscreen === "add-mission") return <AddMissionScreen onSave={handleAddMission} onBack={() => setSubscreen(null)} />;
    if (subscreen === "add-depense") return <AddDepenseScreen missions={missions} onSave={handleAddDepense} onBack={() => setSubscreen(null)} />;
    if (tab === "dashboard") return <DashboardScreen missions={missions} depenses={depenses} paiements={paiements} />;
    if (tab === "missions") return <MissionsScreen missions={missions} onAdd={() => setSubscreen("add-mission")} />;
    if (tab === "depenses") return <DepensesScreen depenses={depenses} missions={missions} onAdd={() => setSubscreen("add-depense")} />;
    if (tab === "profil") return <ProfilScreen onLogout={() => setLoggedIn(false)} />;
    return null;
  };

  const showNav = !subscreen;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative" style={{ background: "#F8FAFC" }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderScreen()}
      </div>
      {showNav && (
        <BottomNav active={tab} onChange={(t) => { setTab(t); setSubscreen(null); }} />
      )}
    </div>
  );
}
