import { useEffect, useRef, useState } from "react";

const UFC_API = (import.meta.env.VITE_UFC_API || "https://vibrant-healing-ufc-api-production.up.railway.app").replace(/\/$/, "");
const MONO = `"IBM Plex Mono","Space Mono",Menlo,monospace`;
const SANS = `"DM Sans",ui-sans-serif,system-ui,sans-serif`;
const SERIF = `"Instrument Serif",Georgia,"Times New Roman",serif`;

/* Portfolio theme — joshabrams.dev inspired */
const T = {
  bg: "#030306",
  fg: "#e0ddd5",
  muted: "rgba(224,221,213,0.35)",
  dim: "rgba(224,221,213,0.22)",
  faint: "rgba(224,221,213,0.06)",
  border: "rgba(224,221,213,0.06)",
  borderHover: "rgba(224,221,213,0.15)",
  gold: "#c9a96e",
  live: "#34d399",
  nav: "rgba(9,9,11,0.9)",
  // legacy aliases used by older helpers
  surf: "#11121a",
  bd: "rgba(224,221,213,0.08)",
  bdHi: "rgba(224,221,213,0.15)",
  text: "#e0ddd5",
  green: "#34d399",
  red: "#ff3b5c",
  blue: "#60a5fa",
  yellow: "#fbbf24",
  purple: "#a78bfa",
};

/* octagon.sys UFC theme */
const UF = {
  bg: "#0a0b10",
  surface: "#11121a",
  elevated: "#1a1b25",
  fg: "#dfe1e8",
  muted: "#6a6e80",
  dim: "#33374a",
  border: "rgba(255,255,255,0.05)",
  borderB: "rgba(255,255,255,0.1)",
  cyan: "#00e5ff",
  gold: "#d4a853",
  green: "#00e676",
  red: "#ff3b5c",
  amber: "#ffab00",
  purple: "#b388ff",
};

const UF_LIGHT = {
  bg: "#f5f3f0",
  surface: "#ffffff",
  elevated: "#f0ede8",
  fg: "#1a1a1a",
  muted: "#6b6b6b",
  dim: "#a0a0a0",
  border: "rgba(0,0,0,0.08)",
  borderB: "rgba(0,0,0,0.15)",
  cyan: "#0077b6",
  gold: "#996515",
  green: "#059669",
  red: "#dc2626",
  amber: "#d97706",
  purple: "#7c3aed",
};

const CONTENT = {
  name: "Kyle Suda",
  first: "Kyle",
  last: "Suda",
  monogram: "KS",
  tagline: "Building secure apps and prediction systems through hands-on labs, full-stack projects, and real-world security practice.",
  role: "cybersecurity · full-stack · ml",
  about: [
    "Focused on cybersecurity and full-stack development. I build practical projects while studying security fundamentals, networking, and secure software design.",
    "Especially interested in defensive security, detection engineering, and systems that are secure by design. I also build ML-powered prediction engines.",
  ],
  skills: {
    lang: ["Python", "JavaScript", "TypeScript", "SQL"],
    ml: ["XGBoost", "LightGBM", "Elo Systems", "Feature Engineering"],
    security: ["Network Fundamentals", "IDS/IPS", "Wireshark", "Snort"],
    web: ["React", "Node.js", "Express", "REST APIs"],
    infra: ["Docker", "Railway", "Vercel", "Git"],
  },
  projects: [
    {
      id: "ufc",
      name: "fight-prediction-engine",
      live: true,
      blurb: "ML model predicting UFC fight outcomes. XGBoost + LightGBM stacking ensemble, incremental Elo ratings, strength-of-schedule weighting, Bayesian stat smoothing, and value-bet detection vs Vegas odds.",
      stack: ["Python", "XGBoost", "LightGBM", "Flask", "React"],
      page: "ufc",
    },
    {
      id: "ops",
      name: "user-ops-suite",
      live: false,
      status: "IN-PROGRESS",
      blurb: "Full-stack user dashboard with search, insights, and activity views. List/search/sort/pagination with a clean UI shell and multiple analytics pages.",
      stack: ["React", "Node.js", "Prisma", "PostgreSQL"],
      github: "https://github.com/kyle-suda",
    },
    {
      id: "sec",
      name: "security-lab-notes",
      live: false,
      blurb: "Curated notes from networking and security labs: TCP analysis, HTTP traces, IDS rules, and detection thinking. Clear, repeatable documentation.",
      stack: ["Wireshark", "Snort", "Linux"],
    },
  ],
  experience: [
    {
      role: "Student — Cybersecurity + CS",
      org: "University of South Florida",
      timeframe: "2024 – Present",
      points: [
        "Building full-stack apps and security labs to strengthen fundamentals",
        "Practicing network analysis, IDS concepts, and secure development",
      ],
    },
    {
      role: "Independent Projects",
      org: "Personal Portfolio",
      timeframe: "Ongoing",
      points: [
        "Developing projects combining security and usability",
        "Iterating with feedback, focusing on measurable outcomes",
      ],
    },
  ],
  education: [
    {
      school: "University of South Florida",
      program: "Cybersecurity / CS Coursework",
      timeframe: "In progress",
    },
  ],
  contact: {
    email: "kylesuda@example.com",
    linkedin: "https://linkedin.com/in/kylesuda",
    github: "https://github.com/kyle-suda",
  },
};

const WEIGHT_CLASSES = [
  "Heavyweight", "Light Heavyweight", "Middleweight", "Welterweight",
  "Lightweight", "Featherweight", "Bantamweight", "Flyweight",
  "Women's Featherweight", "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
];

function useWindowSize() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}


/* ── Shared primitives ───────────────────────────────────────────────────── */
function toAmericanOdds(prob) {
  const p = Math.max(0.01, Math.min(0.99, prob));
  if (p >= 0.5) return Math.round(-(p / (1 - p)) * 100);
  return Math.round(((1 - p) / p) * 100);
}
function fmtOdds(prob) {
  const o = toAmericanOdds(prob);
  return o > 0 ? `+${o}` : `${o}`;
}

function lastName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || full || "";
}

function confidenceLevel(pct) {
  if (pct >= 65) return "high";
  if (pct >= 55) return "medium";
  return "low";
}

/* ── Fight helpers ─────────────────────────────────────────────────────────── */
function fightPick(fight) {
  if (!fight || fight.error) return null;
  const rPct = fight.red_win_probability ?? 50;
  const bPct = fight.blue_win_probability ?? 50;
  const winRed = fight.winner
    ? fight.winner === fight.red_fighter
    : rPct >= bPct;
  const top = winRed
    ? { name: fight.red_fighter, pct: rPct }
    : { name: fight.blue_fighter, pct: bPct };
  const bot = winRed
    ? { name: fight.blue_fighter, pct: bPct }
    : { name: fight.red_fighter, pct: rPct };
  return {
    top,
    bot,
    conf: confidenceLevel(top.pct),
    method: fight.predicted_method || null,
    round: fight.predicted_round || null,
    weight: fight.weight_class || "",
    key: `${fight.red_fighter}|${fight.blue_fighter}`,
  };
}

function confStyle(conf, C) {
  if (conf === "high") return { background: `${C.green}22`, color: C.green };
  if (conf === "medium") return { background: "rgba(255,171,0,0.15)", color: C.amber };
  return { background: `${C.dim}33`, color: C.muted };
}

function buildBetSlip(fights) {
  const plays = [];
  for (const fight of fights || []) {
    const pick = fightPick(fight);
    if (!pick || pick.conf === "low") continue;
    const units = pick.conf === "high" ? (pick.top.pct >= 70 ? 2 : 1.5) : 1;
    const eloEdge = (fight.r_elo && fight.b_elo)
      ? Math.abs(Number(fight.r_elo) - Number(fight.b_elo))
      : null;
    const reasonBits = [
      `Model gives ${pick.top.name} a ${pick.top.pct.toFixed(1)}% win probability${pick.method ? ` with ${pick.method} as the likeliest finish` : ""}.`,
      eloEdge != null ? `Elo gap of ${eloEdge.toFixed(0)} points supports the lean.` : null,
      pick.conf === "high"
        ? "Confidence is high enough for a sized single."
        : "Medium confidence — sized conservatively.",
    ].filter(Boolean);
    plays.push({
      key: pick.key,
      fighter: pick.top.name,
      last: lastName(pick.top.name),
      pct: pick.top.pct,
      odds: fmtOdds(pick.top.pct / 100),
      conf: pick.conf,
      method: pick.method,
      units,
      weight: pick.weight,
      reason: reasonBits.join(" "),
      fight,
    });
  }
  plays.sort((a, b) => b.pct - a.pct || b.units - a.units);
  return plays.slice(0, 8);
}

function eventTitleOf(data) {
  if (!data?.event_name) return "Upcoming UFC Event";
  return /ufc/i.test(data.event_name) ? data.event_name : `UFC: ${data.event_name}`;
}

/* ── Fight row (sidebar compact) ─────────────────────────────────────────── */
function FightRow({ fight, theme, idx, selected, onSelect }) {
  const C = theme;
  const pick = fightPick(fight);
  if (!pick) {
    return (
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontFamily: MONO }}>
        {fight.red_fighter} vs {fight.blue_fighter} — {fight.error}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="fight-row"
      onClick={() => onSelect?.(fight)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: selected ? C.elevated : "transparent",
        border: "none",
        borderBottom: `1px solid ${C.border}`,
        borderLeft: selected ? `2px solid ${C.cyan}` : "2px solid transparent",
        cursor: onSelect ? "pointer" : "default",
        padding: 0,
        animation: `fd 180ms ease ${idx * 24}ms both`,
      }}
    >
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: C.muted, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pick.top.name}
              </span>
            </div>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: MONO, flexShrink: 0 }}>{fmtOdds(pick.top.pct / 100)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
              <div style={{ width: 6, height: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.fg, opacity: 0.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pick.bot.name}
              </span>
            </div>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: MONO, flexShrink: 0 }}>{fmtOdds(pick.bot.pct / 100)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: C.muted, color: "#fff", fontFamily: MONO }}>
            {lastName(pick.top.name)}
          </span>
          <span style={{ fontSize: 10, color: C.cyan, fontFamily: MONO }}>{pick.top.pct.toFixed(1)}%</span>
          {pick.method && <span style={{ fontSize: 8, fontWeight: 500, color: C.purple }}>{pick.method}</span>}
          <span style={{ fontSize: 7, fontWeight: 700, padding: "2px 4px", borderRadius: 4, ...confStyle(pick.conf, C) }}>{pick.conf}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Fighter autocomplete ────────────────────────────────────────────────── */
function FighterSearch({ value, onChange, placeholder, accent, theme }) {
  const C = theme || UF;
  const [query, setQuery] = useState(value || "");
  const [suggs, setSuggs] = useState([]);
  const [open,  setOpen]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const timer = useRef(null);
  const wrap  = useRef(null);

  useEffect(() => {
    if (!query.trim() || query === value) { setSuggs([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`${UFC_API}/fighters?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setSuggs(d.fighters || []);
        setOpen(true);
      } catch { setSuggs([]); } finally { setBusy(false); }
    }, 220);
  }, [query]);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick  = (n) => { setQuery(n); setSuggs([]); setOpen(false); onChange(n); };
  const clear = ()  => { setQuery(""); setSuggs([]); setOpen(false); onChange(""); };

  const base = {
    width: "100%", padding: "10px 14px", borderRadius: 6,
    border: `1px solid ${accent ? accent + "44" : C.borderB}`, background: C.surface,
    color: C.fg, outline: "none", fontFamily: SANS, fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <input
        style={base}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggs.length && setOpen(true)}
        autoComplete="off"
      />
      {(busy || query) && (
        <button type="button" onClick={clear} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontFamily: MONO, fontSize: 11, padding: 2 }}>
          {busy ? "···" : "×"}
        </button>
      )}
      {open && suggs.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 60, top: "calc(100% + 4px)", left: 0, right: 0,
          background: C.elevated, border: `1px solid ${C.borderB}`, borderRadius: 6,
          maxHeight: 220, overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
        }}>
          {suggs.slice(0, 20).map((n) => (
            <div key={n} onClick={() => pick(n)}
              style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, color: C.fg, borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, theme }) {
  const C = theme;
  return (
    <div style={{
      padding: "10px 12px 6px",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: C.cyan,
      fontFamily: MONO,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {children}
    </div>
  );
}

function BetSlip({ plays, theme, eventTitle }) {
  const C = theme;
  if (!plays.length) {
    return (
      <div style={{
        border: `1px solid ${C.borderB}`, borderRadius: 8, padding: 20,
        color: C.muted, fontFamily: MONO, fontSize: 12,
      }}>
        No medium/high-confidence singles on this card yet.
      </div>
    );
  }

  return (
    <div style={{
      border: `1px solid ${C.cyan}33`,
      borderRadius: 10,
      background: `${C.surface}`,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.cyan, fontFamily: MONO, fontSize: 12, letterSpacing: 1, fontWeight: 700 }}>
          <span>$</span> BET SLIP
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{plays.length} plays</span>
      </div>

      <p style={{ margin: 0, padding: "14px 18px", fontSize: 13, lineHeight: 1.65, color: C.muted, borderBottom: `1px solid ${C.border}` }}>
        Model-built slip for <span style={{ color: C.fg }}>{eventTitle}</span>. Plays are singles sized by win probability —
        higher confidence gets more units. Odds shown are model-implied American prices.
      </p>

      <div style={{ padding: "12px 18px 6px", fontFamily: MONO, fontSize: 10, letterSpacing: 1.2, color: C.cyan }}>
        SINGLES
      </div>

      <div style={{ display: "grid", gap: 10, padding: "6px 14px 16px" }}>
        {plays.map((p) => (
          <div key={p.key} style={{
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "14px 14px 12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "3px 6px", borderRadius: 4, letterSpacing: 0.6, textTransform: "uppercase", ...confStyle(p.conf, C) }}>
                  {p.conf}
                </span>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "3px 6px", borderRadius: 4, color: C.muted, border: `1px solid ${C.border}`, fontFamily: MONO }}>
                  SINGLE
                </span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.fg, lineHeight: 1 }}>{p.units}u</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.fg, marginBottom: 8 }}>
              {p.fighter} ML
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: MONO, fontSize: 11, color: C.cyan,
              background: `${C.cyan}14`, border: `1px solid ${C.cyan}33`,
              borderRadius: 999, padding: "4px 10px", marginBottom: 10,
            }}>
              {p.last} ML {p.odds}
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.muted }}>
              {p.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FightDetail({ fight, theme }) {
  const C = theme;
  const pick = fightPick(fight);
  if (!pick) return null;
  const mProbs = fight.method_probs || {};

  return (
    <div style={{
      border: `1px solid ${C.borderB}`, borderRadius: 10, padding: 20, background: C.surface,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.cyan, letterSpacing: 1, marginBottom: 10 }}>
        SELECTED FIGHT{pick.weight ? ` · ${pick.weight}` : ""}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.fg, marginBottom: 6 }}>
        {pick.top.name} <span style={{ color: C.dim, fontWeight: 500 }}>vs</span> {pick.bot.name}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 18, color: C.cyan, fontWeight: 700 }}>{pick.top.pct.toFixed(1)}%</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{fmtOdds(pick.top.pct / 100)}</span>
        {pick.method && <span style={{ color: C.purple, fontSize: 13 }}>{pick.method}{pick.round ? ` R${pick.round}` : ""}</span>}
        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 6px", borderRadius: 4, textTransform: "uppercase", ...confStyle(pick.conf, C) }}>{pick.conf}</span>
      </div>
      <div style={{ height: 4, background: C.elevated, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${pick.top.pct}%`, height: "100%", background: C.cyan }} />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: MONO, fontSize: 11, color: C.muted }}>
        {["KO/TKO", "Decision", "Submission"].map((m) => {
          const pct = mProbs[m];
          if (pct == null || pct < 1) return null;
          return <span key={m}><span style={{ color: C.purple }}>{m}</span> {Number(pct).toFixed(0)}%</span>;
        })}
        {fight.r_elo != null && <span>elo {fight.r_elo} / {fight.b_elo}</span>}
      </div>
    </div>
  );
}

/* ── Upcoming card workspace (sidebar + detail) ──────────────────────────── */
function UpcomingCard({ theme, isMobile }) {
  const C = theme;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${UFC_API}/next-card`, { signal: AbortSignal.timeout(90000) });
      if (!r.ok) {
        let detail = `HTTP ${r.status}`;
        try {
          const body = await r.json();
          if (body?.message || body?.error) detail = body.message || body.error;
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setData(d);
      setSelectedKey(null);
    } catch (e) {
      const msg = e.name === "TimeoutError" || e.name === "AbortError"
        ? "Request timed out — the prediction API may be cold-starting. Try again."
        : (e.message || "Could not load upcoming card");
      setErr(msg);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, fontFamily: MONO, fontSize: 12, color: C.muted }}>
        <span><span className="breathe" style={{ color: C.cyan }}>●</span> loading card · running predictions…</span>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.red, marginBottom: 14 }}>error: {err}</div>
          <button type="button" onClick={load} style={{
            fontFamily: MONO, fontSize: 12, color: C.muted, background: "none",
            border: `1px solid ${C.borderB}`, padding: "10px 16px", borderRadius: 6, cursor: "pointer",
          }}>↻ retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const fights = data.predictions || [];
  const mainN = fights.length > 5 ? 5 : Math.max(1, fights.length);
  const main = fights.slice(0, mainN);
  const prelims = fights.slice(mainN);
  const title = eventTitleOf(data);
  const plays = buildBetSlip(fights);
  const selected = fights.find((f) => `${f.red_fighter}|${f.blue_fighter}` === selectedKey) || null;

  const sidebar = (
    <aside style={{
      width: isMobile ? "100%" : 300,
      flexShrink: 0,
      borderRight: isMobile ? "none" : `1px solid ${C.border}`,
      borderBottom: isMobile ? `1px solid ${C.border}` : "none",
      display: "flex",
      flexDirection: "column",
      maxHeight: isMobile ? "none" : "100%",
      background: C.bg,
    }}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.cyan, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </div>
            <div style={{ fontSize: 10, marginTop: 3, color: C.dim, fontFamily: MONO }}>
              {[data.event_date?.split("/")?.[0]?.trim() || data.event_date, fights.length && `${fights.length} fights`].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button type="button" onClick={load} style={{
            fontFamily: MONO, fontSize: 10, color: C.muted, background: "none",
            border: `1px solid ${C.border}`, padding: "4px 8px", borderRadius: 4, cursor: "pointer",
          }}>↻</button>
        </div>
      </div>

      <div style={{
        padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        borderBottom: `1px solid ${C.border}`, fontFamily: MONO, fontSize: 10,
      }}>
        <span style={{ color: C.dim }}>Model</span>
        <span style={{ color: C.green }}>65.6%</span>
        <span style={{ color: C.dim }}>cv</span>
        <span style={{ color: C.dim }}>·</span>
        <span style={{ color: C.muted }}>7,190 fights</span>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {main.length > 0 && (
          <>
            <SectionLabel theme={C}>Main Card</SectionLabel>
            {main.map((f, i) => {
              const key = `${f.red_fighter}|${f.blue_fighter}`;
              return (
                <FightRow
                  key={key}
                  fight={f}
                  idx={i}
                  theme={C}
                  selected={selectedKey === key}
                  onSelect={(fight) => setSelectedKey(`${fight.red_fighter}|${fight.blue_fighter}`)}
                />
              );
            })}
          </>
        )}
        {prelims.length > 0 && (
          <>
            <SectionLabel theme={C}>Prelims</SectionLabel>
            {prelims.map((f, i) => {
              const key = `${f.red_fighter}|${f.blue_fighter}`;
              return (
                <FightRow
                  key={key}
                  fight={f}
                  idx={i + main.length}
                  theme={C}
                  selected={selectedKey === key}
                  onSelect={(fight) => setSelectedKey(`${fight.red_fighter}|${fight.blue_fighter}`)}
                />
              );
            })}
          </>
        )}
      </div>
    </aside>
  );

  const detail = (
    <main style={{
      flex: 1,
      minWidth: 0,
      overflowY: "auto",
      padding: isMobile ? "20px 16px 40px" : "28px 36px 48px",
      background: C.bg,
    }}>
      <h1 style={{
        margin: "0 0 10px",
        fontFamily: SERIF,
        fontSize: isMobile ? 28 : 42,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        color: C.fg,
      }}>
        {title}
      </h1>
      <div style={{
        fontFamily: MONO, fontSize: 12, color: C.muted, marginBottom: 24,
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <span>{data.event_date}</span>
        <span style={{ color: C.dim }}>·</span>
        <span>{fights.length} fights</span>
        <span style={{ color: C.dim }}>·</span>
        <span><span style={{ color: C.green }}>65.6%</span> cv</span>
        {data.location && (
          <>
            <span style={{ color: C.dim }}>·</span>
            <span style={{ color: C.dim }}>{data.location}</span>
          </>
        )}
      </div>

      <div style={{ display: "grid", gap: 18, maxWidth: 720 }}>
        {selected && <FightDetail fight={selected} theme={C} />}
        <BetSlip plays={plays} theme={C} eventTitle={title} />
      </div>
    </main>
  );

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      minHeight: 0,
      overflow: "hidden",
    }}>
      {sidebar}
      {detail}
    </div>
  );
}

/* ── Custom matchup ──────────────────────────────────────────────────────── */
function CustomMatchup({ theme, isMobile }) {
  const C = theme;
  const [rn, setRn] = useState("");
  const [bn, setBn] = useState("");
  const [wc, setWc] = useState("Lightweight");
  const [title, setTitle] = useState(false);
  const [rds, setRds] = useState(3);
  const [ro, setRo] = useState("");
  const [bo, setBo] = useState("");
  const [showOdds, setShowOdds] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);

  async function predict() {
    if (!rn.trim() || !bn.trim()) { setErr("Enter both fighter names."); return; }
    setBusy(true); setErr(null); setRes(null);
    try {
      const body = { red_name: rn.trim(), blue_name: bn.trim(), weight_class: wc, is_title_fight: title, scheduled_rounds: rds };
      if (showOdds && ro) body.red_odds = parseFloat(ro);
      if (showOdds && bo) body.blue_odds = parseFloat(bo);
      const r = await fetch(`${UFC_API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      let d = {};
      try { d = await r.json(); } catch { /* empty */ }
      if (!r.ok) throw new Error(d.error || d.message || `API error (${r.status})`);
      setRes(d);
    } catch (e) {
      setErr(e.name === "TimeoutError" || e.name === "AbortError"
        ? "Prediction timed out. Try again in a moment."
        : e.message);
    } finally { setBusy(false); }
  }

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 6,
    border: `1px solid ${C.borderB}`, background: C.surface, color: C.fg,
    outline: "none", fontFamily: SANS, fontSize: 15, boxSizing: "border-box",
  };
  const sel = { ...inp, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
  const lbl = { fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 };

  const fightCard = res ? {
    red_fighter: res.red_fighter, blue_fighter: res.blue_fighter,
    winner: res.winner, red_win_probability: res.red_win_probability, blue_win_probability: res.blue_win_probability,
    predicted_method: res.predicted_method, predicted_round: res.predicted_round,
    method_probs: res.method_probs, r_elo: res.r_elo, b_elo: res.b_elo,
    weight_class: wc, is_main_event: false, is_title_fight: title,
  } : null;

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: isMobile ? 16 : 28,
    }}>
      <div style={{ display: "grid", gap: 16, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: C.red }}>red</label>
            <FighterSearch value={rn} onChange={setRn} placeholder="Search fighter…" accent={C.red} theme={C} />
          </div>
          <div>
            <label style={{ ...lbl, color: C.cyan }}>blue</label>
            <FighterSearch value={bn} onChange={setBn} placeholder="Search fighter…" accent={C.cyan} theme={C} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
            <label style={lbl}>weight</label>
            <select style={sel} value={wc} onChange={(e) => setWc(e.target.value)}>
              {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>rounds</label>
            <select style={sel} value={rds} onChange={(e) => setRds(Number(e.target.value))}>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <label style={lbl}>title</label>
            <button type="button" onClick={() => setTitle((v) => !v)} style={{ ...inp, cursor: "pointer", color: title ? C.green : C.dim, textAlign: "left" }}>{title ? "yes" : "no"}</button>
          </div>
          <div>
            <label style={lbl}>vegas odds</label>
            <button type="button" onClick={() => setShowOdds((v) => !v)} style={{ ...inp, cursor: "pointer", color: showOdds ? C.green : C.dim, textAlign: "left" }}>{showOdds ? "on" : "off"}</button>
          </div>
        </div>

        {showOdds && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <input style={{ ...inp, borderColor: `${C.red}55` }} placeholder="red -200" value={ro} onChange={(e) => setRo(e.target.value)} />
            <input style={{ ...inp, borderColor: `${C.cyan}55` }} placeholder="blue +150" value={bo} onChange={(e) => setBo(e.target.value)} />
          </div>
        )}

        <button type="button" disabled={busy} onClick={predict} style={{
          padding: "14px 16px", borderRadius: 6, border: `1px solid ${busy ? C.border : C.cyan}55`,
          background: busy ? "transparent" : `${C.cyan}12`, color: busy ? C.dim : C.cyan,
          fontFamily: MONO, fontSize: 13, cursor: busy ? "default" : "pointer",
        }}>
          {busy ? "analyzing…" : "→ predict fight"}
        </button>

        {err && <div style={{ fontFamily: MONO, fontSize: 12, color: C.red }}>error: {err}</div>}

        {fightCard && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <FightRow fight={fightCard} idx={0} theme={C} />
            {res.value && res.value.r_vegas_pct > 0 && (
              <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.cyan, marginBottom: 10, letterSpacing: 1 }}>VALUE</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  {[
                    { label: res.red_fighter, model: res.value.r_model_pct, vegas: res.value.r_vegas_pct, edge: res.value.r_edge, kelly: res.value.r_kelly, color: C.red },
                    { label: res.blue_fighter, model: res.value.b_model_pct, vegas: res.value.b_vegas_pct, edge: res.value.b_edge, kelly: res.value.b_kelly, color: C.cyan },
                  ].map((f) => (
                    <div key={f.label}>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: f.color, marginBottom: 8 }}>{lastName(f.label)}</div>
                      <div style={{ display: "grid", gap: 5, fontFamily: MONO, fontSize: 12 }}>
                        <Row label="model" val={fmtOdds(f.model / 100)} valColor={f.color} dim={C.dim} fg={C.fg} />
                        <Row label="book" val={fmtOdds(f.vegas / 100)} dim={C.dim} fg={C.fg} />
                        <Row label="edge" val={`${f.edge >= 0 ? "+" : ""}${f.edge?.toFixed(1)}%`} valColor={f.edge >= 8 ? C.green : f.edge >= 0 ? C.fg : C.red} dim={C.dim} fg={C.fg} />
                        {f.kelly > 0 && <Row label="kelly ¼" val={`${(f.kelly * 0.25).toFixed(1)}%`} valColor={C.green} dim={C.dim} fg={C.fg} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, val, valColor, dim, fg }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: dim || T.dim }}>{label}</span>
      <span style={{ color: valColor || fg || T.text }}>{val}</span>
    </div>
  );
}

/* ── UFC Page (octagon.sys shell) ────────────────────────────────────────── */
function UFCPage({ isMobile, onBack }) {
  const [tab, setTab] = useState("upcoming");
  const [light, setLight] = useState(false);
  const C = light ? UF_LIGHT : UF;

  return (
    <div
      className="uf uf-wrap"
      data-theme={light ? "light" : "dark"}
      style={{
        height: "100dvh",
        background: C.bg,
        color: C.fg,
        fontFamily: SANS,
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        .uf-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          z-index: 0;
        }
        .fight-row { transition: background 0.15s ease; }
        .fight-row:hover { background: ${C.elevated} !important; }
        @keyframes uf-breathe { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
        .breathe { animation: uf-breathe 2.4s ease-in-out infinite; }
        @keyframes fd { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
      }}>
        {/* Top chrome */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "10px 14px" : "10px 16px",
          borderBottom: `1px solid ${C.border}`,
          gap: 8,
          background: `${C.bg}f2`,
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}>
          <button type="button" onClick={onBack} style={{
            background: "none", border: "none", color: C.muted, fontSize: 13,
            fontFamily: SANS, padding: "4px 2px", cursor: "pointer",
          }}>
            ← back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => setLight((v) => !v)} title="Toggle theme" style={{
              background: "none", border: "none", color: C.muted, fontSize: 15, cursor: "pointer", padding: 4,
            }}>
              {light ? "☀" : "☽"}
            </button>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
              background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.gold}33`,
              fontFamily: MONO,
            }}>
              Model
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1, color: C.cyan,
              opacity: 0.55, fontFamily: MONO,
            }}>
              octagon.sys
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 8px",
          background: C.bg,
          flexShrink: 0,
        }}>
          {[["upcoming", "card"], ["custom", "matchup"]].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tab === id ? C.cyan : C.muted,
                padding: "11px 14px",
                borderBottom: `2px solid ${tab === id ? C.cyan : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {tab === "upcoming"
          ? <UpcomingCard theme={C} isMobile={isMobile} />
          : <CustomMatchup theme={C} isMobile={isMobile} />}
      </div>
    </div>
  );
}


function SectionHead({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
        color: T.dim, flexShrink: 0,
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: T.faint }} />
    </div>
  );
}

function PixelIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" style={{ imageRendering: "pixelated", color: "rgba(224,221,213,0.2)" }} aria-hidden>
      <rect x="3" y="2" width="4" height="2" fill="currentColor" />
      <rect x="9" y="2" width="4" height="2" fill="currentColor" />
      <rect x="2" y="4" width="5" height="2" fill="currentColor" opacity="0.8" />
      <rect x="9" y="4" width="5" height="2" fill="currentColor" opacity="0.8" />
      <rect x="4" y="6" width="8" height="2" fill="currentColor" />
      <rect x="5" y="8" width="6" height="2" fill="currentColor" opacity="0.8" />
      <rect x="6" y="10" width="4" height="2" fill="currentColor" opacity="0.6" />
      <rect x="5" y="12" width="2" height="2" fill="currentColor" opacity="0.4" />
      <rect x="9" y="12" width="2" height="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function ProjectCard({ project, onOpen, isMobile }) {
  const status = project.live ? "LIVE" : (project.status || null);
  const interactive = Boolean(project.page || project.github);

  function activate() {
    if (project.page) onOpen(project.page);
    else if (project.github) window.open(project.github, "_blank", "noreferrer");
  }

  return (
    <button
      type="button"
      onClick={interactive ? activate : undefined}
      className="proj-card"
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: `1px solid ${T.border}`,
        borderRadius: 2,
        padding: isMobile ? 20 : 24,
        cursor: interactive ? "pointer" : "default",
        transition: "border-color 300ms, background 300ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 0 : 24 }}>
        {!isMobile && (
          <div style={{ marginTop: 4, flexShrink: 0 }}><PixelIcon /></div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <h3 className="proj-title" style={{
              margin: 0, fontSize: 15, fontWeight: 600, color: T.fg, transition: "color 300ms",
            }}>
              {project.id} @ {project.name}
            </h3>
            {status && (
              <span style={{
                fontFamily: MONO, fontSize: 8, padding: "2px 6px", letterSpacing: 1,
                color: project.live ? T.live : T.gold,
                background: project.live ? "rgba(52,211,153,0.06)" : "rgba(201,169,110,0.08)",
                border: `1px solid ${project.live ? "rgba(52,211,153,0.15)" : "rgba(201,169,110,0.2)"}`,
                borderRadius: 1,
              }}>
                {status}
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.65, color: T.muted }}>
            {project.blurb}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {project.stack.map((t) => (
              <span key={t} style={{
                fontFamily: MONO, fontSize: 10, padding: "2px 8px",
                color: T.dim, border: `1px solid ${T.faint}`, borderRadius: 1,
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function PortfolioHome({ isMobile, onOpenUfc }) {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.fg, fontFamily: SANS, position: "relative" }}>
      <style>{`
        .site-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(224,221,213,0.035) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
          z-index: 0;
        }
        .proj-card:hover {
          border-color: ${T.borderHover} !important;
          background: rgba(224,221,213,0.02) !important;
        }
        .proj-card:hover .proj-title { color: ${T.gold} !important; }
        .nav-link:hover { color: ${T.fg} !important; }
        a.foot-link:hover { color: ${T.fg} !important; }
        @keyframes fd { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div className="site-wrap" style={{ position: "relative", zIndex: 1 }}>
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "0 24px" : "0 40px", height: 56,
          background: T.nav, backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(224,221,213,0.04)",
        }}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, letterSpacing: "-0.02em", color: T.fg, padding: 0,
          }}>
            {CONTENT.monogram}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: MONO, fontSize: 11, color: "rgba(224,221,213,0.3)" }}>
            <button type="button" className="nav-link" onClick={() => scrollTo("work")} style={{
              background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", padding: 0, transition: "color 300ms",
            }}>work</button>
            <button type="button" className="nav-link" onClick={() => scrollTo("about")} style={{
              background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", padding: 0, transition: "color 300ms",
            }}>about</button>
          </div>
        </nav>

        <main style={{
          maxWidth: 920, margin: "0 auto",
          padding: isMobile ? "120px 24px 80px" : "140px 40px 100px",
          animation: "fd 280ms ease both",
        }}>
          {/* Hero */}
          <section style={{ marginBottom: isMobile ? 72 : 96 }}>
            <h1 style={{
              margin: "0 0 32px",
              fontSize: "clamp(3rem, 8vw, 6.5rem)",
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: T.fg,
            }}>
              {CONTENT.first}<br />
              <span style={{ color: "rgba(224,221,213,0.4)" }}>{CONTENT.last}</span>
            </h1>
            <p style={{
              margin: "0 0 14px", maxWidth: 440,
              fontSize: isMobile ? 15 : 17, lineHeight: 1.55, color: T.muted,
            }}>
              {CONTENT.tagline}
            </p>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 12, color: T.dim }}>
              {CONTENT.role}
            </p>
          </section>

          {/* Projects */}
          <section id="work" style={{ marginBottom: isMobile ? 72 : 96, scrollMarginTop: 80 }}>
            <SectionHead>Projects</SectionHead>
            <div style={{ display: "grid", gap: 12 }}>
              {CONTENT.projects.map((p) => (
                <ProjectCard key={p.id} project={p} isMobile={isMobile} onOpen={(page) => page === "ufc" && onOpenUfc()} />
              ))}
            </div>
          </section>

          {/* About */}
          <section id="about" style={{ marginBottom: isMobile ? 72 : 96, scrollMarginTop: 80 }}>
            <SectionHead>About</SectionHead>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
              gap: isMobile ? 36 : 64,
            }}>
              <div>
                {CONTENT.about.map((p, i) => (
                  <p key={i} style={{ margin: i ? "14px 0 0" : 0, fontSize: 14, lineHeight: 1.75, color: T.muted }}>
                    {p}
                  </p>
                ))}
              </div>
              <div style={{ display: "grid", gap: 20 }}>
                {Object.entries(CONTENT.skills).map(([cat, items]) => (
                  <div key={cat}>
                    <div style={{
                      fontFamily: MONO, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                      color: T.dim, marginBottom: 8,
                    }}>
                      {cat}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {items.map((item) => (
                        <span key={item} style={{ fontSize: 12, color: T.muted }}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Experience */}
          <section style={{ marginBottom: isMobile ? 72 : 96 }}>
            <SectionHead>Experience</SectionHead>
            <div style={{ display: "grid", gap: 28 }}>
              {CONTENT.experience.map((e) => (
                <div key={e.role}>
                  <div style={{
                    display: "flex", flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between", gap: isMobile ? 4 : 16, marginBottom: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{e.role}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 3 }}>{e.org}</div>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, flexShrink: 0 }}>{e.timeframe}</div>
                  </div>
                  {e.points.map((pt) => (
                    <p key={pt} style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: T.muted }}>{pt}</p>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section style={{ marginBottom: isMobile ? 56 : 72 }}>
            <SectionHead>Education</SectionHead>
            {CONTENT.education.map((ed) => (
              <div key={ed.school} style={{
                display: "flex", flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between", gap: 6,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{ed.program}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 3 }}>{ed.school}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{ed.timeframe}</div>
              </div>
            ))}
          </section>

          <footer style={{
            display: "flex", flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between", gap: 16,
            paddingTop: 28, borderTop: `1px solid ${T.faint}`,
            fontFamily: MONO, fontSize: 11, color: T.dim,
          }}>
            <span>{CONTENT.name.toLowerCase()} © {new Date().getFullYear()}</span>
            <div style={{ display: "flex", gap: 16 }}>
              <a className="foot-link" href={`mailto:${CONTENT.contact.email}`} style={{ color: T.dim, textDecoration: "none", transition: "color 300ms" }}>email</a>
              <a className="foot-link" href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={{ color: T.dim, textDecoration: "none", transition: "color 300ms" }}>github</a>
              <a className="foot-link" href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={{ color: T.dim, textDecoration: "none", transition: "color 300ms" }}>linkedin</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const W = useWindowSize();
  const isMobile = W < 800;

  function go(p) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  return (
    <div style={{ minHeight: "100dvh", background: page === "ufc" ? UF.bg : T.bg }}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: ${T.bg}; }
        button:not([disabled]):hover { opacity: 0.9; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.35); border-radius: 99px; }
        ::placeholder { color: rgba(224,221,213,0.25); }
        select option { background: #11121a; color: #e0ddd5; }
      `}</style>

      {page === "ufc"
        ? <UFCPage isMobile={isMobile} onBack={() => go("home")} />
        : <PortfolioHome isMobile={isMobile} onOpenUfc={() => go("ufc")} />}
    </div>
  );
}
