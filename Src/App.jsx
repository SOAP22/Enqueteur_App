import { useState, useEffect } from "react";

// ─── PALETTE ────────────────────────────────────────────────
const C = {
  blue: "#1E40AF",
  blueLight: "#DBEAFE",
  blueMid: "#3B82F6",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  orange: "#F59E0B",
  orangeLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
};

// ─── MOCK DATA ───────────────────────────────────────────────
const MOCK = {
  user: { name: "Kofi Mensah", email: "kofi@terrain.ci", avatar: "KM" },
  missions: [
    {
      id: "m1", nom: "Enquête satisfaction Orange CI", commanditaire: "Cabinet Insight",
      entreprise: "Orange CI", debut: "2026-03-10", fin: "2026-04-20",
      localite: "Abidjan, Cocody", montant: 75000, recu: 40000,
      jours: 18, joursTotal: 24, statut: "active",
    },
    {
      id: "m2", nom: "Sondage clientèle MTN", commanditaire: "DataField SARL",
      entreprise: "MTN Côte d'Ivoire", debut: "2026-02-01", fin: "2026-03-05",
      localite: "Bouaké", montant: 55000, recu: 55000,
      jours: 28, joursTotal: 28, statut: "terminee",
    },
    {
      id: "m3", nom: "Audit réseau Moov Africa", commanditaire: "SondEx Bureau",
      entreprise: "Moov Africa", debut: "2026-04-15", fin: "2026-05-30",
      localite: "Daloa", montant: 90000, recu: 0,
      jours: 0, joursTotal: 45, statut: "planifiee",
    },
  ],
  depenses: [
    { id: "d1", cat: "transport", montant: 8500, date: "2026-04-09", comment: "Taxi Cocody → Plateau", mission: "m1" },
    { id: "d2", cat: "repas", montant: 3200, date: "2026-04-08", comment: "Déjeuner terrain", mission: "m1" },
    { id: "d3", cat: "hebergement", montant: 15000, date: "2026-04-07", comment: "Hotel Abidjan", mission: "m1" },
    { id: "d4", cat: "transport", montant: 6000, date: "2026-03-20", comment: "Car Bouaké A/R", mission: "m2" },
    { id: "d5", cat: "repas", montant: 4500, date: "2026-03-18", comment: "Repas équipe", mission: "m2" },
  ],
  paiements: [
    { id: "p1", date: "2026-04-01", montant: 25000, ref: "VIR-2026-0401", mission: "m1" },
    { id: "p2", date: "2026-03-15", montant: 15000, ref: "VIR-2026-0315", mission: "m1" },
    { id: "p3", date: "2026-03-05", montant: 55000, ref: "VIR-2026-0305", mission: "m2" },
  ],
};

// ─── HELPERS ────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const today = () =>
  new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const CAT_ICONS = {
  transport: "🚗", repas: "🍽️", hebergement: "🏨", autres: "📦",
};

const STATUS_CFG = {
  active: { label: "Active", bg: C.blueLight, color: C.blue },
  terminee: { label: "Terminée", bg: C.greenLight, color: C.green },
  planifiee: { label: "Planifiée", bg: C.orangeLight, color: C.orange },
};

// ─── STORAGE ────────────────────────────────────────────────
const load = (key, def) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ─── COMPONENTS ─────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, borderRadius: 16, padding: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,.07)", marginBottom: 12,
    cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const Badge = ({ label, bg, color }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
    {label}
  </span>
);

const ProgressBar = ({ pct, color = C.blue }) => (
  <div style={{ background: "#E2E8F0", borderRadius: 99, height: 8, overflow: "hidden", margin: "8px 0" }}>
    <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width .6s ease" }} />
  </div>
);

const Btn = ({ label, onClick, color = C.blue, outline, full, small, icon }) => (
  <button onClick={onClick} style={{
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    border: `2px solid ${color}`,
    borderRadius: 12, padding: small ? "8px 14px" : "12px 20px",
    fontWeight: 700, fontSize: small ? 13 : 15,
    width: full ? "100%" : "auto",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
    boxShadow: outline ? "none" : "0 4px 14px rgba(30,64,175,.25)",
  }}>
    {icon && <span>{icon}</span>}{label}
  </button>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
      border: `1.5px solid ${C.border}`, fontSize: 14, background: "#fff",
      outline: "none", color: C.text, ...props.style,
    }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "11px 14px", borderRadius: 10, boxSizing: "border-box",
      border: `1.5px solid ${C.border}`, fontSize: 14, background: "#fff", color: C.text, outline: "none",
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const LockedCard = ({ title, icon }) => (
  <Card style={{ background: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", opacity: .85 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>PRO</div>
        <div style={{ fontWeight: 700, color: C.text, marginTop: 2 }}>{icon} {title}</div>
      </div>
      <div style={{ fontSize: 28 }}>🔒</div>
    </div>
    <div style={{ marginTop: 10 }}>
      <Btn label="Débloquer Pro" small color={C.blue} />
    </div>
  </Card>
);

// ─── SCREEN: LOGIN ───────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("kofi@terrain.ci");
  const [pass, setPass] = useState("••••••••");

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.blue} 0%, #1E3A8A 60%, #0F172A 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>🔍</div>
        <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: -.5 }}>EnquêtePro</div>
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: 4 }}>Espace enquêteur terrain</div>
      </div>

      <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Connexion</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Accédez à votre espace personnel</div>

        <Input label="Email / Identifiant" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="votre@email.com" />
        <Input label="Mot de passe" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" />

        <div style={{ marginTop: 4, marginBottom: 20 }}>
          <Btn label="Se connecter" full onClick={onLogin} color={C.blue} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted }}>
          MVP v0.1 · Données locales sécurisées
        </div>
      </div>
    </div>
  );
};

// ─── SCREEN: DASHBOARD ───────────────────────────────────────
const DashboardScreen = ({ data, nav }) => {
  const missionActive = data.missions.find(m => m.statut === "active");
  const totalRecu = data.paiements.reduce((s, p) => s + p.montant, 0);
  const totalDep = data.depenses.reduce((s, d) => s + d.montant, 0);
  const totalMontants = data.missions.reduce((s, m) => s + m.montant, 0);
  const restant = totalMontants - totalRecu;
  const activeCnt = data.missions.filter(m => m.statut === "active").length;

  const stats = [
    { label: "Missions actives", val: activeCnt, icon: "📋", bg: C.blueLight, color: C.blue },
    { label: "Total reçu", val: fmt(totalRecu), icon: "💰", bg: C.greenLight, color: C.green },
    { label: "Dépenses", val: fmt(totalDep), icon: "🧾", bg: C.orangeLight, color: C.orange },
    { label: "Restant", val: fmt(restant), icon: "⏳", bg: C.redLight, color: C.red },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.blue}, #1E3A8A)`, padding: "28px 20px 20px", borderRadius: "0 0 28px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>Bonjour 👋</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>{data.user.name}</div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 2 }}>{today()}</div>
          </div>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 16 }}>
            {data.user.avatar}
          </div>
        </div>
        {missionActive && (
          <div style={{ marginTop: 14, background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "8px 14px" }}>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>Mission en cours</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginTop: 2 }}>
              📍 {missionActive.localite} · {missionActive.nom.slice(0, 30)}…
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600, opacity: .8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission en cours */}
        {missionActive && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>Mission en cours</div>
            <Card style={{ background: `linear-gradient(135deg, ${C.blue}10, ${C.blue}05)`, border: `1px solid ${C.blueLight}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{missionActive.nom}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{missionActive.commanditaire} · {missionActive.entreprise}</div>
                </div>
                <Badge label="Active" bg={C.blueLight} color={C.blue} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: C.muted }}>
                <span>📅 {fmtDate(missionActive.debut)}</span>
                <span>📍 {missionActive.localite}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: C.muted }}>Progression</span>
                  <span style={{ color: C.blue }}>{Math.round((missionActive.jours / missionActive.joursTotal) * 100)}%</span>
                </div>
                <ProgressBar pct={(missionActive.jours / missionActive.joursTotal) * 100} />
                <div style={{ fontSize: 11, color: C.muted }}>{missionActive.jours} / {missionActive.joursTotal} jours effectués</div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                <div><div style={{ fontSize: 11, color: C.muted }}>Montant total</div><div style={{ fontWeight: 800, color: C.text }}>{fmt(missionActive.montant)}</div></div>
                <div><div style={{ fontSize: 11, color: C.muted }}>Reçu</div><div style={{ fontWeight: 800, color: C.green }}>{fmt(missionActive.recu)}</div></div>
                <div><div style={{ fontSize: 11, color: C.muted }}>Restant</div><div style={{ fontWeight: 800, color: C.red }}>{fmt(missionActive.montant - missionActive.recu)}</div></div>
              </div>
            </Card>
          </>
        )}

        {/* Dépenses récentes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Dépenses récentes</div>
          <span onClick={() => nav("depenses")} style={{ fontSize: 12, color: C.blue, fontWeight: 700, cursor: "pointer" }}>Voir tout →</span>
        </div>
        {data.depenses.slice(0, 3).map(d => (
          <Card key={d.id} style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, background: C.orangeLight, borderRadius: 10, padding: "6px 8px" }}>{CAT_ICONS[d.cat]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{d.comment}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(d.date)}</div>
              </div>
              <div style={{ fontWeight: 800, color: C.orange, fontSize: 14 }}>-{fmt(d.montant)}</div>
            </div>
          </Card>
        ))}

        {/* Paiements */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Paiements récents</div>
          <span onClick={() => nav("paiements")} style={{ fontSize: 12, color: C.blue, fontWeight: 700, cursor: "pointer" }}>Voir tout →</span>
        </div>
        {data.paiements.slice(0, 3).map((p, i) => (
          <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, marginTop: 4 }} />
              {i < 2 && <div style={{ width: 2, height: 30, background: C.border, marginTop: 2 }} />}
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 14 }}>+{fmt(p.montant)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(p.date)}</div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Réf: {p.ref}</div>
            </div>
          </div>
        ))}

        {/* Pro locked */}
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: "16px 0 8px" }}>Fonctionnalités Pro</div>
        <LockedCard title="Statistiques avancées" icon="📊" />
        <LockedCard title="Export PDF rapports" icon="📄" />
        <LockedCard title="Rapport annuel" icon="📅" />

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};

// ─── SCREEN: MISSIONS ────────────────────────────────────────
const MissionsScreen = ({ data, setData }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", commanditaire: "", entreprise: "", debut: "", fin: "", localite: "", montant: "", recu: "" });

  const addMission = () => {
    if (!form.nom) return;
    const m = {
      id: "m" + Date.now(), statut: "active",
      nom: form.nom, commanditaire: form.commanditaire, entreprise: form.entreprise,
      debut: form.debut, fin: form.fin, localite: form.localite,
      montant: +form.montant || 0, recu: +form.recu || 0,
      jours: 0, joursTotal: 30,
    };
    const updated = { ...data, missions: [m, ...data.missions] };
    setData(updated);
    save("eq_data", updated);
    setShowForm(false);
    setForm({ nom: "", commanditaire: "", entreprise: "", debut: "", fin: "", localite: "", montant: "", recu: "" });
  };

  if (showForm) return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setShowForm(false)} style={{ background: C.blueLight, border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontWeight: 700, color: C.blue }}>← Retour</button>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Nouvelle mission</div>
      </div>
      <Card>
        <Input label="Nom de la mission *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Enquête satisfaction..." />
        <Input label="Commanditaire" value={form.commanditaire} onChange={e => setForm({ ...form, commanditaire: e.target.value })} placeholder="Cabinet Insight" />
        <Input label="Entreprise cliente" value={form.entreprise} onChange={e => setForm({ ...form, entreprise: e.target.value })} placeholder="Orange CI" />
        <Input label="Date début" type="date" value={form.debut} onChange={e => setForm({ ...form, debut: e.target.value })} />
        <Input label="Date fin" type="date" value={form.fin} onChange={e => setForm({ ...form, fin: e.target.value })} />
        <Input label="Localité" value={form.localite} onChange={e => setForm({ ...form, localite: e.target.value })} placeholder="Abidjan, Cocody" />
        <Input label="Montant total (FCFA)" type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} placeholder="75000" />
        <Input label="Montant déjà reçu (FCFA)" type="number" value={form.recu} onChange={e => setForm({ ...form, recu: e.target.value })} placeholder="0" />
        <Btn label="✅ Enregistrer la mission" full onClick={addMission} color={C.blue} />
      </Card>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Mes Missions</div>
        <Btn label="+ Ajouter" small onClick={() => setShowForm(true)} color={C.blue} />
      </div>

      {data.missions.map(m => {
        const cfg = STATUS_CFG[m.statut];
        const pct = m.joursTotal ? Math.round((m.jours / m.joursTotal) * 100) : 0;
        return (
          <Card key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{m.nom}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.commanditaire} · {m.entreprise}</div>
              </div>
              <Badge label={cfg.label} bg={cfg.bg} color={cfg.color} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: C.muted }}>
              <span>📅 {fmtDate(m.debut)} → {fmtDate(m.fin)}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {m.localite}</div>
            {m.statut !== "planifiee" && (
              <>
                <ProgressBar pct={pct} />
                <div style={{ fontSize: 11, color: C.muted }}>{pct}% · {m.jours}/{m.joursTotal} jours</div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
              <div><div style={{ fontSize: 10, color: C.muted }}>Total</div><div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{fmt(m.montant)}</div></div>
              <div><div style={{ fontSize: 10, color: C.muted }}>Reçu</div><div style={{ fontWeight: 800, fontSize: 13, color: C.green }}>{fmt(m.recu)}</div></div>
              <div><div style={{ fontSize: 10, color: C.muted }}>Restant</div><div style={{ fontWeight: 800, fontSize: 13, color: C.red }}>{fmt(m.montant - m.recu)}</div></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ─── SCREEN: DÉPENSES ────────────────────────────────────────
const DepensesScreen = ({ data, setData }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cat: "transport", montant: "", date: new Date().toISOString().slice(0, 10), comment: "", mission: data.missions[0]?.id || "" });

  const totalRecu = data.paiements.reduce((s, p) => s + p.montant, 0);
  const totalDep = data.depenses.reduce((s, d) => s + d.montant, 0);
  const reste = totalRecu - totalDep;

  const addDep = () => {
    if (!form.montant) return;
    const d = { id: "d" + Date.now(), cat: form.cat, montant: +form.montant, date: form.date, comment: form.comment, mission: form.mission };
    const updated = { ...data, depenses: [d, ...data.depenses] };
    setData(updated);
    save("eq_data", updated);
    setShowForm(false);
  };

  if (showForm) return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setShowForm(false)} style={{ background: C.blueLight, border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontWeight: 700, color: C.blue }}>← Retour</button>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Nouvelle dépense</div>
      </div>
      <Card>
        <Select label="Catégorie" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}
          options={[{ value: "transport", label: "🚗 Transport" }, { value: "repas", label: "🍽️ Repas" }, { value: "hebergement", label: "🏨 Hébergement" }, { value: "autres", label: "📦 Autres" }]} />
        <Input label="Montant (FCFA) *" type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} placeholder="5000" />
        <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <Input label="Commentaire" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="Taxi pour enquête..." />
        <Select label="Mission associée" value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })}
          options={data.missions.map(m => ({ value: m.id, label: m.nom.slice(0, 35) }))} />
        <Btn label="✅ Enregistrer la dépense" full onClick={addDep} color={C.orange} />
      </Card>
    </div>
  );

  const cats = ["transport", "repas", "hebergement", "autres"];
  const byCat = cats.map(c => ({ cat: c, total: data.depenses.filter(d => d.cat === c).reduce((s, d) => s + d.montant, 0) }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Dépenses</div>
        <Btn label="+ Ajouter" small onClick={() => setShowForm(true)} color={C.orange} />
      </div>

      {/* Summary */}
      <Card style={{ background: `linear-gradient(135deg,${C.orangeLight},#FFF7ED)` }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Total reçu</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.green }}>{fmt(totalRecu)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Dépenses</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.orange }}>{fmt(totalDep)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Solde net</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: reste >= 0 ? C.green : C.red }}>{fmt(reste)}</div>
          </div>
        </div>
      </Card>

      {/* Par catégorie */}
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: "12px 0 8px" }}>Par catégorie</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {byCat.map(b => (
          <div key={b.cat} style={{ background: C.orangeLight, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 20 }}>{CAT_ICONS[b.cat]}</div>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 14, marginTop: 4 }}>{fmt(b.total)}</div>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>{b.cat}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>Historique</div>
      {data.depenses.map(d => (
        <Card key={d.id} style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, background: C.orangeLight, borderRadius: 10, padding: "6px 8px" }}>{CAT_ICONS[d.cat]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{d.comment || d.cat}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(d.date)}</div>
            </div>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 14 }}>-{fmt(d.montant)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── SCREEN: PAIEMENTS ───────────────────────────────────────
const PaiementsScreen = ({ data }) => {
  const total = data.paiements.reduce((s, p) => s + p.montant, 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>Paiements reçus</div>

      <Card style={{ background: `linear-gradient(135deg,${C.greenLight},#F0FDF4)`, textAlign: "center", padding: 20 }}>
        <div style={{ fontSize: 11, color: C.muted }}>TOTAL PERÇU</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.green, letterSpacing: -1 }}>{fmt(total)}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{data.paiements.length} virement(s) reçu(s)</div>
      </Card>

      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: "16px 0 8px" }}>Historique complet</div>

      {data.paiements.map((p, i) => {
        const mission = data.missions.find(m => m.id === p.mission);
        return (
          <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.green, border: `3px solid ${C.greenLight}`, marginTop: 4, flexShrink: 0 }} />
              {i < data.paiements.length - 1 && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 30, marginTop: 2 }} />}
            </div>
            <Card style={{ flex: 1, margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.green, fontSize: 16 }}>+{fmt(p.montant)}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Réf: <span style={{ fontWeight: 700, color: C.text }}>{p.ref}</span></div>
                  {mission && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📋 {mission.nom.slice(0, 30)}…</div>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, textAlign: "right" }}>
                  <div>{fmtDate(p.date)}</div>
                  <div style={{ marginTop: 4, background: C.greenLight, color: C.green, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>✓ Reçu</div>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

// ─── SCREEN: PROFIL ──────────────────────────────────────────
const ProfilScreen = ({ data, onLogout }) => (
  <div style={{ padding: 16 }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16 }}>Mon Profil</div>

    <Card style={{ textAlign: "center", padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${C.blue},${C.blueMid})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, fontWeight: 800, color: "#fff" }}>
        {data.user.avatar}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{data.user.name}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{data.user.email}</div>
      <div style={{ marginTop: 10 }}>
        <Badge label="Enquêteur Terrain" bg={C.blueLight} color={C.blue} />
      </div>
    </Card>

    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: "16px 0 8px" }}>Statistiques globales</div>
    {[
      { label: "Missions effectuées", val: data.missions.length, icon: "📋" },
      { label: "Total perçu", val: fmt(data.paiements.reduce((s, p) => s + p.montant, 0)), icon: "💰" },
      { label: "Total dépenses", val: fmt(data.depenses.reduce((s, d) => s + d.montant, 0)), icon: "🧾" },
    ].map(s => (
      <Card key={s.label} style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: C.muted }}>{s.label}</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{s.val}</span>
        </div>
      </Card>
    ))}

    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: "16px 0 8px" }}>Fonctionnalités Pro</div>
    <LockedCard title="Export PDF" icon="📄" />
    <LockedCard title="Rapports annuels" icon="📊" />

    <div style={{ marginTop: 16 }}>
      <Btn label="Se déconnecter" full outline color={C.red} onClick={onLogout} />
    </div>
    <div style={{ height: 24 }} />
  </div>
);

// ─── BOTTOM NAV ──────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "🏠", label: "Accueil" },
  { id: "missions", icon: "📋", label: "Missions" },
  { id: "depenses", icon: "🧾", label: "Dépenses" },
  { id: "profil", icon: "👤", label: "Profil" },
];

const BottomNav = ({ active, nav }) => (
  <div style={{
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 430,
    background: "#fff", borderTop: `1px solid ${C.border}`,
    display: "flex", zIndex: 100,
    boxShadow: "0 -4px 20px rgba(0,0,0,.08)",
  }}>
    {NAV_ITEMS.map(item => (
      <button key={item.id} onClick={() => nav(item.id)} style={{
        flex: 1, border: "none", background: "transparent", padding: "10px 0 14px",
        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      }}>
        <span style={{ fontSize: 22 }}>{item.icon}</span>
        <span style={{ fontSize: 10, fontWeight: active === item.id ? 800 : 500, color: active === item.id ? C.blue : C.muted }}>
          {item.label}
        </span>
        {active === item.id && <div style={{ width: 20, height: 3, borderRadius: 99, background: C.blue, marginTop: 1 }} />}
      </button>
    ))}
  </div>
);

// ─── APP ─────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [data, setData] = useState(() => load("eq_data", MOCK));

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `* { -webkit-tap-highlight-color: transparent; } body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; }`;
    document.head.appendChild(style);
  }, []);

  const SCREENS = {
    dashboard: <DashboardScreen data={data} nav={setScreen} />,
    missions: <MissionsScreen data={data} setData={setData} />,
    depenses: <DepensesScreen data={data} setData={setData} />,
    paiements: <PaiementsScreen data={data} />,
    profil: <ProfilScreen data={data} onLogout={() => setLoggedIn(false)} />,
  };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ paddingBottom: 80, overflowY: "auto", minHeight: "100vh" }}>
        {SCREENS[screen] || SCREENS.dashboard}
      </div>
      <BottomNav active={screen} nav={setScreen} />
    </div>
  );
}
