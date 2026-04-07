import { useEffect, useMemo, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   kylesuda.com — v3 complete redesign
   ═══════════════════════════════════════════════════════════════════════════ */

const UFC_API = "https://vibrant-healing-ufc-api-production.up.railway.app";

/* ─── Site content ──────────────────────────────────────────────────────── */
const CONTENT = {
  name: "Kyle Suda",
  title: "Cybersecurity · Full-Stack Developer · Student",
  location: "Tampa, FL",
  tagline: "I build secure, reliable apps and learn fast through hands-on labs, projects, and real-world security practice.",
  about: [
    "Focused on cybersecurity and full-stack development—building practical projects while studying security fundamentals, networking, and secure software design.",
    "I enjoy hands-on labs (Wireshark, IDS/Snort, honeypots, HTB-style environments) and turning what I learn into clean, usable tools and dashboards.",
    "Especially interested in defensive security, detection engineering, and building systems that are secure by design.",
  ],
  highlights: [
    { label: "Focus", value: "Cybersecurity + Full-Stack" },
    { label: "Strength", value: "ML + Hands-on labs" },
    { label: "Goal", value: "Security / SOC / AppSec" },
    { label: "Tech", value: "React · Node · Python · ML" },
  ],
  skills: {
    Security:      ["Network fundamentals", "IDS/IPS basics", "Threat intel", "Secure coding"],
    Development:   ["React", "Node/Express", "Prisma ORM", "REST APIs"],
    "ML / Data":   ["Python", "XGBoost", "LightGBM", "Feature Engineering", "Elo Systems"],
    Tools:         ["Wireshark", "Nmap", "Snort", "Linux CLI"],
    Workflow:      ["Git/GitHub", "Documentation", "Debugging", "Testing"],
  },
  projects: [
    {
      name: "UFC Fight Prediction Engine",
      blurb: "ML model predicting UFC outcomes at 77% winner accuracy. XGBoost + LightGBM ensembles, incremental Elo ratings, strength-of-schedule, Bayesian stat smoothing, and value-bet detection vs Vegas odds.",
      stack: ["Python", "XGBoost", "LightGBM", "Flask", "React"],
      bullets: [
        "End-to-end pipeline: data scraping → feature engineering → TimeSeriesSplit CV → stacking ensemble",
        "Incremental Elo across 7,000+ historical fights to capture fighter momentum",
        "Vig-adjusted Vegas odds comparison with Kelly criterion bet sizing",
        "Deployed as a live Flask API on Railway with a React UI on kylesuda.com",
      ],
      featured: true,
    },
    {
      name: "User Ops Suite",
      blurb: "Full-stack user dashboard with search, insights, and activity views. Built to practice API + DB wiring and UI polish.",
      stack: ["React", "Node/Express", "Prisma", "PostgreSQL"],
      bullets: [
        "List/search/sort/pagination patterns with a custom UI shell",
        "Multiple pages (Dashboard / Insights / Activity) for analytics and system visibility",
        "Clean error handling and predictable UX",
      ],
      links: [{ label: "GitHub", href: "https://github.com/kyle-suda" }],
    },
    {
      name: "Security Lab Notes",
      blurb: "Curated notes from networking and security labs: TCP analysis, HTTP traces, IDS rules, and detection thinking.",
      stack: ["Wireshark", "Snort", "Linux"],
      bullets: [
        "Packet trace analysis for RTT, throughput, and retransmissions",
        "IDS rules written and tested for detecting suspicious traffic",
        "Clear, repeatable documentation with steps and screenshots",
      ],
      links: [],
    },
  ],
  experience: [
    {
      role: "Student — Cybersecurity + CS",
      org: "University of South Florida",
      timeframe: "2024 – Present",
      points: [
        "Building full-stack apps and security labs to strengthen fundamentals",
        "Practicing network analysis, IDS concepts, and secure development habits",
        "Documenting work clearly for repeatable results",
      ],
    },
    {
      role: "Independent Projects",
      org: "Personal Portfolio",
      timeframe: "Ongoing",
      points: [
        "Developing projects combining security + usability",
        "Iterating with feedback, improving design and code quality",
        "Focusing on measurable outcomes: features shipped, bugs fixed, skills gained",
      ],
    },
  ],
  education: [
    {
      school: "University of South Florida",
      program: "Cybersecurity / Computing Coursework",
      timeframe: "In progress",
      notes: ["Networking", "Security Fundamentals", "Programming", "Databases"],
    },
  ],
  certifications: [
    { name: "SAFe Scrum Master (studying)", year: "2024–2025" },
    { name: "Cybersecurity Foundations (coursework)", year: "2025" },
  ],
  contact: {
    email: "kylesuda@example.com",
    linkedin: "https://linkedin.com/in/kylesuda",
    github: "https://github.com/kyle-suda",
    website: "https://kylesuda.com",
  },
};

const WEIGHT_CLASSES = [
  "Heavyweight", "Light Heavyweight", "Middleweight", "Welterweight",
  "Lightweight", "Featherweight", "Bantamweight", "Flyweight",
  "Women's Featherweight", "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight",
];

/* ─── Utility hooks ─────────────────────────────────────────────────────── */
function useWindowSize() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function useAnimatedBg() {
  const [t, setT] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let last = performance.now();
    const loop = (now) => {
      const dt = now - last; last = now;
      setT((x) => (x + dt * 0.000045) % 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return useMemo(() => {
    const x1 = 18 + 38 * Math.sin(t * Math.PI * 2);
    const y1 = 12 + 22 * Math.cos(t * Math.PI * 2);
    const x2 = 72 + 20 * Math.cos(t * Math.PI * 2 + 1.2);
    const y2 = 68 + 18 * Math.sin(t * Math.PI * 2 + 0.8);
    return {
      backgroundImage: `
        radial-gradient(900px 600px at ${x1}% ${y1}%, rgba(139,92,246,0.13) 0%, transparent 55%),
        radial-gradient(800px 550px at ${x2}% ${y2}%, rgba(59,130,246,0.10) 0%, transparent 55%),
        linear-gradient(160deg, #060810 0%, #080d18 55%, #060b12 100%)
      `,
    };
  }, [t]);
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function Icon({ name, size = 18, color = "currentColor" }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const M = {
    home:     <svg {...s}><path d="M3 10.5 12 3l9 7.5V21a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 21V10.5Z"/><path d="M9 22V13h6v9"/></svg>,
    code:     <svg {...s}><path d="M16 18 22 12 16 6"/><path d="M8 6 2 12l6 6"/><path d="M14 4 10 20"/></svg>,
    doc:      <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>,
    mail:     <svg {...s}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>,
    link:     <svg {...s}><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"/><path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"/></svg>,
    search:   <svg {...s}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
    x:        <svg {...s}><path d="M18 6 6 18M6 6l12 12"/></svg>,
    loader:   <svg {...s} style={{ animation: "spin 0.9s linear infinite" }}><circle cx="12" cy="12" r="9" strokeDasharray="28 28"/></svg>,
    refresh:  <svg {...s}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
    zap:      <svg {...s}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    calendar: <svg {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    map:      <svg {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    menu:     <svg {...s}><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></svg>,
    star:     <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    shield:   <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trophy:   <svg {...s}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    chevRight:<svg {...s}><path d="M9 18l6-6-6-6"/></svg>,
  };
  return M[name] || null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const MC = { "KO/TKO": "#ef4444", "Submission": "#8b5cf6", "Decision": "#3b82f6", "Other/No Contest": "#6b7280" };

function toAmericanOdds(prob) {
  const p = Math.max(0.01, Math.min(0.99, prob));
  if (p >= 0.5) return Math.round(-(p / (1 - p)) * 100);
  return Math.round(((1 - p) / p) * 100);
}
function fmtOdds(prob) {
  const o = toAmericanOdds(prob);
  return o > 0 ? `+${o}` : `${o}`;
}
function fmtOddsRaw(o) {
  const n = parseInt(o);
  if (!o || isNaN(n)) return null;
  return n > 0 ? `+${n}` : `${n}`;
}
// Strip vig from two-sided American odds, return fair implied probabilities
function vigAdjustedProbs(rOdds, bOdds) {
  function implied(o) { return o < 0 ? (-o) / (-o + 100) : 100 / (o + 100); }
  const pr = implied(rOdds), pb = implied(bOdds), tot = pr + pb;
  return { r: pr / tot, b: pb / tot };
}
// Quarter-Kelly bet size given model probability and book decimal odds
function kellyQuarter(modelProb, americanOdds) {
  const dec = americanOdds > 0 ? americanOdds / 100 + 1 : 100 / (-americanOdds) + 1;
  const k = (modelProb * dec - 1) / (dec - 1);
  return Math.max(0, k * 0.25 * 100);
}

/* ─── Compact Sportsbook-Style Fight Card ────────────────────────────────── */
function FightCard({ fight, idx, isMobile, bookR, bookB }) {
  const R = "#ef4444", B = "#3b82f6";

  if (fight.error) {
    return (
      <div style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(255,255,255,0.42)", fontSize: 13 }}>
        {fight.red_fighter} vs {fight.blue_fighter} — {fight.error}
      </div>
    );
  }

  const winRed = fight.winner === fight.red_fighter;
  const rPct = fight.red_win_probability ?? 50;
  const bPct = fight.blue_win_probability ?? 50;

  // Book odds edge (computed client-side from entered sportsbook odds)
  const hasBook = bookR && bookB && !isNaN(bookR) && !isNaN(bookB);
  let bookEdge = null;
  if (hasBook) {
    const { r: bkRProb, b: bkBProb } = vigAdjustedProbs(bookR, bookB);
    bookEdge = {
      r: (rPct / 100 - bkRProb) * 100,
      b: (bPct / 100 - bkBProb) * 100,
    };
  }
  const hasValueBet = hasBook && (bookEdge.r >= 5 || bookEdge.b >= 5);

  const methodOrder = ["KO/TKO", "Submission", "Decision", "Other/No Contest"];
  const methodProbs = fight.method_probs || {};
  const shownMethods = methodOrder.filter((m) => (methodProbs[m] ?? 0) > 1);

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: fight.is_main_event
        ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(6,8,16,0.0) 55%, rgba(59,130,246,0.06))"
        : "rgba(255,255,255,0.033)",
      border: hasValueBet
        ? "1px solid rgba(34,197,94,0.35)"
        : fight.is_main_event ? "1px solid rgba(239,68,68,0.26)" : "1px solid rgba(255,255,255,0.08)",
      animation: `fiup 360ms ease ${idx * 55}ms both`,
    }}>

      {/* ── Top bar: badges + value ── */}
      <div style={{
        padding: "8px 14px",
        background: "rgba(0,0,0,0.22)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {fight.is_main_event && <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 900, letterSpacing: 0.6, background: "linear-gradient(90deg,#ef4444,#f97316)", color: "#fff" }}>★ MAIN EVENT</span>}
          {fight.is_title_fight && <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 900, background: "linear-gradient(90deg,#f59e0b,#d97706)", color: "#fff" }}>🏆 TITLE</span>}
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)" }}>{fight.weight_class}</span>
        </div>
        {hasValueBet && (
          <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 900, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", animation: "pulse 2s ease infinite" }}>
            📈 BET RECOMMENDED
          </span>
        )}
      </div>

      {/* ── Main betting layout ── */}
      <div style={{ padding: isMobile ? "12px 14px" : "14px 18px", display: "grid", gap: 10 }}>

        {/* Fighter names row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontWeight: 1000, fontSize: isMobile ? 14 : 16, letterSpacing: -0.3, color: winRed ? R : "#e8eef6" }}>
                {fight.red_fighter}
              </span>
              {winRed && <span style={{ fontSize: 10, fontWeight: 900, color: R, background: `${R}1a`, border: `1px solid ${R}33`, padding: "1px 7px", borderRadius: 99 }}>PICK</span>}
            </div>
            {fight.r_elo && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>Elo {fight.r_elo}</div>}
          </div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>VS</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
              {!winRed && <span style={{ fontSize: 10, fontWeight: 900, color: B, background: `${B}1a`, border: `1px solid ${B}33`, padding: "1px 7px", borderRadius: 99 }}>PICK</span>}
              <span style={{ fontWeight: 1000, fontSize: isMobile ? 14 : 16, letterSpacing: -0.3, color: !winRed ? B : "#e8eef6" }}>
                {fight.blue_fighter}
              </span>
            </div>
            {fight.b_elo && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2, textAlign: "right" }}>Elo {fight.b_elo}</div>}
          </div>
        </div>

        {/* Odds comparison: MODEL vs HARDROCK */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", gap: 6 }}>
          {/* Red odds block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* MODEL */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "rgba(255,255,255,0.28)", marginBottom: 1 }}>MODEL</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 1000, color: R, letterSpacing: -1, lineHeight: 1 }}>
                {fmtOdds(rPct / 100)}
              </div>
              <div style={{ fontSize: 11, color: R, fontWeight: 700, opacity: 0.7 }}>{rPct.toFixed(1)}% win</div>
            </div>
            {/* HARDROCK */}
            {hasBook && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "rgba(255,165,0,0.7)", marginBottom: 1 }}>HARDROCK</div>
                <div style={{ fontSize: isMobile ? 18 : 21, fontWeight: 1000, color: "#fb923c", letterSpacing: -0.5, lineHeight: 1 }}>
                  {fmtOddsRaw(bookR)}
                </div>
                {bookEdge.r >= 5 && (
                  <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 900, marginTop: 2 }}>+{bookEdge.r.toFixed(1)}% edge ✓</div>
                )}
                {bookEdge.r < 0 && (
                  <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, opacity: 0.7, marginTop: 2 }}>{bookEdge.r.toFixed(1)}% overpriced</div>
                )}
              </div>
            )}
          </div>

          {/* Center probability bar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: 10, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rPct}%`, background: `linear-gradient(90deg, ${R}cc, ${R}88)`, borderRadius: "99px 0 0 99px" }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${bPct}%`, background: `linear-gradient(270deg, ${B}cc, ${B}88)`, borderRadius: "0 99px 99px 0" }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>
              {hasBook ? "MODEL PROBABILITY" : "WIN PROBABILITY"}
            </div>
          </div>

          {/* Blue odds block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            {/* MODEL */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "rgba(255,255,255,0.28)", marginBottom: 1 }}>MODEL</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 1000, color: B, letterSpacing: -1, lineHeight: 1 }}>
                {fmtOdds(bPct / 100)}
              </div>
              <div style={{ fontSize: 11, color: B, fontWeight: 700, opacity: 0.7 }}>{bPct.toFixed(1)}% win</div>
            </div>
            {/* HARDROCK */}
            {hasBook && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 4, textAlign: "right" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "rgba(255,165,0,0.7)", marginBottom: 1 }}>HARDROCK</div>
                <div style={{ fontSize: isMobile ? 18 : 21, fontWeight: 1000, color: "#fb923c", letterSpacing: -0.5, lineHeight: 1 }}>
                  {fmtOddsRaw(bookB)}
                </div>
                {bookEdge.b >= 5 && (
                  <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 900, marginTop: 2 }}>✓ +{bookEdge.b.toFixed(1)}% edge</div>
                )}
                {bookEdge.b < 0 && (
                  <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, opacity: 0.7, marginTop: 2 }}>{bookEdge.b.toFixed(1)}% overpriced</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Method + finish line */}
        {(shownMethods.length > 0 || fight.predicted_method) && (
          <div style={{
            paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {shownMethods.map((m) => (
                <span key={m} style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 800, background: `${MC[m]}18`, border: `1px solid ${MC[m]}35`, color: MC[m] }}>
                  {m} {(methodProbs[m] ?? 0).toFixed(0)}%
                </span>
              ))}
            </div>
            {fight.predicted_method && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", fontWeight: 800 }}>PREDICTED FINISH</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: MC[fight.predicted_method] || "#e8eef6" }}>
                  {fight.predicted_method}{fight.predicted_round ? ` · Rd ${fight.predicted_round}` : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Per-fight odds entry panel ─────────────────────────────────────────── */
function OddsInputPanel({ redName, blueName, bookR, bookB, onChangeR, onChangeB }) {
  const [open, setOpen] = useState(false);
  const inp = {
    width: "100%", padding: "8px 10px", borderRadius: 10,
    border: "1px solid rgba(255,165,0,0.25)", background: "rgba(255,165,0,0.07)",
    color: "#fb923c", outline: "none", fontSize: 15, fontWeight: 900,
    textAlign: "center", boxSizing: "border-box",
    placeholder: "e.g. -180",
  };
  return (
    <div style={{ borderRadius: "0 0 16px 16px", background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.12)", borderTop: "none", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", padding: "7px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,165,0,0.7)", fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}
      >
        <span>🎰  ENTER HARDROCK ODDS  (American format, e.g. −180 or +155)</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms", fontSize: 9 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "10px 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#ef4444", letterSpacing: 1, marginBottom: 4 }}>🔴 {redName.split(" ").slice(-1)[0].toUpperCase()}</div>
            <input
              type="text" inputMode="numeric" value={bookR}
              onChange={(e) => onChangeR(e.target.value)}
              placeholder="-180" style={{ ...inp, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "#3b82f6", letterSpacing: 1, marginBottom: 4 }}>{blueName.split(" ").slice(-1)[0].toUpperCase()} 🔵</div>
            <input
              type="text" inputMode="numeric" value={bookB}
              onChange={(e) => onChangeB(e.target.value)}
              placeholder="+155" style={{ ...inp, borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.07)", color: "#3b82f6" }}
            />
          </div>
          <div style={{ gridColumn: "1/-1", fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
            Edge updates live. Favorite = negative (−180), Underdog = positive (+155)
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Fighter autocomplete search ────────────────────────────────────────── */
function FighterSearch({ value, onChange, placeholder, accent }) {
  const [query, setQuery] = useState(value || "");
  const [suggs, setSuggs] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const wrap = useRef(null);

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

  const pick = (n) => { setQuery(n); setSuggs([]); setOpen(false); onChange(n); };
  const clear = () => { setQuery(""); setSuggs([]); setOpen(false); onChange(""); };

  const base = {
    width: "100%", padding: "12px 36px", borderRadius: 13,
    border: `1px solid ${accent}55`, background: "rgba(255,255,255,0.06)",
    color: "#e8eef6", outline: "none", boxSizing: "border-box", fontSize: 14, fontWeight: 600,
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: 0.38, pointerEvents: "none" }}>
        {busy ? <Icon name="loader" size={15} /> : <Icon name="search" size={15} />}
      </span>
      <input style={base} placeholder={placeholder} value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggs.length && setOpen(true)}
        autoComplete="off" />
      {query && (
        <button type="button" onClick={clear} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 2 }}>
          <Icon name="x" size={14} />
        </button>
      )}
      {open && suggs.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 60, top: "calc(100% + 4px)", left: 0, right: 0,
          background: "rgba(8,12,22,0.98)", border: `1px solid ${accent}44`,
          borderRadius: 13, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
        }}>
          {suggs.slice(0, 20).map((n) => (
            <div key={n} onClick={() => pick(n)}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}25`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Recommended Bets Banner ────────────────────────────────────────────── */
function RecommendedBets({ fights, bookOdds, isMobile }) {
  const recs = (fights || []).flatMap((fight) => {
    const key = `${fight.red_fighter}|${fight.blue_fighter}`;
    const bo = bookOdds[key];
    if (!bo) return [];
    const rOdds = parseInt(bo.r), bOdds = parseInt(bo.b);
    if (isNaN(rOdds) || isNaN(bOdds)) return [];
    const { r: bkR, b: bkB } = vigAdjustedProbs(rOdds, bOdds);
    const rPct = (fight.red_win_probability ?? 50) / 100;
    const bPct = (fight.blue_win_probability ?? 50) / 100;
    const rEdge = (rPct - bkR) * 100;
    const bEdge = (bPct - bkB) * 100;
    const picks = [];
    if (rEdge >= 5) picks.push({
      fighter: fight.red_fighter, opponent: fight.blue_fighter,
      edge: rEdge, bookOdds: fmtOddsRaw(rOdds), modelOdds: fmtOdds(rPct),
      kelly: kellyQuarter(rPct, rOdds), color: "#ef4444",
    });
    if (bEdge >= 5) picks.push({
      fighter: fight.blue_fighter, opponent: fight.red_fighter,
      edge: bEdge, bookOdds: fmtOddsRaw(bOdds), modelOdds: fmtOdds(bPct),
      kelly: kellyQuarter(bPct, bOdds), color: "#3b82f6",
    });
    return picks;
  }).sort((a, b) => b.edge - a.edge);

  if (recs.length === 0) return null;

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(34,197,94,0.35)",
      background: "linear-gradient(135deg, rgba(34,197,94,0.07), rgba(6,8,16,0) 70%)",
      animation: "fiup 300ms ease both",
    }}>
      <div style={{
        padding: "10px 16px", background: "rgba(34,197,94,0.1)", borderBottom: "1px solid rgba(34,197,94,0.2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>📈</span>
        <span style={{ fontWeight: 900, fontSize: 13, color: "#22c55e", letterSpacing: 0.3 }}>
          RECOMMENDED BETS — {recs.length} value bet{recs.length !== 1 ? "s" : ""} found vs Hardrock
        </span>
      </div>
      <div style={{ padding: "10px 14px", display: "grid", gap: 8 }}>
        {recs.map((rec) => (
          <div key={`${rec.fighter}-${rec.opponent}`} style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr",
            gap: isMobile ? 4 : 12, alignItems: "center",
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
          }}>
            <div>
              <span style={{ fontWeight: 900, fontSize: 14, color: rec.color }}>{rec.fighter}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginLeft: 6 }}>vs {rec.opponent}</span>
            </div>
            <div style={{ display: "grid", gap: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,165,0,0.7)", letterSpacing: 1 }}>HARDROCK</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#fb923c" }}>{rec.bookOdds}</span>
            </div>
            <div style={{ display: "grid", gap: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>EDGE</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#22c55e" }}>+{rec.edge.toFixed(1)}%</span>
            </div>
            <div style={{ display: "grid", gap: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>¼ KELLY</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: "#22c55e" }}>{rec.kelly.toFixed(1)}% bankroll</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", paddingTop: 4 }}>
          Edge = model win probability minus Hardrock vig-adjusted implied probability. Bet when edge ≥ 5%.
        </div>
      </div>
    </div>
  );
}

/* ─── Upcoming card view ─────────────────────────────────────────────────── */
function UpcomingCard({ isMobile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  // Per-fight Hardrock odds: { "Fighter A|Fighter B": { r: "-180", b: "+155" } }
  const [bookOdds, setBookOdds] = useState({});

  function setFightOdds(key, side, val) {
    setBookOdds((prev) => ({ ...prev, [key]: { ...prev[key], [side]: val } }));
  }

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${UFC_API}/next-card`, { signal: AbortSignal.timeout(35000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setData(d);
      setBookOdds({});
    } catch (e) { setErr(e.message || "Could not load upcoming card"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px", display: "grid", gap: 16, justifyItems: "center" }}>
      <Icon name="loader" size={44} color="#ef4444" />
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Scraping upcoming card &amp; running predictions…</div>
      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>This may take 20–30 seconds</div>
    </div>
  );

  if (err) return (
    <div style={{ textAlign: "center", padding: "50px 20px", display: "grid", gap: 16, justifyItems: "center" }}>
      <div style={{ fontSize: 14, color: "#ef4444" }}>⚠ {err}</div>
      <button onClick={load} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 13,
        background: "rgba(239,68,68,0.13)", border: "1px solid rgba(239,68,68,0.32)",
        color: "#ef4444", fontWeight: 800, cursor: "pointer", fontSize: 13,
      }}><Icon name="refresh" size={15} /> Try Again</button>
    </div>
  );

  if (!data) return null;

  const anyOddsEntered = Object.values(bookOdds).some((bo) => bo.r || bo.b);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Event banner */}
      <div style={{
        padding: "20px 24px", borderRadius: 20,
        background: "linear-gradient(135deg, rgba(239,68,68,0.11), rgba(59,130,246,0.07))",
        border: "1px solid rgba(239,68,68,0.24)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{
            fontSize: isMobile ? 20 : 26, fontWeight: 1000, letterSpacing: -0.6,
            background: "linear-gradient(90deg,#ef4444,#f97316 40%,#3b82f6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{data.event_name}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
            {data.event_date && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", display: "flex", gap: 5, alignItems: "center" }}>
                <Icon name="calendar" size={13} color="rgba(255,255,255,0.35)" /> {data.event_date}
              </span>
            )}
            {data.location && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", display: "flex", gap: 5, alignItems: "center" }}>
                <Icon name="map" size={13} color="rgba(255,255,255,0.35)" /> {data.location}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ padding: "5px 14px", borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 12, fontWeight: 700 }}>
            {data.predictions?.length || 0} Fights
          </span>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 11,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)",
            color: "rgba(255,255,255,0.65)", fontWeight: 700, cursor: "pointer", fontSize: 12,
          }}><Icon name="refresh" size={14} /> Refresh</button>
        </div>
      </div>

      {/* Hint when no odds entered */}
      {!anyOddsEntered && (
        <div style={{
          padding: "12px 16px", borderRadius: 14, display: "flex", gap: 10, alignItems: "center",
          background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.18)",
        }}>
          <span style={{ fontSize: 18 }}>🎰</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,165,0,0.85)" }}>Enter Hardrock odds to find value bets</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
              Click <strong style={{ color: "rgba(255,165,0,0.65)" }}>ENTER HARDROCK ODDS</strong> below any fight, type in the American odds from your Hardrock app, and the model instantly compares them.
            </div>
          </div>
        </div>
      )}

      {/* Recommended bets panel — appears as soon as any odds are entered */}
      {anyOddsEntered && (
        <RecommendedBets fights={data.predictions} bookOdds={bookOdds} isMobile={isMobile} />
      )}

      {/* Fight cards + per-fight odds input */}
      {(data.predictions || []).map((f, i) => {
        const key = `${f.red_fighter}|${f.blue_fighter}`;
        const bo = bookOdds[key] || {};
        const rOdds = bo.r ? parseInt(bo.r) : null;
        const bOdds = bo.b ? parseInt(bo.b) : null;
        return (
          <div key={key}>
            <FightCard fight={f} idx={i} isMobile={isMobile}
              bookR={!isNaN(rOdds) ? rOdds : null}
              bookB={!isNaN(bOdds) ? bOdds : null}
            />
            <OddsInputPanel
              redName={f.red_fighter} blueName={f.blue_fighter}
              bookR={bo.r || ""} bookB={bo.b || ""}
              onChangeR={(v) => setFightOdds(key, "r", v)}
              onChangeB={(v) => setFightOdds(key, "b", v)}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Custom matchup form ────────────────────────────────────────────────── */
function CustomMatchup({ isMobile }) {
  const R = "#ef4444", B = "#3b82f6";
  const [rn, setRn] = useState(""); const [bn, setBn] = useState("");
  const [wc, setWc] = useState("Lightweight");
  const [title, setTitle] = useState(false); const [rds, setRds] = useState(3);
  const [ro, setRo] = useState(""); const [bo, setBo] = useState(""); const [showOdds, setShowOdds] = useState(false);
  const [busy, setBusy] = useState(false); const [res, setRes] = useState(null); const [err, setErr] = useState(null);

  async function predict() {
    if (!rn.trim() || !bn.trim()) { setErr("Please enter both fighter names."); return; }
    setBusy(true); setErr(null); setRes(null);
    try {
      const body = { red_name: rn.trim(), blue_name: bn.trim(), weight_class: wc, is_title_fight: title, scheduled_rounds: rds };
      if (showOdds && ro) body.red_odds = parseFloat(ro);
      if (showOdds && bo) body.blue_odds = parseFloat(bo);
      const r = await fetch(`${UFC_API}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "API error");
      setRes(d);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const sel = {
    width: "100%", padding: "12px 12px", borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.06)",
    color: "#e8eef6", outline: "none", cursor: "pointer", fontWeight: 700,
    appearance: "none", WebkitAppearance: "none", fontSize: 14,
  };
  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.06)",
    color: "#e8eef6", outline: "none", boxSizing: "border-box", fontSize: 14,
  };

  function Toggle({ on, set, label }) {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", paddingTop: 8 }}>
        <div style={{ width: 38, height: 22, borderRadius: 99, background: on ? "#3b82f6" : "rgba(255,255,255,0.12)", position: "relative", transition: "background 200ms", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 3, left: on ? 18 : 3, width: 16, height: 16, borderRadius: 99, background: "white", transition: "left 200ms" }} />
        </div>
        <input type="checkbox" hidden checked={on} onChange={(e) => set(e.target.checked)} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      </label>
    );
  }

  const fightCard = res ? {
    red_fighter: res.red_fighter, blue_fighter: res.blue_fighter,
    winner: res.winner, winner_confidence: res.winner_confidence,
    red_win_probability: res.red_win_probability, blue_win_probability: res.blue_win_probability,
    predicted_method: res.predicted_method, method_confidence: res.method_confidence,
    predicted_round: res.predicted_round, method_probs: res.method_probs,
    r_elo: res.r_elo, b_elo: res.b_elo, weight_class: wc,
    is_main_event: false, is_title_fight: title, value: res.value,
  } : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Fighter inputs */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr", gap: 10, alignItems: "start" }}>
        <div style={{ padding: 16, borderRadius: 18, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: R, letterSpacing: 1.2, marginBottom: 10 }}>🔴 RED CORNER</div>
          <FighterSearch value={rn} onChange={setRn} placeholder="Search fighter…" accent={R} />
        </div>
        <div style={{ alignSelf: "center", textAlign: "center", fontWeight: 1000, fontSize: isMobile ? 13 : 16, opacity: 0.35, padding: isMobile ? "2px" : "0 6px" }}>VS</div>
        <div style={{ padding: 16, borderRadius: 18, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.22)" }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: B, letterSpacing: 1.2, marginBottom: 10 }}>BLUE CORNER 🔵</div>
          <FighterSearch value={bn} onChange={setBn} placeholder="Search fighter…" accent={B} />
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 14 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 900, letterSpacing: 0.8 }}>WEIGHT CLASS</label>
          <div style={{ position: "relative" }}>
            <select style={sel} value={wc} onChange={(e) => setWc(e.target.value)}>
              {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.35 }}>▾</span>
          </div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 900, letterSpacing: 0.8 }}>ROUNDS</label>
          <div style={{ position: "relative" }}>
            <select style={sel} value={rds} onChange={(e) => setRds(Number(e.target.value))}>
              <option value={3}>3 Rounds</option>
              <option value={5}>5 Rounds</option>
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.35 }}>▾</span>
          </div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 900, letterSpacing: 0.8 }}>TITLE FIGHT</label>
          <Toggle on={title} set={setTitle} label={title ? "Yes" : "No"} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 10, color: "rgba(255,165,0,0.75)", fontWeight: 900, letterSpacing: 0.8 }}>🎰 HARDROCK ODDS</label>
          <Toggle on={showOdds} set={setShowOdds} label={showOdds ? "Enabled" : "Off"} />
        </div>
      </div>

      {showOdds && (
        <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,165,0,0.05)", border: "1px solid rgba(255,165,0,0.22)", display: "grid", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,165,0,0.75)", letterSpacing: 0.5 }}>🎰 HARDROCK SPORTSBOOK ODDS — American format</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 10, color: R, fontWeight: 900, letterSpacing: 0.8 }}>🔴 RED CORNER</label>
              <input style={{ ...inp, borderColor: `${R}44`, background: "rgba(239,68,68,0.07)" }} placeholder="-180 or +150" value={ro} onChange={(e) => setRo(e.target.value)} />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 10, color: B, fontWeight: 900, letterSpacing: 0.8 }}>BLUE CORNER 🔵</label>
              <input style={{ ...inp, borderColor: `${B}44`, background: "rgba(59,130,246,0.07)" }} placeholder="-180 or +150" value={bo} onChange={(e) => setBo(e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            Entering odds unlocks the betting edge analysis. Favorite = negative (e.g. −180), Underdog = positive (e.g. +155).
          </div>
        </div>
      )}

      <button type="button" disabled={busy} onClick={predict} style={{
        padding: "15px 24px", borderRadius: 16, border: "none",
        background: busy ? "rgba(255,255,255,0.09)" : "linear-gradient(135deg,#ef4444,#f97316 50%,#3b82f6)",
        color: "white", fontWeight: 1000, fontSize: 15, cursor: busy ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: busy ? 0.5 : 1,
        boxShadow: busy ? "none" : "0 8px 28px rgba(239,68,68,0.32)",
      }}>
        {busy ? <Icon name="loader" size={20} /> : <Icon name="zap" size={20} />}
        {busy ? "Analyzing…" : "Predict Fight"}
      </button>

      {err && <div style={{ padding: "11px 16px", borderRadius: 13, background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.28)", fontSize: 13, color: "#ef4444" }}>{err}</div>}

      {fightCard && (
        <div style={{ animation: "fiup 380ms ease both", display: "grid", gap: 12 }}>
          <FightCard fight={fightCard} idx={0} isMobile={isMobile} />
          {res.value && res.value.r_vegas_pct > 0 && (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,165,0,0.2)" }}>
              <div style={{ padding: "8px 14px", background: "rgba(255,165,0,0.08)", borderBottom: "1px solid rgba(255,165,0,0.15)", fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "rgba(255,165,0,0.75)" }}>
                🎰 HARDROCK ODDS EDGE ANALYSIS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {[
                  { label: res.red_fighter, model: res.value.r_model_pct, vegas: res.value.r_vegas_pct, edge: res.value.r_edge, kelly: res.value.r_kelly, color: R },
                  { label: res.blue_fighter, model: res.value.b_model_pct, vegas: res.value.b_vegas_pct, edge: res.value.b_edge, kelly: res.value.b_kelly, color: B },
                ].map((f, fi) => (
                  <div key={f.label} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRight: fi === 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ fontWeight: 900, fontSize: 12, color: f.color, marginBottom: 8 }}>{f.label}</div>
                    <div style={{ display: "grid", gap: 5, fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: "rgba(255,255,255,0.38)" }}>Model odds</span>
                        <span style={{ fontWeight: 900, color: f.color }}>{fmtOdds(f.model / 100)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: "rgba(255,165,0,0.7)" }}>Hardrock odds</span>
                        <span style={{ fontWeight: 900, color: "#fb923c" }}>{fmtOdds(f.vegas / 100)}</span>
                      </div>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ color: "rgba(255,255,255,0.38)" }}>Edge vs Hardrock</span>
                        <span style={{ fontWeight: 900, color: f.edge >= 5 ? "#22c55e" : f.edge >= 0 ? "rgba(255,255,255,0.7)" : "#ef4444" }}>
                          {f.edge >= 0 ? "+" : ""}{f.edge?.toFixed(1)}%
                        </span>
                      </div>
                      {f.kelly > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.38)" }}>¼ Kelly size</span>
                          <span style={{ fontWeight: 900, color: "#22c55e" }}>{(f.kelly * 0.25).toFixed(1)}% bankroll</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── UFC Page ───────────────────────────────────────────────────────────── */
function UFCPage({ isMobile }) {
  const [tab, setTab] = useState("upcoming");
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Page header */}
      <div style={{ textAlign: "center", padding: isMobile ? "16px 0 6px" : "24px 0 8px" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: isMobile ? 28 : 44, fontWeight: 1000, letterSpacing: -1.5, lineHeight: 1 }}>
          <span style={{ background: "linear-gradient(90deg,#ef4444 0%,#f97316 35%,#3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            UFC Prediction Model
          </span>
        </h1>
        <div style={{ fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.4)", maxWidth: 520, margin: "0 auto 18px" }}>
          ML-powered predictions using XGBoost + LightGBM ensembles, Elo ratings, and Vegas odds analysis
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[["77%", "Win Accuracy"], ["7,190", "Fights Trained"], ["Elo + ML", "Ensemble"], ["Kelly", "Bet Sizing"]].map(([val, lbl]) => (
            <div key={lbl} style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 1000, color: "#ef4444" }}>{val}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 800, letterSpacing: 0.5 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 6, padding: "5px", borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[["upcoming", "🗓  Upcoming Card"], ["custom", "🔍  Custom Matchup"]].map(([id, lbl]) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={{
              padding: "10px 22px", borderRadius: 12, border: "none",
              background: tab === id ? "linear-gradient(135deg,rgba(239,68,68,0.28),rgba(59,130,246,0.20))" : "transparent",
              border: tab === id ? "1px solid rgba(239,68,68,0.38)" : "1px solid transparent",
              color: tab === id ? "#fff" : "rgba(255,255,255,0.42)",
              fontWeight: tab === id ? 900 : 700, cursor: "pointer", fontSize: isMobile ? 13 : 14,
              transition: "all 160ms",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {tab === "upcoming" ? <UpcomingCard isMobile={isMobile} /> : <CustomMatchup isMobile={isMobile} />}
    </div>
  );
}

/* ─── Contact form ───────────────────────────────────────────────────────── */
function ContactForm() {
  const [nm, setNm] = useState(""); const [em, setEm] = useState(""); const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");
  const inp = { width: "100%", padding: "12px 14px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.06)", color: "#e8eef6", outline: "none", boxSizing: "border-box", fontSize: 14 };

  function submit(e) {
    e.preventDefault();
    if (!nm.trim() || !em.includes("@") || msg.trim().length < 10) {
      setToast("Name, valid email, and message (10+ chars) required."); setTimeout(() => setToast(""), 2400); return;
    }
    const s = encodeURIComponent(`Portfolio message from ${nm.trim()}`);
    const b = encodeURIComponent(`Name: ${nm.trim()}\nEmail: ${em.trim()}\n\n${msg.trim()}`);
    window.location.href = `mailto:${CONTENT.contact.email}?subject=${s}&body=${b}`;
    setToast("Opening email app…"); setTimeout(() => setToast(""), 1600);
  }

  return (
    <div style={{ padding: "22px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>Send a Message</div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input style={inp} placeholder="Your name" value={nm} onChange={(e) => setNm(e.target.value)} />
        <input style={inp} placeholder="Your email" value={em} onChange={(e) => setEm(e.target.value)} />
        <textarea style={{ ...inp, minHeight: 110, resize: "vertical" }} placeholder="What would you like to talk about?" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button type="submit" style={{ padding: "13px 20px", borderRadius: 13, border: "none", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: 14, boxShadow: "0 6px 22px rgba(59,130,246,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="mail" size={16} /> Send Message
        </button>
      </form>
      {toast && <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{toast}</div>}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const W = useWindowSize();
  const isMobile = W < 768;
  const bgStyle = useAnimatedBg();
  const contentKey = useRef(0);

  function go(p) { setPage(p); setMenuOpen(false); contentKey.current++; window.scrollTo({ top: 0, behavior: "smooth" }); }

  const NAV_LINKS = [["home","Home","home"],["projects","Projects","code"],["resume","Resume","doc"],["contact","Contact","mail"]];

  function NavBtn({ id, label, icon }) {
    const active = page === id;
    return (
      <button type="button" onClick={() => go(id)} style={{
        padding: isMobile ? "12px 16px" : "9px 14px", borderRadius: 12,
        border: active ? "1px solid rgba(255,255,255,0.20)" : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.09)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.50)",
        fontWeight: active ? 900 : 700, cursor: "pointer", fontSize: 14,
        display: "flex", alignItems: "center", gap: 7, transition: "all 140ms",
        width: isMobile ? "100%" : "auto",
      }}>
        <Icon name={icon} size={15} /> {label}
      </button>
    );
  }

  return (
    <div style={{ minHeight: "100vh", color: "#e8eef6", fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", ...bgStyle, position: "relative", overflowX: "hidden" }}>
      {/* Grid overlay */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "52px 52px", maskImage: "radial-gradient(ellipse 90% 50% at 50% 0%,black,transparent 75%)" }} />

      <style>{`
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fiup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes pagein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        button:not([disabled]):hover{filter:brightness(1.09);}
        a:hover{filter:brightness(1.08);}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.10);border-radius:99px}
        select option{background:#0a0e1a}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(6,8,16,0.88)", backdropFilter: "blur(22px) saturate(160%)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "13px 16px" : "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: isMobile ? "auto" : 62 }}>
          {/* Brand */}
          <button type="button" onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,rgba(139,92,246,0.45),rgba(59,130,246,0.35))", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 13, letterSpacing: -0.5 }}>KS</div>
            {!isMobile && <div><div style={{ fontWeight: 1000, fontSize: 15, letterSpacing: -0.4 }}>Kyle Suda</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.36)" }}>Cybersecurity · Dev · ML</div></div>}
          </button>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {NAV_LINKS.map(([id, label, icon]) => <NavBtn key={id} id={id} label={label} icon={icon} />)}
              <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)", margin: "0 8px" }} />
              <button type="button" onClick={() => go("ufc")} style={{
                padding: "9px 18px", borderRadius: 12, cursor: "pointer", fontWeight: 900, fontSize: 14,
                background: page === "ufc" ? "linear-gradient(135deg,rgba(239,68,68,0.38),rgba(59,130,246,0.22))" : "linear-gradient(135deg,rgba(239,68,68,0.14),rgba(59,130,246,0.09))",
                border: page === "ufc" ? "1px solid rgba(239,68,68,0.52)" : "1px solid rgba(239,68,68,0.24)",
                color: page === "ufc" ? "#fff" : "rgba(255,190,190,0.85)",
                display: "flex", alignItems: "center", gap: 7, transition: "all 200ms",
                boxShadow: page === "ufc" ? "0 0 22px rgba(239,68,68,0.22)" : "none",
              }}>
                <Icon name="zap" size={15} /> UFC Prediction Model
              </button>
            </nav>
          )}

          {/* Mobile controls */}
          {isMobile && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={() => go("ufc")} style={{ padding: "8px 12px", borderRadius: 11, border: "1px solid rgba(239,68,68,0.35)", background: page === "ufc" ? "rgba(239,68,68,0.22)" : "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 900, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="zap" size={14} /> UFC
              </button>
              <button type="button" onClick={() => setMenuOpen((m) => !m)} style={{ padding: "8px 9px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer" }}>
                <Icon name={menuOpen ? "x" : "menu"} size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu dropdown */}
        {isMobile && menuOpen && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px 14px", display: "grid", gap: 4, background: "rgba(6,8,16,0.96)" }}>
            {NAV_LINKS.map(([id, label, icon]) => <NavBtn key={id} id={id} label={label} icon={icon} />)}
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ────────────────────────────────────────────────── */}
      <main key={page} style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "22px 16px 70px" : "34px 28px 90px", position: "relative", zIndex: 2, animation: "pagein 340ms ease both" }}>

        {/* ═══════ UFC PAGE ═══════════════════════════════════════════════ */}
        {page === "ufc" && <UFCPage isMobile={isMobile} />}

        {/* ═══════ HOME ═══════════════════════════════════════════════════ */}
        {page === "home" && (
          <div style={{ display: "grid", gap: isMobile ? 16 : 20 }}>

            {/* Hero */}
            <div style={{ padding: isMobile ? "28px 22px" : "42px 38px", borderRadius: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(18px)", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-25%", right: "5%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-30%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.10) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[CONTENT.location, "Open to Opportunities", "USF Student"].map((t) => (
                    <span key={t} style={{ padding: "5px 12px", borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.11)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{t}</span>
                  ))}
                </div>
                <div>
                  <h1 style={{ margin: "0 0 8px", fontSize: isMobile ? 36 : 58, fontWeight: 1000, letterSpacing: -2, lineHeight: 0.98, color: "#fff" }}>Kyle Suda</h1>
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, background: "linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{CONTENT.title}</div>
                </div>
                <div style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.52)", lineHeight: 1.72, maxWidth: 660 }}>{CONTENT.tagline}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <a href={`mailto:${CONTENT.contact.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 13, textDecoration: "none", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "white", fontWeight: 900, fontSize: 14, boxShadow: "0 8px 26px rgba(59,130,246,0.32)" }}>
                    <Icon name="mail" size={16} /> Email Me
                  </a>
                  <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 13, textDecoration: "none", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.82)", fontWeight: 900, fontSize: 14 }}>
                    <Icon name="link" size={16} /> GitHub
                  </a>
                  <button type="button" onClick={() => go("ufc")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 13, background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.32)", color: "#ef4444", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>
                    <Icon name="zap" size={16} /> Try UFC Predictor
                  </button>
                </div>
              </div>
            </div>

            {/* Highlights + Skills */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 0.7fr", gap: 16 }}>
              <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <div style={{ fontWeight: 1000, fontSize: 16, marginBottom: 3 }}>About Me</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginBottom: 16 }}>What I'm working on</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {CONTENT.highlights.map((h) => (
                    <div key={h.label} style={{ padding: 14, borderRadius: 15, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", fontWeight: 700 }}>{h.label}</div>
                      <div style={{ fontWeight: 900, letterSpacing: -0.3, marginTop: 4, fontSize: 13 }}>{h.value}</div>
                    </div>
                  ))}
                </div>
                {CONTENT.about.map((p, i) => <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.68, marginBottom: i < CONTENT.about.length - 1 ? 8 : 0 }}>{p}</div>)}
              </div>
              <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", display: "grid", gap: 16, alignContent: "start" }}>
                <div><div style={{ fontWeight: 1000, fontSize: 16, marginBottom: 3 }}>Skills</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>Tech snapshot</div></div>
                {Object.entries(CONTENT.skills).map(([group, items]) => (
                  <div key={group} style={{ display: "grid", gap: 7 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.42)", letterSpacing: 0.6 }}>{group}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {items.map((s) => <span key={s} style={{ padding: "4px 9px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.60)" }}>{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UFC project CTA */}
            <div style={{ padding: isMobile ? "22px 20px" : "26px 32px", borderRadius: 22, position: "relative", overflow: "hidden", background: "linear-gradient(135deg,rgba(239,68,68,0.10),rgba(6,8,16,0) 60%,rgba(59,130,246,0.08))", border: "1px solid rgba(239,68,68,0.24)", boxShadow: "0 0 70px rgba(239,68,68,0.06)" }}>
              <div style={{ position: "absolute", top: "-20%", right: "0%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.13) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.36)", color: "#ef4444", fontSize: 10, fontWeight: 900 }}>★ FEATURED PROJECT</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 1000, letterSpacing: -0.5, marginBottom: 7 }}>UFC Fight Prediction Engine</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", maxWidth: 480, lineHeight: 1.6 }}>77% win accuracy · XGBoost + LightGBM · Elo system · 7,190 fights · Value bet detection</div>
                </div>
                <button type="button" onClick={() => go("ufc")} style={{ padding: "14px 26px", borderRadius: 15, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "white", fontWeight: 1000, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: "0 8px 28px rgba(239,68,68,0.40)" }}>
                  <Icon name="zap" size={18} /> Try It Live →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ PROJECTS ═══════════════════════════════════════════════ */}
        {page === "projects" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 26 : 36, fontWeight: 1000, letterSpacing: -0.9 }}>Projects</h2>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>Selected work</div>
            </div>
            {CONTENT.projects.map((p, pi) => (
              <div key={p.name} style={{ padding: 24, borderRadius: 22, animation: `fiup 360ms ease ${pi * 70}ms both`, background: p.featured ? "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(59,130,246,0.05))" : "rgba(255,255,255,0.04)", border: p.featured ? "1px solid rgba(239,68,68,0.24)" : "1px solid rgba(255,255,255,0.09)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ fontWeight: 1000, fontSize: 18, letterSpacing: -0.4 }}>{p.name}</span>
                      {p.featured && <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.34)", color: "#ef4444", fontSize: 10, fontWeight: 900 }}>★ FEATURED</span>}
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.52)", lineHeight: 1.65, maxWidth: 580 }}>{p.blurb}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {p.stack.map((t) => <span key={t} style={{ padding: "5px 10px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.60)" }}>{t}</span>)}
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 0 12px" }} />
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 7 }}>
                  {p.bullets.map((b) => <li key={b} style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.65 }}>{b}</li>)}
                </ul>
                {p.featured && (
                  <div style={{ marginTop: 16 }}>
                    <button type="button" onClick={() => go("ufc")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 13, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: 13, boxShadow: "0 6px 20px rgba(239,68,68,0.34)" }}>
                      <Icon name="zap" size={15} /> Try It Live →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════ RESUME ═════════════════════════════════════════════════ */}
        {page === "resume" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 26 : 36, fontWeight: 1000, letterSpacing: -0.9 }}>Resume</h2>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>Experience & Education</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: 16 }}>
              <div style={{ display: "grid", gap: 16 }}>
                {[{ title: "Experience", items: CONTENT.experience, render: (e) => (
                  <div key={e.role}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <div><div style={{ fontWeight: 900, fontSize: 14 }}>{e.role}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>{e.org}</div></div>
                      <span style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", alignSelf: "flex-start" }}>{e.timeframe}</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 5 }}>{e.points.map((pt) => <li key={pt} style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.6 }}>{pt}</li>)}</ul>
                  </div>
                )}, { title: "Education", items: CONTENT.education, render: (ed) => (
                  <div key={ed.school}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <div><div style={{ fontWeight: 900, fontSize: 14 }}>{ed.school}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>{ed.program}</div></div>
                      <span style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", alignSelf: "flex-start" }}>{ed.timeframe}</span>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{ed.notes.map((n) => <span key={n} style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(59,130,246,0.09)", border: "1px solid rgba(59,130,246,0.18)", fontSize: 11, fontWeight: 700, color: "rgba(140,175,255,0.65)" }}>{n}</span>)}</div>
                  </div>
                )}].map(({ title, items, render }) => (
                  <div key={title} style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <div style={{ fontWeight: 1000, fontSize: 15, marginBottom: 16 }}>{title}</div>
                    <div style={{ display: "grid", gap: 16 }}>{items.map(render)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
                <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div style={{ fontWeight: 1000, fontSize: 15, marginBottom: 14 }}>Certifications</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {CONTENT.certifications.map((c) => (
                      <div key={c.name} style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{c.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div style={{ fontWeight: 1000, fontSize: 15, marginBottom: 10 }}>What I'm Looking For</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.65 }}>Entry-level roles or internships in security, SOC, AppSec, or secure full-stack development.</div>
                </div>
                <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div style={{ fontWeight: 1000, fontSize: 15, marginBottom: 12 }}>Links</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[{ label: "GitHub", href: CONTENT.contact.github }, { label: "LinkedIn", href: CONTENT.contact.linkedin }, { label: "Portfolio", href: CONTENT.contact.website }].map((l) => (
                      <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.70)", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                        <Icon name="link" size={14} /> {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ CONTACT ════════════════════════════════════════════════ */}
        {page === "contact" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 26 : 36, fontWeight: 1000, letterSpacing: -0.9 }}>Contact</h2>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>Let's talk</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 24, borderRadius: 22, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", display: "grid", gap: 14, alignContent: "start" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.72 }}>Want to connect about internships, projects, or security work? The fastest way to reach me is email.</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[{ label: CONTENT.contact.email, icon: "mail", href: `mailto:${CONTENT.contact.email}` }, { label: "LinkedIn", icon: "link", href: CONTENT.contact.linkedin }, { label: "GitHub", icon: "link", href: CONTENT.contact.github }].map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.70)", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                      <Icon name={l.icon} size={15} /> {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.22)", paddingBottom: 36, position: "relative", zIndex: 2 }}>
        © {new Date().getFullYear()} Kyle Suda · Built with React · UFC Predictor powered by XGBoost + LightGBM
      </footer>
    </div>
  );
}
