import { useEffect, useRef, useState } from "react";

const UFC_API = (import.meta.env.VITE_UFC_API || "https://vibrant-healing-ufc-api-production.up.railway.app").replace(/\/$/, "");
const MONO = `"SF Mono","JetBrains Mono","Fira Code","Consolas",monospace`;
const SANS = `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif`;

const T = {
  bg:     "#090909",
  surf:   "#0e0e13",
  bd:     "rgba(255,255,255,0.08)",
  bdHi:   "rgba(255,255,255,0.13)",
  text:   "#e2e2ee",
  dim:    "#505070",
  faint:  "#181824",
  green:  "#4ade80",
  red:    "#f87171",
  blue:   "#60a5fa",
  yellow: "#fbbf24",
  purple: "#a78bfa",
};

/* ── Content ─────────────────────────────────────────────────────────────── */
const CONTENT = {
  name: "Kyle Suda",
  role: "cybersecurity · full-stack · ml",
  tagline: "Building secure apps and prediction systems through hands-on labs, full-stack projects, and real-world security practice.",
  about: [
    "Focused on cybersecurity and full-stack development. I build practical projects while studying security fundamentals, networking, and secure software design.",
    "Especially interested in defensive security, detection engineering, and systems that are secure by design. I also build ML-powered prediction engines.",
  ],
  skills: {
    lang:     ["Python", "JavaScript", "TypeScript", "SQL"],
    ml:       ["XGBoost", "LightGBM", "Elo Systems", "Feature Engineering"],
    security: ["Network Fundamentals", "IDS/IPS", "Wireshark", "Snort"],
    web:      ["React", "Node.js", "Express", "REST APIs"],
    infra:    ["Docker", "Railway", "Vercel", "Git"],
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
      notes: ["Networking", "Security Fundamentals", "Programming", "Databases"],
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

/* ── Hooks ───────────────────────────────────────────────────────────────── */
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
const MC = {
  "KO/TKO":          T.red,
  "Submission":      T.purple,
  "Decision":        T.blue,
  "Other/No Contest": "#6b7280",
};

function toAmericanOdds(prob) {
  const p = Math.max(0.01, Math.min(0.99, prob));
  if (p >= 0.5) return Math.round(-(p / (1 - p)) * 100);
  return Math.round(((1 - p) / p) * 100);
}
function fmtOdds(prob) {
  const o = toAmericanOdds(prob);
  return o > 0 ? `+${o}` : `${o}`;
}

function Lbl({ children, color }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 11, color: color || T.dim,
      letterSpacing: 1, marginBottom: 18,
    }}>
      // {children}
    </div>
  );
}

/* ── FightCard ───────────────────────────────────────────────────────────── */
function FightCard({ fight, idx, isMobile }) {
  if (fight.error) {
    return (
      <div style={{ padding: "14px 0", borderBottom: `1px solid ${T.bd}`, color: T.dim, fontSize: 12, fontFamily: MONO }}>
        {fight.red_fighter} vs {fight.blue_fighter} — {fight.error}
      </div>
    );
  }

  const winRed = fight.winner === fight.red_fighter;
  const rPct   = fight.red_win_probability  ?? 50;
  const bPct   = fight.blue_win_probability ?? 50;
  const mProbs = fight.method_probs || {};

  return (
    <div style={{ borderBottom: `1px solid ${T.bd}`, padding: "20px 0", animation: `fd 180ms ease ${idx * 35}ms both` }}>

      {/* Meta */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        {fight.is_main_event  && <span style={{ fontFamily: MONO, fontSize: 9,  color: T.red,    letterSpacing: 1.2, fontWeight: 800 }}>MAIN</span>}
        {fight.is_title_fight && <span style={{ fontFamily: MONO, fontSize: 9,  color: T.yellow, letterSpacing: 1.2, fontWeight: 800 }}>TITLE</span>}
        <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{fight.weight_class}</span>
      </div>

      {/* Fighters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
        {/* Red */}
        <div>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: winRed ? T.red : T.text, lineHeight: 1.2, marginBottom: 6 }}>
            {fight.red_fighter}
            {winRed && <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 9, color: T.red }}>pick</span>}
          </div>
          <div style={{ fontFamily: MONO, fontSize: isMobile ? 22 : 26, fontWeight: 700, color: T.red, lineHeight: 1 }}>{rPct.toFixed(1)}%</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 4 }}>{fmtOdds(rPct / 100)}</div>
          {fight.r_elo && <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 3, color: "#2a2a40" }}>elo {fight.r_elo}</div>}
        </div>

        {/* Bar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: isMobile ? 48 : 60 }}>
          <div style={{ width: "100%", height: 2, background: T.faint, borderRadius: 99, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rPct}%`, background: T.red, borderRadius: "99px 0 0 99px" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${bPct}%`, background: T.blue, borderRadius: "0 99px 99px 0" }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: "#28283c" }}>vs</span>
        </div>

        {/* Blue */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: !winRed ? T.blue : T.text, lineHeight: 1.2, marginBottom: 6 }}>
            {!winRed && <span style={{ marginRight: 8, fontFamily: MONO, fontSize: 9, color: T.blue }}>pick</span>}
            {fight.blue_fighter}
          </div>
          <div style={{ fontFamily: MONO, fontSize: isMobile ? 22 : 26, fontWeight: 700, color: T.blue, lineHeight: 1 }}>{bPct.toFixed(1)}%</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 4 }}>{fmtOdds(bPct / 100)}</div>
          {fight.b_elo && <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 3, color: "#28283c" }}>elo {fight.b_elo}</div>}
        </div>
      </div>

      {/* Method row */}
      {(Object.keys(mProbs).length > 0 || fight.predicted_method) && (
        <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {["KO/TKO", "Decision", "Submission"].map((m) => {
            const pct = mProbs[m] ?? 0;
            if (pct < 1) return null;
            return (
              <span key={m} style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>
                <span style={{ color: MC[m] }}>{m}</span> {pct.toFixed(0)}%
              </span>
            );
          })}
          {fight.predicted_method && (
            <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginLeft: "auto" }}>
              → {fight.predicted_method}{fight.predicted_round ? ` R${fight.predicted_round}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Fighter autocomplete ────────────────────────────────────────────────── */
function FighterSearch({ value, onChange, placeholder, accent }) {
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
    width: "100%", padding: "10px 14px", borderRadius: 7,
    border: `1px solid ${accent ? accent + "44" : T.bd}`, background: T.surf,
    color: T.text, outline: "none", fontFamily: SANS, fontSize: 14, boxSizing: "border-box",
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
        <button
          type="button"
          onClick={clear}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.dim, fontFamily: MONO, fontSize: 11, padding: 2 }}
        >
          {busy ? "···" : "×"}
        </button>
      )}
      {open && suggs.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 60, top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#0b0b12", border: `1px solid ${T.bd}`, borderRadius: 7,
          maxHeight: 220, overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        }}>
          {suggs.slice(0, 20).map((n) => (
            <div key={n} onClick={() => pick(n)}
              style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, color: T.text, borderBottom: `1px solid ${T.bd}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.surf)}
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

/* ── Upcoming card ───────────────────────────────────────────────────────── */
function UpcomingCard({ isMobile }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${UFC_API}/next-card`, { signal: AbortSignal.timeout(90000) });
      if (!r.ok) {
        let detail = `HTTP ${r.status}`;
        try {
          const body = await r.json();
          if (body?.message || body?.error) detail = body.message || body.error;
        } catch { /* ignore non-JSON error bodies */ }
        throw new Error(detail);
      }
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e) {
      const msg = e.name === "TimeoutError" || e.name === "AbortError"
        ? "Request timed out — the prediction API may be cold-starting. Try again."
        : (e.message || "Could not load upcoming card");
      setErr(msg);
    }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>loading upcoming card · running predictions...</div>
        <div style={{ fontFamily: MONO, fontSize: 11, marginTop: 6, color: "#252535" }}>~20–30 seconds</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: "40px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.red, marginBottom: 14 }}>error: {err}</div>
        <button onClick={load} style={{ fontFamily: MONO, fontSize: 12, color: T.dim, background: "none", border: `1px solid ${T.bd}`, padding: "7px 14px", borderRadius: 6, cursor: "pointer" }}>↻ retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, marginBottom: 4, borderBottom: `1px solid ${T.bd}` }}>
        <div>
          <div style={{ fontSize: isMobile ? 17 : 21, fontWeight: 800, letterSpacing: -0.5, color: T.text, marginBottom: 4 }}>
            {data.event_name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>
            {[data.event_date, data.location, data.predictions?.length && `${data.predictions.length} fights`].filter(Boolean).join(" · ")}
          </div>
        </div>
        <button onClick={load} style={{ fontFamily: MONO, fontSize: 11, color: T.dim, background: "none", border: `1px solid ${T.bd}`, padding: "6px 12px", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}>↻ refresh</button>
      </div>

      {(data.predictions || []).map((f, i) => (
        <FightCard key={`${f.red_fighter}|${f.blue_fighter}`} fight={f} idx={i} isMobile={isMobile} />
      ))}
    </div>
  );
}

/* ── Custom matchup ──────────────────────────────────────────────────────── */
function CustomMatchup({ isMobile }) {
  const [rn,       setRn]       = useState("");
  const [bn,       setBn]       = useState("");
  const [wc,       setWc]       = useState("Lightweight");
  const [title,    setTitle]    = useState(false);
  const [rds,      setRds]      = useState(3);
  const [ro,       setRo]       = useState("");
  const [bo,       setBo]       = useState("");
  const [showOdds, setShowOdds] = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [res,      setRes]      = useState(null);
  const [err,      setErr]      = useState(null);

  async function predict() {
    if (!rn.trim() || !bn.trim()) { setErr("Enter both fighter names."); return; }
    setBusy(true); setErr(null); setRes(null);
    try {
      const body = { red_name: rn.trim(), blue_name: bn.trim(), weight_class: wc, is_title_fight: title, scheduled_rounds: rds };
      if (showOdds && ro) body.red_odds  = parseFloat(ro);
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
    }
    finally { setBusy(false); }
  }

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${T.bd}`, background: T.surf, color: T.text, outline: "none", fontFamily: SANS, fontSize: 14, boxSizing: "border-box" };
  const sel = { ...inp, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
  const lbl = { fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: 0.8, display: "block", marginBottom: 6 };

  const fightCard = res ? {
    red_fighter: res.red_fighter, blue_fighter: res.blue_fighter,
    winner: res.winner, red_win_probability: res.red_win_probability, blue_win_probability: res.blue_win_probability,
    predicted_method: res.predicted_method, predicted_round: res.predicted_round,
    method_probs: res.method_probs, r_elo: res.r_elo, b_elo: res.b_elo,
    weight_class: wc, is_main_event: false, is_title_fight: title,
  } : null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ ...lbl, color: T.red }}>red corner</label>
          <FighterSearch value={rn} onChange={setRn} placeholder="Search fighter…" accent={T.red} />
        </div>
        <div>
          <label style={{ ...lbl, color: T.blue }}>blue corner</label>
          <FighterSearch value={bn} onChange={setBn} placeholder="Search fighter…" accent={T.blue} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>weight class</label>
          <div style={{ position: "relative" }}>
            <select style={sel} value={wc} onChange={(e) => setWc(e.target.value)}>
              {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.dim, fontSize: 11 }}>▾</span>
          </div>
        </div>
        <div>
          <label style={lbl}>rounds</label>
          <div style={{ position: "relative" }}>
            <select style={sel} value={rds} onChange={(e) => setRds(Number(e.target.value))}>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.dim, fontSize: 11 }}>▾</span>
          </div>
        </div>
        <div>
          <label style={lbl}>title fight</label>
          <button type="button" onClick={() => setTitle((v) => !v)} style={{ ...inp, cursor: "pointer", color: title ? T.green : T.dim, textAlign: "left" }}>{title ? "yes" : "no"}</button>
        </div>
        <div>
          <label style={lbl}>include odds</label>
          <button type="button" onClick={() => setShowOdds((v) => !v)} style={{ ...inp, cursor: "pointer", color: showOdds ? T.green : T.dim, textAlign: "left" }}>{showOdds ? "yes" : "no"}</button>
        </div>
      </div>

      {showOdds && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: T.red }}>red odds (american)</label>
            <input style={{ ...inp, borderColor: `${T.red}44` }} placeholder="-200 or +150" value={ro} onChange={(e) => setRo(e.target.value)} />
          </div>
          <div>
            <label style={{ ...lbl, color: T.blue }}>blue odds (american)</label>
            <input style={{ ...inp, borderColor: `${T.blue}44` }} placeholder="-200 or +150" value={bo} onChange={(e) => setBo(e.target.value)} />
          </div>
        </div>
      )}

      <button type="button" disabled={busy} onClick={predict} style={{
        padding: "11px 20px", borderRadius: 7, border: `1px solid ${busy ? T.bd : T.dim}`,
        background: "none", color: busy ? T.dim : T.text, fontFamily: MONO,
        fontSize: 13, cursor: busy ? "default" : "pointer", letterSpacing: 0.5,
        transition: "border-color 150ms",
      }}>
        {busy ? "analyzing..." : "→ predict fight"}
      </button>

      {err && <div style={{ fontFamily: MONO, fontSize: 12, color: T.red }}>error: {err}</div>}

      {fightCard && (
        <div style={{ animation: "fd 280ms ease both" }}>
          <FightCard fight={fightCard} idx={0} isMobile={isMobile} />
          {res.value && res.value.r_vegas_pct > 0 && (
            <div style={{ paddingTop: 16, marginTop: 4 }}>
              <Lbl>value analysis</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  { label: res.red_fighter,  model: res.value.r_model_pct, vegas: res.value.r_vegas_pct, edge: res.value.r_edge, kelly: res.value.r_kelly, color: T.red },
                  { label: res.blue_fighter, model: res.value.b_model_pct, vegas: res.value.b_vegas_pct, edge: res.value.b_edge, kelly: res.value.b_kelly, color: T.blue },
                ].map((f) => (
                  <div key={f.label}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: f.color, marginBottom: 8 }}>{f.label}</div>
                    <div style={{ display: "grid", gap: 5, fontFamily: MONO, fontSize: 12 }}>
                      <Row label="model"        val={fmtOdds(f.model / 100)} valColor={f.color} />
                      <Row label="book (vig-adj)" val={fmtOdds(f.vegas / 100)} />
                      <div style={{ height: 1, background: T.faint, margin: "2px 0" }} />
                      <Row label="edge" val={`${f.edge >= 0 ? "+" : ""}${f.edge?.toFixed(1)}%`} valColor={f.edge >= 8 ? T.green : f.edge >= 0 ? T.text : T.red} />
                      {f.kelly > 0 && <Row label="kelly (¼)" val={`${(f.kelly * 0.25).toFixed(1)}%`} valColor={T.green} />}
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

function Row({ label, val, valColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: T.dim }}>{label}</span>
      <span style={{ color: valColor || T.text }}>{val}</span>
    </div>
  );
}

/* ── UFC Page ────────────────────────────────────────────────────────────── */
function UFCPage({ isMobile }) {
  const [tab, setTab] = useState("upcoming");

  return (
    <div>
      <div style={{ paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${T.bd}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>ufc @</span>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: -0.6, color: T.text }}>
            fight-prediction-engine
          </h1>
          <span style={{ fontFamily: MONO, fontSize: 9, color: T.green, border: `1px solid ${T.green}40`, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.8 }}>LIVE</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>
          65.6% cv accuracy · 7,190 fights trained · xgboost + lightgbm · elo ratings · kelly criterion
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `1px solid ${T.bd}` }}>
        {[["upcoming", "upcoming card"], ["custom", "custom matchup"]].map(([id, lbl]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: MONO, fontSize: 12, letterSpacing: 0.5,
            color: tab === id ? T.text : T.dim,
            padding: "0 0 10px", marginRight: 24,
            borderBottom: `2px solid ${tab === id ? T.text : "transparent"}`,
            marginBottom: -1, transition: "color 150ms",
          }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? <UpcomingCard isMobile={isMobile} /> : <CustomMatchup isMobile={isMobile} />}
    </div>
  );
}

/* ── Contact form ────────────────────────────────────────────────────────── */
function ContactForm() {
  const [nm,    setNm]    = useState("");
  const [em,    setEm]    = useState("");
  const [msg,   setMsg]   = useState("");
  const [toast, setToast] = useState("");

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${T.bd}`, background: T.surf, color: T.text, outline: "none", fontFamily: SANS, fontSize: 14, boxSizing: "border-box" };

  function submit(e) {
    e.preventDefault();
    if (!nm.trim() || !em.includes("@") || msg.trim().length < 10) {
      setToast("Name, valid email, and message (10+ chars) required.");
      setTimeout(() => setToast(""), 2400); return;
    }
    const s = encodeURIComponent(`Portfolio message from ${nm.trim()}`);
    const b = encodeURIComponent(`Name: ${nm.trim()}\nEmail: ${em.trim()}\n\n${msg.trim()}`);
    window.location.href = `mailto:${CONTENT.contact.email}?subject=${s}&body=${b}`;
    setToast("Opening email app…"); setTimeout(() => setToast(""), 1600);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 28 }}>
      <Lbl>send a message</Lbl>
      <input style={inp} placeholder="Your name"  value={nm}  onChange={(e) => setNm(e.target.value)} />
      <input style={inp} placeholder="Your email" value={em}  onChange={(e) => setEm(e.target.value)} />
      <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="What would you like to talk about?" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button type="submit" style={{ padding: "11px 20px", borderRadius: 7, border: `1px solid ${T.bd}`, background: "none", color: T.text, fontFamily: MONO, fontSize: 13, cursor: "pointer", textAlign: "left", letterSpacing: 0.5 }}>
        → send
      </button>
      {toast && <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{toast}</div>}
    </form>
  );
}

/* ── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [page,     setPage]     = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const W        = useWindowSize();
  const isMobile = W < 720;

  function go(p) { setPage(p); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const NAV = [["home", "home"], ["projects", "projects"], ["resume", "resume"], ["contact", "contact"]];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fd { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        button:not([disabled]):hover { opacity: 0.75; }
        a:hover { opacity: 0.70; }
        select option { background: #0e0e13; color: #e2e2ee; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        ::placeholder { color: #50507a; }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${T.bg}f0`, backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${T.bd}`,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "15px 20px" : "0 0", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: isMobile ? "auto" : 54 }}>
          <button type="button" onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", color: T.text, fontWeight: 800, fontSize: 15, padding: 0, letterSpacing: -0.3 }}>
            Kyle Suda
          </button>

          {!isMobile && (
            <nav style={{ display: "flex", gap: 22, alignItems: "center" }}>
              {NAV.map(([id, lbl]) => (
                <button key={id} type="button" onClick={() => go(id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: MONO, fontSize: 12, letterSpacing: 0.5,
                  color: page === id ? T.text : T.dim, padding: 0,
                }}>
                  {lbl}
                </button>
              ))}
              <span style={{ color: T.faint, userSelect: "none" }}>·</span>
              <button type="button" onClick={() => go("ufc")} style={{
                background: "none", cursor: "pointer",
                border: `1px solid ${page === "ufc" ? `${T.red}55` : T.bd}`,
                borderRadius: 6, padding: "6px 12px",
                fontFamily: MONO, fontSize: 12, letterSpacing: 0.5,
                color: page === "ufc" ? T.red : T.dim,
                transition: "border-color 150ms, color 150ms",
              }}>
                ufc predictor
              </button>
            </nav>
          )}

          {isMobile && (
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => go("ufc")} style={{ background: "none", border: `1px solid ${T.red}44`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: T.red }}>ufc</button>
              <button type="button" onClick={() => setMenuOpen((m) => !m)} style={{ background: "none", border: `1px solid ${T.bd}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: T.dim, fontFamily: MONO, fontSize: 14 }}>
                {menuOpen ? "×" : "≡"}
              </button>
            </div>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={{ borderTop: `1px solid ${T.bd}`, padding: "10px 20px 14px", background: T.bg, display: "grid", gap: 0 }}>
            {NAV.map(([id, lbl]) => (
              <button key={id} type="button" onClick={() => go(id)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: MONO, fontSize: 13, color: page === id ? T.text : T.dim,
                padding: "9px 0", textAlign: "left", borderBottom: `1px solid ${T.faint}`,
              }}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Page ─────────────────────────────────────────────────────────── */}
      <main key={page} style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "44px 20px 90px" : "56px 0 110px", animation: "fd 220ms ease both" }}>

        {/* ═══ UFC ═════════════════════════════════════════════════════════ */}
        {page === "ufc" && <UFCPage isMobile={isMobile} />}

        {/* ═══ HOME ════════════════════════════════════════════════════════ */}
        {page === "home" && (
          <div style={{ display: "grid", gap: 60 }}>

            {/* Hero */}
            <div>
              <h1 style={{ margin: "0 0 6px", fontSize: isMobile ? 34 : 46, fontWeight: 800, letterSpacing: -1.4, color: T.text, lineHeight: 1 }}>
                {CONTENT.name}
              </h1>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginBottom: 20, letterSpacing: 0.5 }}>
                {CONTENT.role}
              </div>
              <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.8, maxWidth: 540 }}>
                {CONTENT.tagline}
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 22, flexWrap: "wrap", alignItems: "center" }}>
                <a href={`mailto:${CONTENT.contact.email}`} style={{ fontFamily: MONO, fontSize: 12, color: T.text, textDecoration: "none", borderBottom: `1px solid ${T.dim}` }}>email</a>
                <a href={CONTENT.contact.github}   target="_blank" rel="noreferrer" style={{ fontFamily: MONO, fontSize: 12, color: T.dim, textDecoration: "none", borderBottom: `1px solid ${T.faint}` }}>github</a>
                <a href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={{ fontFamily: MONO, fontSize: 12, color: T.dim, textDecoration: "none", borderBottom: `1px solid ${T.faint}` }}>linkedin</a>
                <button type="button" onClick={() => go("ufc")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 12, color: T.red, padding: 0, borderBottom: `1px solid ${T.red}55` }}>
                  ufc predictor →
                </button>
              </div>
            </div>

            {/* Projects */}
            <div>
              <Lbl>projects</Lbl>
              {CONTENT.projects.map((p, i) => (
                <div key={p.id} style={{ borderBottom: `1px solid ${T.bd}`, paddingBottom: 22, marginBottom: 22, animation: `fd 200ms ease ${i * 55}ms both` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{p.id} @</span>
                    <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>{p.name}</span>
                    {p.live && <span style={{ fontFamily: MONO, fontSize: 9, color: T.green, border: `1px solid ${T.green}44`, padding: "1px 6px", borderRadius: 4, letterSpacing: 0.8 }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, maxWidth: 580, marginBottom: 10 }}>{p.blurb}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {p.stack.map((t) => <span key={t} style={{ fontFamily: MONO, fontSize: 10, color: "#30304a", letterSpacing: 0.2 }}>{t}</span>)}
                    {p.page && <button type="button" onClick={() => go(p.page)} style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: T.dim, background: "none", border: `1px solid ${T.bd}`, borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>open →</button>}
                    {p.github && <a href={p.github} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: T.dim, textDecoration: "none", border: `1px solid ${T.bd}`, borderRadius: 5, padding: "3px 10px" }}>github →</a>}
                  </div>
                </div>
              ))}
            </div>

            {/* About + Skills */}
            <div>
              <Lbl>about</Lbl>
              {CONTENT.about.map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: T.dim, lineHeight: 1.8, marginBottom: 10 }}>{p}</div>
              ))}
              <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
                {Object.entries(CONTENT.skills).map(([cat, items]) => (
                  <div key={cat} style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, minWidth: 64, flexShrink: 0 }}>{cat}</span>
                    <span style={{ fontSize: 13, color: T.dim }}>{items.join(" · ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <Lbl>experience</Lbl>
              <div style={{ display: "grid", gap: 22 }}>
                {CONTENT.experience.map((e) => (
                  <div key={e.role}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{e.role}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginLeft: 10 }}>· {e.org}</span>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{e.timeframe}</span>
                    </div>
                    {e.points.map((pt) => <div key={pt} style={{ fontSize: 12, color: T.dim, paddingLeft: 12, borderLeft: `2px solid ${T.faint}`, marginBottom: 4, lineHeight: 1.6 }}>{pt}</div>)}
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <Lbl>education</Lbl>
              {CONTENT.education.map((ed) => (
                <div key={ed.school} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{ed.school}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginLeft: 10 }}>· {ed.program}</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{ed.timeframe}</span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ═══ PROJECTS ════════════════════════════════════════════════════ */}
        {page === "projects" && (
          <div>
            <h2 style={{ margin: "0 0 36px", fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: -0.8 }}>projects</h2>
            {CONTENT.projects.map((p, i) => (
              <div key={p.id} style={{ borderBottom: `1px solid ${T.bd}`, paddingBottom: 26, marginBottom: 26, animation: `fd 200ms ease ${i * 55}ms both` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{p.id} @</span>
                  <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.4 }}>{p.name}</span>
                  {p.live && <span style={{ fontFamily: MONO, fontSize: 9, color: T.green, border: `1px solid ${T.green}44`, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.8 }}>LIVE</span>}
                </div>
                <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.75, maxWidth: 580, marginBottom: 14 }}>{p.blurb}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {p.stack.map((t) => <span key={t} style={{ fontFamily: MONO, fontSize: 10, color: T.dim, background: T.surf, border: `1px solid ${T.bd}`, padding: "3px 8px", borderRadius: 5 }}>{t}</span>)}
                  {p.page   && <button type="button" onClick={() => go(p.page)} style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: T.text, background: "none", border: `1px solid ${T.bd}`, borderRadius: 5, padding: "5px 14px", cursor: "pointer" }}>open →</button>}
                  {p.github && <a href={p.github} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: T.dim, textDecoration: "none", border: `1px solid ${T.bd}`, borderRadius: 5, padding: "5px 14px" }}>github →</a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ RESUME ══════════════════════════════════════════════════════ */}
        {page === "resume" && (
          <div style={{ display: "grid", gap: 44 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: -0.8 }}>resume</h2>

            <div>
              <Lbl>skills</Lbl>
              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(CONTENT.skills).map(([cat, items]) => (
                  <div key={cat} style={{ display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, minWidth: 64, flexShrink: 0 }}>{cat}</span>
                    <span style={{ fontSize: 13, color: T.dim }}>{items.join(" · ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Lbl>experience</Lbl>
              <div style={{ display: "grid", gap: 24 }}>
                {CONTENT.experience.map((e) => (
                  <div key={e.role}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{e.role}</span>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginLeft: 10 }}>· {e.org}</span>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{e.timeframe}</span>
                    </div>
                    {e.points.map((pt) => <div key={pt} style={{ fontSize: 13, color: T.dim, paddingLeft: 12, borderLeft: `2px solid ${T.faint}`, marginBottom: 5, lineHeight: 1.65 }}>{pt}</div>)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Lbl>education</Lbl>
              {CONTENT.education.map((ed) => (
                <div key={ed.school} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{ed.school}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginLeft: 10 }}>· {ed.program}</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>{ed.timeframe}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CONTACT ═════════════════════════════════════════════════════ */}
        {page === "contact" && (
          <div>
            <h2 style={{ margin: "0 0 32px", fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: -0.8 }}>contact</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { lbl: "email",    href: `mailto:${CONTENT.contact.email}`,       val: CONTENT.contact.email },
                { lbl: "github",   href: CONTENT.contact.github,                   val: "github.com/kyle-suda" },
                { lbl: "linkedin", href: CONTENT.contact.linkedin,                 val: "linkedin.com/in/kylesuda" },
              ].map((l) => (
                <div key={l.lbl} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, minWidth: 60 }}>{l.lbl}</span>
                  <a href={l.href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: T.text, textDecoration: "none", borderBottom: `1px solid ${T.dim}` }}>{l.val}</a>
                </div>
              ))}
            </div>
            <ContactForm />
          </div>
        )}
      </main>

      <footer style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "20px 20px 44px" : "20px 0 44px", borderTop: `1px solid ${T.bd}` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim }}>© {new Date().getFullYear()} Kyle Suda</div>
      </footer>
    </div>
  );
}
