import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  Home, Briefcase, Receipt, User, ChevronRight, Plus,
  TrendingUp, Wallet, ArrowDownCircle, Clock, MapPin,
  Calendar, Building2, Lock, BarChart3, FileText,
  LogOut, Bell, Eye, EyeOff, CheckCircle2, AlertCircle,
  Car, Utensils, Bed, MoreHorizontal, ArrowLeft, X,
  CreditCard, Hash, Target, Zap, Shield, Star,
  UserPlus, Mail, KeyRound, RefreshCw, Loader2
} from "lucide-react";

// ─── PALETTE ──────────────────────────────────────────────────────
const C = {
  blue:    "#1E40AF",
  blueL:   "#DBEAFE",
  blueMid: "#3B82F6",
  blueDk:  "#1E3A8A",
  green:   "#16A34A",
  greenL:  "#DCFCE7",
  orange:  "#F59E0B",
  orangeL: "#FEF3C7",
  red:     "#EF4444",
  redL:    "#FEE2E2",
  purple:  "#7C3AED",
  purpleL: "#EDE9FE",
  bg:      "#F8FAFC",
  card:    "#FFFFFF",
  text:    "#0F172A",
  sub:     "#475569",
  muted:   "#94A3B8",
  border:  "#E2E8F0",
};

const GRAD_BLUE = "linear-gradient(160deg, #1E3A8A 0%, #1E40AF 45%, #2563EB 100%)";
const GRAD_BTN  = "linear-gradient(135deg, #1E40AF, #3B82F6)";

// ─── HELPERS ──────────────────────────────────────────────────────
const fmt     = (n) => new Intl.NumberFormat("fr-FR").format(n ?? 0) + " FCFA";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const today   = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const uid     = () => Math.random().toString(36).slice(2, 9);

const catIcon  = { transport: Car, repas: Utensils, hebergement: Bed, autres: MoreHorizontal };
const catColor = { transport: C.orange, repas: C.red, hebergement: C.blue, autres: C.muted };
const catLabel = { transport: "Transport", repas: "Repas", hebergement: "Hébergement", autres: "Autres" };

const statutCfg = {
  en_cours: { label: "En cours",  bg: C.blueL,   color: C.blue,   dot: C.blue   },
  termine:  { label: "Terminée",  bg: C.greenL,  color: C.green,  dot: C.green  },
  a_venir:  { label: "À venir",   bg: C.orangeL, color: C.orange, dot: C.orange },
};

// ─── LOCAL STORAGE (isolated per user) ────────────────────────────
const userKey = (uid, suffix) => `eq_${uid}_${suffix}`;

const stoGet = (uid, key, def) => {
  try {
    const v = localStorage.getItem(userKey(uid, key));
    return v ? JSON.parse(v) : def;
  } catch { return def; }
};

const stoSet = (uid, key, val) => {
  try { localStorage.setItem(userKey(uid, key), JSON.stringify(val)); } catch {}
};

// ─── SEED DATA (first login) ───────────────────────────────────────
const makeSeed = () => ({
  missions: [
    {
      id: "m1", nom: "Enquête Satisfaction Orange CI",
      commanditaire: "Cabinet Insight", entreprise: "Orange Côte d'Ivoire",
      localite: "Abidjan, Cocody", dateDebut: "2026-03-01", dateFin: "2026-04-30",
      montantTotal: 75000, montantRecu: 40000, progression: 55, statut: "en_cours",
    },
    {
      id: "m2", nom: "Étude Marché MTN Ghana",
      commanditaire: "DataScope Africa", entreprise: "MTN Ghana",
      localite: "Accra, Tema", dateDebut: "2026-01-10", dateFin: "2026-02-28",
      montantTotal: 120000, montantRecu: 120000, progression: 100, statut: "termine",
    },
    {
      id: "m3", nom: "Sondage Produit Nestlé",
      commanditaire: "Qualitex Research", entreprise: "Nestlé West Africa",
      localite: "Dakar, Plateau", dateDebut: "2026-05-01", dateFin: "2026-06-15",
      montantTotal: 55000, montantRecu: 0, progression: 0, statut: "a_venir",
    },
  ],
  depenses: [
    { id: "d1", missionId: "m1", categorie: "transport",   montant: 12000, date: "2026-03-15", commentaire: "Taxi Cocody - Plateau",     localite: "Abidjan" },
    { id: "d2", missionId: "m1", categorie: "repas",       montant: 8500,  date: "2026-03-18", commentaire: "Déjeuner équipe terrain",   localite: "Abidjan" },
    { id: "d3", missionId: "m1", categorie: "hebergement", montant: 25000, date: "2026-03-20", commentaire: "Hôtel résidence 2 nuits",   localite: "Abidjan" },
    { id: "d4", missionId: "m2", categorie: "transport",   montant: 18000, date: "2026-01-22", commentaire: "Vol Abidjan-Accra A/R",     localite: "Accra"   },
  ],
  paiements: [
    { id: "p1", missionId: "m1", montant: 25000, date: "2026-03-05", reference: "VIR-2026-0305", mission: "Enquête Orange CI" },
    { id: "p2", missionId: "m1", montant: 15000, date: "2026-03-25", reference: "VIR-2026-0325", mission: "Enquête Orange CI" },
    { id: "p3", missionId: "m2", montant: 60000, date: "2026-01-15", reference: "VIR-2026-0115", mission: "Étude MTN Ghana"  },
    { id: "p4", missionId: "m2", montant: 60000, date: "2026-02-28", reference: "VIR-2026-0228", mission: "Étude MTN Ghana"  },
  ],
});

// ─── PRIMITIVES ───────────────────────────────────────────────────

function ProgressBar({ value, color = C.blue }) {
  return (
    <div style={{ width: "100%", height: 7, background: C.border, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, Math.max(0, value))}%`, background: color, transition: "width .7s ease" }} />
    </div>
  );
}

function Badge({ statut }) {
  const s = statutCfg[statut] || statutCfg.a_venir;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function ProCard({ icon: Icon, label }) {
  return (
    <div style={{ borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, background: "linear-gradient(135deg, #1E293B, #0F172A)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .12, background: "radial-gradient(circle at 70% 50%, #3B82F6, transparent)" }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color="#93C5FD" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#93C5FD", marginTop: 2, fontWeight: 700 }}>Passer à Pro</div>
      </div>
      <Lock size={13} color="#64748B" />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <Loader2 size={20} color={C.blue} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState("login"); // "login" | "register" | "success"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [nom, setNom]           = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showPw2, setShowPw2]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const reset = () => { setError(""); setEmail(""); setPassword(""); setConfirmPw(""); setNom(""); };

  // ── CONNEXION ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) {
        const msg = {
          "Invalid login credentials": "Email ou mot de passe incorrect.",
          "Email not confirmed": "Veuillez confirmer votre email avant de vous connecter.",
          "Too many requests": "Trop de tentatives. Réessayez dans quelques minutes.",
        }[err.message] || err.message;
        setError(msg);
      }
      // onLogin() sera déclenché automatiquement via onAuthStateChange dans App
    } catch (e) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // ── INSCRIPTION ──────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!nom.trim() || !email.trim() || !password || !confirmPw) { setError("Tous les champs sont obligatoires."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirmPw) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: nom.trim(), display_name: nom.trim() } },
      });
      if (err) {
        const msg = {
          "User already registered": "Un compte existe déjà avec cet email.",
          "Password should be at least 6 characters": "Mot de passe trop court (minimum 6 caractères).",
        }[err.message] || err.message;
        setError(msg); return;
      }
      // Si confirmation email désactivée dans Supabase → session créée directement
      if (data.session) {
        // onAuthStateChange déclenchera onLogin()
      } else {
        setMode("success");
      }
    } catch (e) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister(); };

  // ── ÉCRAN SUCCÈS INSCRIPTION ──────────────────────────────────────
  if (mode === "success") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: GRAD_BLUE }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 0" }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 36 }}>✅</div>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>Inscription réussie !</h1>
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>Un email de confirmation vous a été envoyé à <strong style={{ color: "#fff" }}>{email}</strong>.<br/>Cliquez sur le lien pour activer votre compte.</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "36px 24px", marginTop: 40 }}>
        <CheckCircle2 size={48} color={C.green} style={{ display: "block", margin: "0 auto 16px" }} />
        <p style={{ fontSize: 13, color: C.sub, textAlign: "center", marginBottom: 24 }}>Après avoir confirmé votre email, revenez vous connecter.</p>
        <button onClick={() => { setMode("login"); reset(); }} style={{ width: "100%", padding: "14px 20px", borderRadius: 14, fontWeight: 800, fontSize: 15, color: "#fff", background: GRAD_BTN, border: "none", cursor: "pointer", boxShadow: `0 6px 20px ${C.blue}40` }}>
          Aller à la connexion →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: GRAD_BLUE, position: "relative", overflow: "hidden" }}>
      {/* Déco */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", top: 100, left: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />

      {/* Logo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 16px", position: "relative" }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,255,255,.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: "1.5px solid rgba(255,255,255,.2)", boxShadow: "0 16px 40px rgba(0,0,0,.3)" }}>
          <Shield size={32} color="#fff" />
        </div>
        <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 900, letterSpacing: -.5, marginBottom: 6 }}>EnquêteurPro</h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, textAlign: "center" }}>Gérez vos missions terrain en toute simplicité</p>
      </div>

      {/* CARTE FORMULAIRE */}
      <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", position: "relative", minHeight: "62vh", boxShadow: "0 -20px 60px rgba(0,0,0,.25)" }}>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.bg, borderRadius: 14, padding: 4, marginBottom: 26, gap: 4 }}>
          {[
            { id: "login",    icon: KeyRound,  label: "Connexion"   },
            { id: "register", icon: UserPlus,  label: "S'inscrire"  },
          ].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(""); }} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 8px", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: mode === t.id ? "#fff" : "transparent",
              color: mode === t.id ? C.blue : C.muted,
              boxShadow: mode === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
              transition: "all .2s",
            }}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 4 }}>
          {mode === "login" ? "Bienvenue 👋" : "Créer un compte"}
        </h2>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>
          {mode === "login" ? "Connectez-vous pour accéder à vos missions" : "Rejoignez EnquêteurPro gratuitement"}
        </p>

        {/* Message erreur */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.redL, border: `1px solid #FECACA`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
            <AlertCircle size={15} color={C.red} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
          {/* Nom (inscription uniquement) */}
          {mode === "register" && (
            <div>
              <label style={labelStyle}>Nom complet</label>
              <div style={inputWrap}>
                <User size={15} color={C.muted} style={{ flexShrink: 0 }} />
                <input value={nom} onChange={e => setNom(e.target.value)} onKeyDown={onKey}
                  placeholder="Kofi Mensah" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Adresse email</label>
            <div style={inputWrap}>
              <Mail size={15} color={C.muted} style={{ flexShrink: 0 }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey}
                placeholder="votre@email.com" style={inputStyle} />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ ...inputWrap, paddingRight: 10 }}>
              <KeyRound size={15} color={C.muted} style={{ flexShrink: 0 }} />
              <input type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
                placeholder="••••••••" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted, display: "flex", alignItems: "center" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "register" && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Minimum 6 caractères</p>}
          </div>

          {/* Confirmation (inscription uniquement) */}
          {mode === "register" && (
            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <div style={{ ...inputWrap, paddingRight: 10 }}>
                <KeyRound size={15} color={C.muted} style={{ flexShrink: 0 }} />
                <input type={showPw2 ? "text" : "password"} value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)} onKeyDown={onKey}
                  placeholder="••••••••" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => setShowPw2(!showPw2)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.muted, display: "flex", alignItems: "center" }}>
                  {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bouton principal */}
        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 14, fontWeight: 800, fontSize: 15, color: "#fff", background: loading ? "#93C5FD" : GRAD_BTN, border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 6px 20px ${C.blue}40`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
          {loading ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />Chargement…</> : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>

        {/* Lien bas */}
        <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 18 }}>
          {mode === "login" ? (
            <>Pas encore de compte ?{" "}
              <span onClick={() => { setMode("register"); setError(""); }} style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }}>S'inscrire gratuitement</span>
            </>
          ) : (
            <>Déjà un compte ?{" "}
              <span onClick={() => { setMode("login"); setError(""); }} style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }}>Se connecter</span>
            </>
          )}
        </p>
      </div>

      {/* CSS animations */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// Styles réutilisables pour le formulaire
const labelStyle = { display: "block", fontSize: 11, fontWeight: 800, color: C.sub, marginBottom: 6, textTransform: "uppercase", letterSpacing: .6 };
const inputWrap  = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#fff" };
const inputStyle = { border: "none", outline: "none", fontSize: 14, color: C.text, background: "transparent", width: "100%", fontFamily: "inherit" };

// ─── DASHBOARD ────────────────────────────────────────────────────

function DashboardScreen({ user, missions, depenses, paiements }) {
  const actives      = missions.filter(m => m.statut === "en_cours");
  const totalRecu    = missions.reduce((s, m) => s + m.montantRecu, 0);
  const totalDepenses= depenses.reduce((s, d) => s + d.montant, 0);
  const totalDu      = missions.reduce((s, m) => s + (m.montantTotal - m.montantRecu), 0);
  const beneficeNet  = totalRecu - totalDepenses;
  const current      = actives[0];

  const displayName  = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Enquêteur";

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "32px 20px 20px", background: GRAD_BLUE, borderRadius: "0 0 28px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: 13, marginBottom: 3 }}>Bonjour 👋</p>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -.3 }}>{displayName}</h1>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 3, textTransform: "capitalize" }}>{today()}</p>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={19} color="#fff" />
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20, position: "relative" }}>
          {[
            { label: "Missions actives",   val: actives.length,    color: "#93C5FD", bg: "rgba(255,255,255,.1)" },
            { label: "Total reçu",          val: fmt(totalRecu),    color: "#86EFAC", bg: "rgba(255,255,255,.1)" },
            { label: "Dépenses",           val: fmt(totalDepenses), color: "#FCD34D", bg: "rgba(255,255,255,.1)" },
            { label: "Restant à recevoir", val: fmt(totalDu),       color: "#FCA5A5", bg: "rgba(255,255,255,.1)" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(6px)" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 5, fontWeight: 700 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Bénéfice net */}
        <div style={{ marginTop: 16, background: beneficeNet >= 0 ? C.greenL : C.redL, borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${beneficeNet >= 0 ? "#BBF7D0" : "#FECACA"}` }}>
          <div>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7 }}>Bénéfice Net</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: beneficeNet >= 0 ? C.green : C.red, letterSpacing: -1, marginTop: 4 }}>{fmt(beneficeNet)}</p>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Total reçu – Total dépenses</p>
          </div>
          <Wallet size={36} color={beneficeNet >= 0 ? C.green : C.red} strokeWidth={1.5} />
        </div>

        {/* Mission en cours */}
        {current && (
          <>
            <SectionTitle title="Mission en cours" />
            <MissionCard m={current} />
          </>
        )}

        {/* Dépenses récentes */}
        <SectionTitle title="Dépenses récentes" />
        {depenses.length === 0
          ? <EmptyState icon="🧾" msg="Aucune dépense enregistrée" />
          : depenses.slice(0, 3).map(d => {
              const Icon = catIcon[d.categorie] || MoreHorizontal;
              return (
                <div key={d.id} style={{ background: C.card, borderRadius: 16, padding: "12px 16px", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: catColor[d.categorie] + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={catColor[d.categorie]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.commentaire || catLabel[d.categorie]}</p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtDate(d.date)}{d.localite ? ` · ${d.localite}` : ""}</p>
                  </div>
                  <p style={{ fontWeight: 800, color: C.orange, fontSize: 13, flexShrink: 0 }}>–{fmt(d.montant)}</p>
                </div>
              );
            })
        }

        {/* Timeline paiements */}
        <SectionTitle title="Paiements reçus" />
        {paiements.length === 0
          ? <EmptyState icon="💰" msg="Aucun paiement enregistré" />
          : paiements.slice(0, 4).map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.green, border: `3px solid ${C.greenL}`, flexShrink: 0, marginTop: 4 }} />
                {i < Math.min(paiements.length, 4) - 1 && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 24, marginTop: 2 }} />}
              </div>
              <div style={{ flex: 1, background: C.card, borderRadius: 14, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,.05)", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 900, color: C.green, fontSize: 15 }}>+{fmt(p.montant)}</p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.mission}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>Réf : <span style={{ fontWeight: 700, color: C.sub }}>{p.reference}</span></p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: C.muted }}>{fmtDate(p.date)}</p>
                    <span style={{ display: "inline-block", marginTop: 4, background: C.greenL, color: C.green, borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>✓ Reçu</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        }

        {/* Fonctionnalités Pro */}
        <SectionTitle title="Fonctionnalités Pro 🔒" />
        <ProCard icon={BarChart3} label="Statistiques avancées & graphiques" />
        <ProCard icon={FileText} label="Export PDF illimité" />
        <ProCard icon={Star}     label="Rapport annuel comparatif" />
      </div>
    </div>
  );
}

// ─── MISSIONS ─────────────────────────────────────────────────────

function MissionCard({ m, onClick }) {
  const restant = m.montantTotal - m.montantRecu;
  return (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: "0 3px 14px rgba(0,0,0,.07)", border: `1px solid ${C.border}`, borderLeft: `4px solid ${(statutCfg[m.statut] || statutCfg.a_venir).dot}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{m.nom}</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{m.commanditaire} · {m.entreprise}</p>
        </div>
        <Badge statut={m.statut} />
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.sub, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />{m.localite}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} />{fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}</span>
      </div>
      <ProgressBar value={m.progression} />
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
        {[["Total", fmt(m.montantTotal), C.text], ["Reçu", fmt(m.montantRecu), C.green], ["Restant", fmt(restant), C.red]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{l}</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: c, marginTop: 2 }}>{v}</p>
          </div>
        ))}
        {onClick && <div style={{ display: "flex", alignItems: "center" }}><ChevronRight size={16} color={C.muted} /></div>}
      </div>
    </div>
  );
}

function MissionsScreen({ missions, onAdd }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      <div style={{ padding: "24px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Missions</h2>
          <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, background: GRAD_BTN, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 4px 14px ${C.blue}40` }}>
            <Plus size={14} />Nouvelle
          </button>
        </div>

        {/* Pills résumé */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
          {[
            { l: "Total",     n: missions.length,                                    c: C.blue,   bg: C.blueL   },
            { l: "En cours",  n: missions.filter(m => m.statut === "en_cours").length, c: C.orange, bg: C.orangeL },
            { l: "Terminées", n: missions.filter(m => m.statut === "termine").length,  c: C.green,  bg: C.greenL  },
          ].map(s => (
            <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: "8px 16px", textAlign: "center", flexShrink: 0 }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.n}</p>
              <p style={{ fontSize: 10, color: s.c, fontWeight: 700 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {missions.length === 0
          ? <EmptyState icon="📋" msg="Aucune mission" sub="Créez votre première mission terrain" />
          : missions.map(m => <MissionCard key={m.id} m={m} />)
        }
      </div>
    </div>
  );
}

// ─── AJOUTER MISSION ──────────────────────────────────────────────

function AddMissionScreen({ onSave, onBack }) {
  const [f, setF] = useState({ nom: "", commanditaire: "", entreprise: "", localite: "", dateDebut: "", dateFin: "", montantTotal: "", montantRecu: "0", statut: "a_venir" });
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.nom.trim() || !f.commanditaire.trim() || !f.montantTotal) { setErr("Veuillez remplir les champs obligatoires (*)."); return; }
    const total = +f.montantTotal || 0;
    const recu  = +f.montantRecu  || 0;
    onSave({
      id: uid(), nom: f.nom, commanditaire: f.commanditaire,
      entreprise: f.entreprise, localite: f.localite,
      dateDebut: f.dateDebut, dateFin: f.dateFin,
      montantTotal: total, montantRecu: recu,
      progression: total > 0 ? Math.round((recu / total) * 100) : 0,
      statut: f.statut,
    });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={16} color={C.blue} /></button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Nouvelle mission</h2>
      </div>
      {err && <div style={{ margin: "0 16px 14px", padding: "10px 14px", background: C.redL, borderRadius: 12, fontSize: 12, color: C.red }}>{err}</div>}
      <div style={{ padding: "0 16px" }}>
        <FormCard title="Informations générales">
          <FormField label="Nom de la mission *"  value={f.nom}            onChange={e => set("nom", e.target.value)}            placeholder="Enquête satisfaction…" />
          <FormField label="Commanditaire *"       value={f.commanditaire}  onChange={e => set("commanditaire", e.target.value)}  placeholder="GIZ, Cabinet Insight…" />
          <FormField label="Entreprise cliente"    value={f.entreprise}     onChange={e => set("entreprise", e.target.value)}     placeholder="Orange CI, MTN…" />
          <FormField label="Localité"              value={f.localite}       onChange={e => set("localite", e.target.value)}       placeholder="Abidjan, Bouaké…" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Date début" type="date" value={f.dateDebut} onChange={e => set("dateDebut", e.target.value)} />
            <FormField label="Date fin"   type="date" value={f.dateFin}   onChange={e => set("dateFin", e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Statut</label>
            <select value={f.statut} onChange={e => set("statut", e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", outline: "none", fontFamily: "inherit" }}>
              <option value="a_venir">📅 À venir</option>
              <option value="en_cours">🟢 En cours</option>
              <option value="termine">✅ Terminée</option>
            </select>
          </div>
        </FormCard>
        <FormCard title="Finances">
          <FormField label="Montant total prévu (FCFA) *" type="number" value={f.montantTotal} onChange={e => set("montantTotal", e.target.value)} placeholder="75 000" />
          <FormField label="Montant déjà reçu (FCFA)"     type="number" value={f.montantRecu}  onChange={e => set("montantRecu", e.target.value)}  placeholder="0" />
          {f.montantTotal > 0 && (
            <div style={{ background: C.blueL, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: C.blue, fontWeight: 700 }}>
              Restant à recevoir : {fmt((+f.montantTotal || 0) - (+f.montantRecu || 0))}
            </div>
          )}
        </FormCard>
        <button onClick={save} style={submitBtnStyle}>✅ Créer la mission</button>
      </div>
    </div>
  );
}

// ─── DÉPENSES ─────────────────────────────────────────────────────

function DepensesScreen({ depenses, missions, onAdd }) {
  const total = depenses.reduce((s, d) => s + d.montant, 0);
  const byCat = Object.entries(catLabel).map(([k, l]) => ({
    key: k, label: l, total: depenses.filter(d => d.categorie === k).reduce((s, d) => s + d.montant, 0),
  })).filter(c => c.total > 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100, padding: "24px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Dépenses</h2>
        <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, background: C.orange, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={14} />Ajouter
        </button>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${C.orangeL}, #FFF7ED)`, borderRadius: 18, padding: "16px 18px", marginBottom: 16, border: `1px solid #FDE68A`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7 }}>Total dépenses</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: C.orange, letterSpacing: -1, marginTop: 4 }}>{fmt(total)}</p>
        </div>
        <Receipt size={36} color={C.orange} strokeWidth={1.5} />
      </div>

      {byCat.length > 0 && (
        <>
          <SectionTitle title="Par catégorie" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {byCat.map(c => {
              const Icon = catIcon[c.key] || MoreHorizontal;
              return (
                <div key={c.key} style={{ background: C.orangeL, borderRadius: 16, padding: 14, border: `1px solid #FDE68A` }}>
                  <Icon size={20} color={C.orangeDark || "#D97706"} />
                  <p style={{ fontWeight: 900, color: C.orange, fontSize: 15, marginTop: 8 }}>{fmt(c.total)}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{c.label}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle title={`Historique (${depenses.length})`} />
      {depenses.length === 0
        ? <EmptyState icon="🧾" msg="Aucune dépense" sub="Ajoutez votre première dépense terrain" />
        : depenses.map(d => {
          const Icon = catIcon[d.categorie] || MoreHorizontal;
          return (
            <div key={d.id} style={{ background: C.card, borderRadius: 16, padding: "12px 16px", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: catColor[d.categorie] + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={19} color={catColor[d.categorie]} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.commentaire || catLabel[d.categorie]}</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtDate(d.date)}{d.localite ? ` · ${d.localite}` : ""}</p>
              </div>
              <p style={{ fontWeight: 800, color: C.orange, fontSize: 13, flexShrink: 0 }}>–{fmt(d.montant)}</p>
            </div>
          );
        })
      }
    </div>
  );
}

function AddDepenseScreen({ missions, onSave, onBack }) {
  const [f, setF] = useState({ missionId: missions[0]?.id || "", categorie: "transport", montant: "", date: new Date().toISOString().slice(0, 10), commentaire: "", localite: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.montant) { setErr("Le montant est obligatoire."); return; }
    onSave({ id: uid(), ...f, montant: +f.montant });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={16} color={C.blue} /></button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Nouvelle dépense</h2>
      </div>
      {err && <div style={{ margin: "0 16px 14px", padding: "10px 14px", background: C.redL, borderRadius: 12, fontSize: 12, color: C.red }}>{err}</div>}
      <div style={{ padding: "0 16px" }}>
        <FormCard title="Détails de la dépense">
          {missions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Mission associée</label>
              <select value={f.missionId} onChange={e => set("missionId", e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: "#fff", outline: "none", fontFamily: "inherit" }}>
                {missions.map(m => <option key={m.id} value={m.id}>{m.nom.slice(0, 40)}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Catégorie</label>
            <select value={f.categorie} onChange={e => set("categorie", e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", outline: "none", fontFamily: "inherit" }}>
              <option value="transport">🚗 Transport</option>
              <option value="repas">🍽️ Repas</option>
              <option value="hebergement">🏨 Hébergement</option>
              <option value="autres">📦 Autres</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Montant (FCFA) *" type="number" value={f.montant} onChange={e => set("montant", e.target.value)} placeholder="12 000" />
            <FormField label="Date"              type="date"   value={f.date}    onChange={e => set("date", e.target.value)} />
          </div>
          <FormField label="Description" value={f.commentaire} onChange={e => set("commentaire", e.target.value)} placeholder="Taxi Cocody – Plateau…" />
          <FormField label="Localité"   value={f.localite}    onChange={e => set("localite", e.target.value)}    placeholder="Abidjan…" />
        </FormCard>
        <button onClick={save} style={{ ...submitBtnStyle, background: C.orange, boxShadow: `0 6px 20px ${C.orange}40` }}>✅ Enregistrer la dépense</button>
      </div>
    </div>
  );
}

// ─── PROFIL ───────────────────────────────────────────────────────

function ProfilScreen({ user, missions, depenses, paiements, onLogout, onReset }) {
  const [loading, setLoading] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Enquêteur";
  const initials    = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const totalRecu = missions.reduce((s, m) => s + m.montantRecu, 0);
  const totalDep  = depenses.reduce((s, d) => s + d.montant, 0);
  const benefice  = totalRecu - totalDep;

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    onLogout();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100, padding: "24px 16px 100px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>Profil</h2>

      {/* Avatar card */}
      <div style={{ background: C.card, borderRadius: 22, padding: 24, textAlign: "center", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,.07)", border: `1px solid ${C.border}` }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: GRAD_BTN, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26, fontWeight: 900, color: "#fff", boxShadow: `0 8px 24px ${C.blue}40` }}>
          {initials}
        </div>
        <p style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{displayName}</p>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{user?.email}</p>
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: C.blueL, padding: "5px 14px", borderRadius: 99 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block" }} />
          <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>Compte actif</span>
        </div>
      </div>

      <SectionTitle title="Statistiques globales" />
      {[
        { label: "Missions enregistrées", val: missions.length, color: C.blue   },
        { label: "Total perçu",            val: fmt(totalRecu),  color: C.green  },
        { label: "Total dépenses",         val: fmt(totalDep),   color: C.orange },
        { label: "Bénéfice net",           val: fmt(benefice),   color: benefice >= 0 ? C.green : C.red },
      ].map(s => (
        <div key={s.label} style={{ background: C.card, borderRadius: 14, padding: "12px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.04)", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.sub }}>{s.label}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: s.color }}>{s.val}</span>
        </div>
      ))}

      <SectionTitle title="Fonctionnalités Pro 🔒" />
      <ProCard icon={BarChart3} label="Statistiques & graphiques avancés" />
      <ProCard icon={FileText}  label="Export PDF / Excel illimité" />
      <ProCard icon={Clock}     label="Rapport annuel comparatif" />

      <SectionTitle title="Compte" />
      <button onClick={onReset} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
        <RefreshCw size={16} color={C.muted} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 14, color: C.sub, fontWeight: 600 }}>Réinitialiser les données démo</span>
        <ChevronRight size={14} color={C.muted} />
      </button>
      <button onClick={handleLogout} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", borderRadius: 16, background: C.redL, border: `1px solid #FECACA`, color: C.red, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Déconnexion…</> : <><LogOut size={16} />Se déconnecter</>}
      </button>
    </div>
  );
}

// ─── SHARED SMALL COMPONENTS ──────────────────────────────────────

function SectionTitle({ title }) {
  return <p style={{ fontSize: 15, fontWeight: 900, color: C.text, marginTop: 20, marginBottom: 10 }}>{title}</p>;
}

function EmptyState({ icon, msg, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>{msg}</p>
      {sub && <p style={{ fontSize: 13, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 18, padding: 18, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 11, fontWeight: 900, color: C.blue, textTransform: "uppercase", letterSpacing: .8, marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function FormField({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input {...props} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

const backBtnStyle   = { background: C.blueL, border: "none", borderRadius: 10, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center" };
const submitBtnStyle = { width: "100%", padding: "14px 20px", borderRadius: 14, fontWeight: 800, fontSize: 15, color: "#fff", background: GRAD_BTN, border: "none", cursor: "pointer", boxShadow: `0 6px 20px ${C.blue}40` };

// ─── BOTTOM NAV ───────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", icon: Home,      label: "Accueil"  },
  { id: "missions",  icon: Briefcase, label: "Missions" },
  { id: "depenses",  icon: Receipt,   label: "Dépenses" },
  { id: "profil",    icon: User,      label: "Profil"   },
];

function BottomNav({ active, onChange }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)", zIndex: 100, boxShadow: "0 -6px 24px rgba(0,0,0,.08)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {TABS.map(({ id, icon: Icon, label }) => {
        const active_ = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px 12px", border: "none", background: "transparent", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: active_ ? C.blueL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
              <Icon size={19} color={active_ ? C.blue : C.muted} />
            </div>
            <span style={{ fontSize: 10, fontWeight: active_ ? 800 : 500, color: active_ ? C.blue : C.muted }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── LOADING SPLASH ───────────────────────────────────────────────

function SplashScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: GRAD_BLUE }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 16px 40px rgba(0,0,0,.3)" }}>
        <Shield size={36} color="#fff" />
      </div>
      <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: -.5, marginBottom: 8 }}>EnquêteurPro</h1>
      <Loader2 size={24} color="rgba(255,255,255,.5)" style={{ animation: "spin 1s linear infinite", marginTop: 12 }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────

export default function App() {
  const [authState, setAuthState] = useState("loading"); // "loading" | "authed" | "guest"
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState("dashboard");
  const [subscreen, setSubscreen] = useState(null);
  const [missions, setMissions]   = useState([]);
  const [depenses, setDepenses]   = useState([]);
  const [paiements, setPaiements] = useState([]);

  // ── Chargement données utilisateur depuis localStorage ────────────
  const loadUserData = useCallback((uid) => {
    const seed = makeSeed();
    setMissions(stoGet(uid, "missions",  seed.missions));
    setDepenses(stoGet(uid, "depenses",  seed.depenses));
    setPaiements(stoGet(uid, "paiements", seed.paiements));
  }, []);

  // ── Auth state listener + vérification session au démarrage ──────
  useEffect(() => {
    // 1. Vérifier session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
        setAuthState("authed");
      } else {
        setAuthState("guest");
      }
    });

    // 2. Écouter changements d'état (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
        setAuthState("authed");
      } else {
        setUser(null);
        setAuthState("guest");
        setTab("dashboard");
        setSubscreen(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // ── Persistance des données ────────────────────────────────────────
  const saveMissions  = (v) => { setMissions(v);  if (user) stoSet(user.id, "missions",  v); };
  const saveDepenses  = (v) => { setDepenses(v);  if (user) stoSet(user.id, "depenses",  v); };
  const savePaiements = (v) => { setPaiements(v); if (user) stoSet(user.id, "paiements", v); };

  const handleAddMission = (m) => { saveMissions([m, ...missions]); setSubscreen(null); setTab("missions"); };
  const handleAddDepense = (d) => { saveDepenses([d, ...depenses]); setSubscreen(null); setTab("depenses"); };

  const handleReset = () => {
    if (window.confirm("Réinitialiser avec les données de démonstration ?")) {
      const seed = makeSeed();
      saveMissions(seed.missions); saveDepenses(seed.depenses); savePaiements(seed.paiements);
    }
  };

  const handleLogout = () => {
    // signOut() est déjà appelé dans ProfilScreen, ici on gère juste l'état UI
    setMissions([]); setDepenses([]); setPaiements([]);
  };

  // ── Rendu conditionnel par état ────────────────────────────────────
  if (authState === "loading")    return <SplashScreen />;
  if (authState === "guest")      return <LoginScreen onLogin={() => {}} />;

  const renderScreen = () => {
    if (subscreen === "add-mission") return <AddMissionScreen onSave={handleAddMission} onBack={() => setSubscreen(null)} />;
    if (subscreen === "add-depense") return <AddDepenseScreen missions={missions} onSave={handleAddDepense} onBack={() => setSubscreen(null)} />;
    switch (tab) {
      case "dashboard": return <DashboardScreen user={user} missions={missions} depenses={depenses} paiements={paiements} />;
      case "missions":  return <MissionsScreen missions={missions} onAdd={() => setSubscreen("add-mission")} />;
      case "depenses":  return <DepensesScreen depenses={depenses} missions={missions} onAdd={() => setSubscreen("add-depense")} />;
      case "profil":    return <ProfilScreen user={user} missions={missions} depenses={depenses} paiements={paiements} onLogout={handleLogout} onReset={handleReset} />;
      default:          return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", background: C.bg, position: "relative", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        {renderScreen()}
      </div>
      {!subscreen && <BottomNav active={tab} onChange={t => { setTab(t); setSubscreen(null); }} />}
      <style>{`* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } body { margin: 0; } @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
