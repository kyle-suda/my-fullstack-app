import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Personal Portfolio — kylesuda.com
 * Sections: Home, Projects, UFC Predictor, Resume, Contact
 */

const UFC_API = "https://vibrant-healing-ufc-api-production.up.railway.app";

const CONTENT = {
  name: "Kyle Suda",
  title: "Cybersecurity • Full-Stack Developer • Student",
  location: "Tampa, FL",
  tagline:
    "I build secure, reliable apps and learn fast through hands-on labs, projects, and real-world security practice.",
  about: [
    "I'm focused on cybersecurity and full-stack development—building practical projects while studying security fundamentals, networking, and secure software design.",
    "I enjoy hands-on labs (Wireshark, IDS/Snort, honeypots, HTB-style environments) and turning what I learn into clean, usable tools and dashboards.",
    "I'm especially interested in defensive security, detection engineering, and building systems that are secure by design.",
  ],
  highlights: [
    { label: "Focus", value: "Cybersecurity + Full-Stack" },
    { label: "Strength", value: "ML + Hands-on labs" },
    { label: "Goal", value: "Security / SOC / AppSec" },
    { label: "Tech", value: "React • Node • Python • ML" },
  ],
  skills: {
    Security: ["Network fundamentals", "IDS/IPS basics", "Threat intel concepts", "Secure coding basics"],
    Development: ["React", "Node/Express", "Prisma ORM", "REST APIs"],
    "ML / Data": ["Python", "XGBoost", "LightGBM", "Feature Engineering", "Elo Systems"],
    Tools: ["Wireshark", "Nmap", "Snort", "Linux CLI"],
    Workflow: ["Git/GitHub", "Documentation", "Debugging", "Testing mindset"],
  },
  projects: [
    {
      name: "UFC Fight Prediction Engine",
      blurb:
        "ML model that predicts UFC fight outcomes with 77% winner accuracy on held-out fights. Uses XGBoost + LightGBM ensembles, an Elo rating system, strength-of-schedule, Bayesian stat smoothing, and value-bet analysis against Vegas odds.",
      stack: ["Python", "XGBoost", "LightGBM", "Flask", "React"],
      bullets: [
        "Built end-to-end pipeline: data scraping → feature engineering → TimeSeriesSplit CV → stacking ensemble",
        "Implemented incremental Elo ratings across 7,000+ historical fights to capture fighter momentum",
        "Integrated vig-adjusted Vegas odds to detect edges and compute Kelly criterion bet sizing",
        "Deployed as a live Flask API with a React UI on kylesuda.com",
      ],
      links: [],
      featured: true,
    },
    {
      name: "User Ops Suite",
      blurb:
        "A full-stack user dashboard with search, insights, and activity views. Built to validate API + DB wiring and practice UI polish.",
      stack: ["React", "Node/Express", "Prisma", "PostgreSQL"],
      bullets: [
        "Implemented list/search/sort/pagination patterns and a custom UI shell",
        "Added multiple pages (Dashboard / Insights / Activity) for analytics and system visibility",
        "Designed for clean error handling and predictable UX",
      ],
      links: [
        { label: "GitHub", href: "https://github.com/yourusername/yourrepo" },
        { label: "Live Demo", href: "https://your-demo-link.com" },
      ],
    },
    {
      name: "Security Lab Notes (Wireshark + IDS)",
      blurb:
        "A curated set of notes and mini-tools from networking and security labs: TCP analysis, HTTP traces, IDS rules, and detection thinking.",
      stack: ["Wireshark", "Snort", "Linux"],
      bullets: [
        "Analyzed packet traces and extracted meaningful metrics (RTT, throughput, retransmissions)",
        "Created and tested IDS rules to detect suspicious traffic patterns",
        "Focused on clarity: steps, screenshots, and repeatable procedures",
      ],
      links: [{ label: "Write-up", href: "https://your-notes-link.com" }],
    },
    {
      name: "Honeypot Practice Environment",
      blurb:
        "Hands-on environment for observing attacker behavior and practicing detection/triage workflows.",
      stack: ["Honeypot VM", "SSH logging", "Linux"],
      bullets: [
        "Captured and reviewed attacker sessions and common credential-guessing behavior",
        "Practiced safe handling of IOCs and log analysis patterns",
        "Used a controlled environment with clear scope and documentation",
      ],
      links: [],
    },
  ],
  experience: [
    {
      role: "Student (Cybersecurity + CS Coursework)",
      org: "University of South Florida (USF)",
      timeframe: "2024 – Present",
      points: [
        "Built full-stack apps and security labs to strengthen fundamentals",
        "Practiced network analysis, IDS concepts, and secure development habits",
        "Documented work clearly for repeatable results and grading rubrics",
      ],
    },
    {
      role: "Independent Projects",
      org: "Personal Portfolio",
      timeframe: "Ongoing",
      points: [
        "Developing projects that combine security + usability",
        "Iterating with feedback and improving design clarity",
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
    email: "youremail@example.com",
    linkedin: "https://www.linkedin.com/in/yourprofile",
    github: "https://github.com/yourusername",
    website: "https://kylesuda.com",
  },
};

const WEIGHT_CLASSES = [
  "Heavyweight",
  "Light Heavyweight",
  "Middleweight",
  "Welterweight",
  "Lightweight",
  "Featherweight",
  "Bantamweight",
  "Flyweight",
  "Women's Featherweight",
  "Women's Bantamweight",
  "Women's Flyweight",
  "Women's Strawweight",
];

// ─── utilities ────────────────────────────────────────────────────────────────
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function useAnimatedBackground(mode = "dark") {
  const [t, setT] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const loop = (now) => {
      const dt = now - last;
      last = now;
      setT((x) => (x + dt * 0.00008) % 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const style = useMemo(() => {
    const dark = mode === "dark";
    const a = dark ? "#070a12" : "#f7f8fc";
    const b = dark ? "#0b1a2d" : "#e9f2ff";
    const c = dark ? "#1a1146" : "#fff0f7";
    const d = dark ? "#06251b" : "#f2fff6";
    const x1 = 25 + 35 * Math.sin(t * Math.PI * 2);
    const y1 = 22 + 18 * Math.cos(t * Math.PI * 2);
    const x2 = 70 + 20 * Math.cos(t * Math.PI * 2);
    const y2 = 68 + 18 * Math.sin(t * Math.PI * 2);
    return {
      backgroundImage: `
        radial-gradient(900px 600px at ${x1}% ${y1}%, ${c} 0%, transparent 58%),
        radial-gradient(900px 620px at ${x2}% ${y2}%, ${b} 0%, transparent 60%),
        linear-gradient(135deg, ${a} 0%, ${dark ? "#0b0f14" : "#ffffff"} 65%, ${d} 120%)
      `,
    };
  }, [t, mode]);

  const particles = useMemo(() => {
    const n = 18;
    return Array.from({ length: n }).map((_, i) => {
      const seed = (i + 1) * 991;
      const x = (seed % 1000) / 10;
      const y = ((seed * 7) % 1000) / 10;
      const s = 6 + ((seed * 13) % 20);
      const dur = 10 + ((seed * 3) % 16);
      const o = 0.06 + (((seed * 5) % 100) / 1000);
      return { i, x, y, s, dur, o };
    });
  }, []);

  return { style, particles };
}

// ─── icons ────────────────────────────────────────────────────────────────────
function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (name === "home")
    return <svg {...common}><path {...stroke} d="M3 10.5 12 3l9 7.5V21a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 21V10.5Z" /><path {...stroke} d="M9 22V13h6v9" /></svg>;
  if (name === "code")
    return <svg {...common}><path {...stroke} d="M16 18 22 12 16 6" /><path {...stroke} d="M8 6 2 12l6 6" /><path {...stroke} d="M14 4 10 20" /></svg>;
  if (name === "doc")
    return <svg {...common}><path {...stroke} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path {...stroke} d="M14 2v6h6" /><path {...stroke} d="M8 13h8" /><path {...stroke} d="M8 17h8" /></svg>;
  if (name === "mail")
    return <svg {...common}><path {...stroke} d="M4 4h16v16H4z" /><path {...stroke} d="m4 6 8 7 8-7" /></svg>;
  if (name === "moon")
    return <svg {...common}><path {...stroke} d="M21 12.5A8.5 8.5 0 0 1 11.5 3a7.5 7.5 0 1 0 9.5 9.5Z" /></svg>;
  if (name === "sun")
    return <svg {...common}><circle {...stroke} cx="12" cy="12" r="4" /><path {...stroke} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>;
  if (name === "link")
    return <svg {...common}><path {...stroke} d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" /><path {...stroke} d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" /></svg>;
  if (name === "chev")
    return <svg {...common}><path {...stroke} d="M6 9l6 6 6-6" /></svg>;
  if (name === "ufc")
    return <svg {...common}><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M12 7v5l3 3" /></svg>;
  if (name === "search")
    return <svg {...common}><circle {...stroke} cx="11" cy="11" r="7" /><path {...stroke} d="M21 21l-4.35-4.35" /></svg>;
  if (name === "x")
    return <svg {...common}><path {...stroke} d="M18 6 6 18M6 6l12 12" /></svg>;
  if (name === "loader")
    return <svg {...common} style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 28" fill="none" /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>;
  return null;
}

function Section({ id, children, style }) {
  return <section id={id} style={{ scrollMarginTop: 96, ...style }}>{children}</section>;
}

// ─── Fighter autocomplete ─────────────────────────────────────────────────────
function FighterSearch({ value, onChange, placeholder, accent, styles }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query === value) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${UFC_API}/fighters?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setSuggestions(d.fighters || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [query]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(name) {
    setQuery(name);
    setSuggestions([]);
    setOpen(false);
    onChange(name);
  }

  function clear() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onChange("");
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 10, opacity: 0.5 }}>
          {loading ? <Icon name="loader" size={16} /> : <Icon name="search" size={16} />}
        </span>
        <input
          style={{
            ...styles.input,
            paddingLeft: 34,
            paddingRight: 34,
            borderColor: accent,
            boxShadow: `0 0 0 1px ${accent}44`,
          }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            style={{
              position: "absolute", right: 8, background: "none", border: "none",
              cursor: "pointer", color: "inherit", opacity: 0.5, padding: 2,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", zIndex: 50, top: "calc(100% + 4px)", left: 0, right: 0,
          background: "rgba(10,14,24,0.97)",
          border: `1px solid ${accent}55`,
          borderRadius: 12,
          maxHeight: 220,
          overflowY: "auto",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        }}>
          {suggestions.slice(0, 20).map((name) => (
            <div
              key={name}
              onClick={() => select(name)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                transition: "background 80ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}22`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfBar({ pct, color, label, right }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start", fontSize: 12, opacity: 0.7 }}>
        {label}
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${clamp(pct, 0, 100)}%`,
          borderRadius: 99,
          background: color,
          float: right ? "right" : "left",
          transition: "width 600ms cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <div style={{
        fontSize: 26, fontWeight: 1000, letterSpacing: -0.8,
        textAlign: right ? "right" : "left", color,
      }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── Method pills ─────────────────────────────────────────────────────────────
function MethodPills({ probs, styles }) {
  const order = ["KO/TKO", "Submission", "Decision", "Other/No Contest"];
  const colors = {
    "KO/TKO":           "#ef4444",
    "Submission":       "#8b5cf6",
    "Decision":         "#3b82f6",
    "Other/No Contest": "#6b7280",
  };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      {order.map((m) => {
        const p = probs[m] ?? 0;
        return (
          <div key={m} style={{
            ...styles.pill,
            flexDirection: "column",
            alignItems: "center",
            padding: "8px 14px",
            gap: 2,
            borderColor: colors[m] + "55",
            minWidth: 80,
          }}>
            <span style={{ fontSize: 18, fontWeight: 1000, color: colors[m] }}>{p.toFixed(0)}%</span>
            <span style={{ fontSize: 10, opacity: 0.7, textAlign: "center", lineHeight: 1.2 }}>{m}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── UFC Predictor section ────────────────────────────────────────────────────
function UFCPredictor({ styles, theme }) {
  const dark = theme === "dark";
  const RED_COLOR  = "#ef4444";
  const BLUE_COLOR = "#3b82f6";

  const [redName,  setRedName]  = useState("");
  const [blueName, setBlueName] = useState("");
  const [wc,       setWc]       = useState("Lightweight");
  const [titleFight, setTitleFight] = useState(false);
  const [rounds,   setRounds]   = useState(3);

  const [redOdds,  setRedOdds]  = useState("");
  const [blueOdds, setBlueOdds] = useState("");
  const [showOdds, setShowOdds] = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [apiOnline, setApiOnline] = useState(null);

  // Check API health
  useEffect(() => {
    fetch(`${UFC_API}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  async function predict() {
    if (!redName.trim() || !blueName.trim()) {
      setError("Please enter both fighter names.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {
        red_name: redName.trim(),
        blue_name: blueName.trim(),
        weight_class: wc,
        is_title_fight: titleFight,
        scheduled_rounds: rounds,
      };
      if (showOdds && redOdds)  body.red_odds  = parseFloat(redOdds);
      if (showOdds && blueOdds) body.blue_odds = parseFloat(blueOdds);

      const r = await fetch(`${UFC_API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "API error");
      setResult(d);
    } catch (e) {
      setError(e.message || "Could not reach the prediction API.");
    } finally {
      setLoading(false);
    }
  }

  const select = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
    background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)",
    color: dark ? "#e8eef6" : "#0b0f14",
    outline: "none",
    cursor: "pointer",
    fontWeight: 700,
    appearance: "none",
    WebkitAppearance: "none",
  };

  const toggle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* API status badge */}
      {apiOnline === false && (
        <div style={{
          ...styles.card,
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.35)",
          padding: "12px 16px",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 13 }}>
            ⚠️ Prediction API is offline. Start it with:
          </span>
          <code style={{ fontSize: 12, opacity: 0.9 }}>
            cd ufc-predictor &amp;&amp; source venv/bin/activate &amp;&amp; python3 src/api.py
          </code>
        </div>
      )}

      {/* Fighter inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "start" }}>
        <div style={{ ...styles.card, border: `1px solid ${RED_COLOR}44` }}>
          <div style={{ fontWeight: 1000, color: RED_COLOR, marginBottom: 10, fontSize: 13, letterSpacing: 0.5 }}>
            🔴 RED CORNER
          </div>
          <FighterSearch
            value={redName}
            onChange={setRedName}
            placeholder="Search fighter…"
            accent={RED_COLOR}
            styles={styles}
          />
        </div>

        <div style={{
          alignSelf: "center",
          fontWeight: 1000,
          fontSize: 18,
          opacity: 0.5,
          padding: "0 4px",
          letterSpacing: -0.5,
        }}>VS</div>

        <div style={{ ...styles.card, border: `1px solid ${BLUE_COLOR}44` }}>
          <div style={{ fontWeight: 1000, color: BLUE_COLOR, marginBottom: 10, fontSize: 13, letterSpacing: 0.5 }}>
            🔵 BLUE CORNER
          </div>
          <FighterSearch
            value={blueName}
            onChange={setBlueName}
            placeholder="Search fighter…"
            accent={BLUE_COLOR}
            styles={styles}
          />
        </div>
      </div>

      {/* Fight settings */}
      <div style={{ ...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>WEIGHT CLASS</label>
          <div style={{ position: "relative" }}>
            <select style={select} value={wc} onChange={(e) => setWc(e.target.value)}>
              {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }}>▾</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>SCHEDULED ROUNDS</label>
          <div style={{ position: "relative" }}>
            <select style={select} value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
              <option value={3}>3 Rounds</option>
              <option value={5}>5 Rounds (Main / Title)</option>
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }}>▾</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>OPTIONS</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            <label style={toggle}>
              <div style={{
                width: 36, height: 20, borderRadius: 99,
                background: titleFight ? "#3b82f6" : "rgba(255,255,255,0.15)",
                position: "relative",
                transition: "background 200ms",
                flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 3, left: titleFight ? 19 : 3,
                  width: 14, height: 14, borderRadius: 99, background: "white",
                  transition: "left 200ms",
                }} />
              </div>
              <input type="checkbox" hidden checked={titleFight} onChange={(e) => setTitleFight(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Title fight</span>
            </label>
            <label style={toggle}>
              <div style={{
                width: 36, height: 20, borderRadius: 99,
                background: showOdds ? "#3b82f6" : "rgba(255,255,255,0.15)",
                position: "relative",
                transition: "background 200ms",
                flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 3, left: showOdds ? 19 : 3,
                  width: 14, height: 14, borderRadius: 99, background: "white",
                  transition: "left 200ms",
                }} />
              </div>
              <input type="checkbox" hidden checked={showOdds} onChange={(e) => setShowOdds(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Include odds</span>
            </label>
          </div>
        </div>
      </div>

      {/* Odds inputs */}
      {showOdds && (
        <div style={{ ...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, color: RED_COLOR, fontWeight: 800 }}>RED CORNER ODDS (American)</label>
            <input
              style={{ ...styles.input, borderColor: RED_COLOR + "66" }}
              placeholder="e.g. -200 or +150"
              value={redOdds}
              onChange={(e) => setRedOdds(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, color: BLUE_COLOR, fontWeight: 800 }}>BLUE CORNER ODDS (American)</label>
            <input
              style={{ ...styles.input, borderColor: BLUE_COLOR + "66" }}
              placeholder="e.g. -200 or +150"
              value={blueOdds}
              onChange={(e) => setBlueOdds(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Predict button */}
      <button
        type="button"
        disabled={loading || apiOnline === false}
        onClick={predict}
        style={{
          padding: "16px 24px",
          borderRadius: 18,
          border: "none",
          background: loading || apiOnline === false
            ? "rgba(255,255,255,0.12)"
            : "linear-gradient(135deg, #ef4444, #3b82f6)",
          color: "white",
          fontWeight: 1000,
          fontSize: 16,
          cursor: loading || apiOnline === false ? "default" : "pointer",
          letterSpacing: -0.3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          transition: "opacity 150ms",
          opacity: loading || apiOnline === false ? 0.5 : 1,
        }}
      >
        {loading ? <Icon name="loader" size={20} /> : <Icon name="ufc" size={20} />}
        {loading ? "Analyzing…" : "Predict Fight"}
      </button>

      {error && (
        <div style={{
          ...styles.card, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)",
          padding: "12px 16px", fontSize: 13, color: "#ef4444",
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && <PredictionResult result={result} styles={styles} dark={dark} />}
    </div>
  );
}

// ─── Prediction result display ────────────────────────────────────────────────
function PredictionResult({ result, styles, dark }) {
  const RED_COLOR  = "#ef4444";
  const BLUE_COLOR = "#3b82f6";

  const redPct  = result.red_win_probability ?? (result.winner === result.red_fighter ? result.winner_confidence : result.loser_confidence);
  const bluePct = result.blue_win_probability ?? (result.winner === result.blue_fighter ? result.winner_confidence : result.loser_confidence);

  const winnerIsRed = result.winner === result.red_fighter;
  const winnerColor = winnerIsRed ? RED_COLOR : BLUE_COLOR;

  const v = result.value;
  const isValueBet = v && (Math.abs(v.r_edge) >= 8 || Math.abs(v.b_edge) >= 8);
  const valueFighter = v && v.r_edge >= 8 ? result.red_fighter : v && v.b_edge >= 8 ? result.blue_fighter : null;
  const valueEdge    = v && v.r_edge >= 8 ? v.r_edge : v && v.b_edge >= 8 ? v.b_edge : 0;
  const valueKelly   = v && v.r_edge >= 8 ? v.r_kelly : v && v.b_edge >= 8 ? v.b_kelly : 0;
  const valueColor   = v && v.r_edge >= 8 ? RED_COLOR : BLUE_COLOR;

  return (
    <div style={{ display: "grid", gap: 14, animation: "fadeInUp 350ms ease both" }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

      {/* Winner banner */}
      <div style={{
        ...styles.card,
        background: `linear-gradient(135deg, ${winnerColor}18, ${winnerColor}08)`,
        border: `1px solid ${winnerColor}44`,
        textAlign: "center",
        padding: "20px 16px",
      }}>
        <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>PREDICTED WINNER</div>
        <div style={{ fontSize: 32, fontWeight: 1000, letterSpacing: -1, color: winnerColor }}>
          {result.winner}
        </div>
        <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
          {result.predicted_method && `by ${result.predicted_method}`}
          {result.predicted_round && ` · Round ${result.predicted_round}`}
        </div>
        {result.r_elo && result.b_elo && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 16, fontSize: 12 }}>
            <span style={{ opacity: 0.6 }}>Elo:</span>
            <span style={{ color: RED_COLOR }}>{result.red_fighter.split(" ").at(-1)} {result.r_elo}</span>
            <span style={{ opacity: 0.4 }}>vs</span>
            <span style={{ color: BLUE_COLOR }}>{result.blue_fighter.split(" ").at(-1)} {result.b_elo}</span>
          </div>
        )}
      </div>

      {/* Win probability bars */}
      <div style={{ ...styles.card, display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
        <ConfBar pct={redPct} color={RED_COLOR} label={result.red_fighter} right={false} />
        <div style={{ opacity: 0.3, fontWeight: 1000, fontSize: 12 }}>WIN%</div>
        <ConfBar pct={bluePct} color={BLUE_COLOR} label={result.blue_fighter} right={true} />
      </div>

      {/* Method probabilities */}
      {result.method_probs && Object.keys(result.method_probs).length > 0 && (
        <div style={{ ...styles.card }}>
          <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800, letterSpacing: 0.5, marginBottom: 12 }}>METHOD OF VICTORY</div>
          <MethodPills probs={result.method_probs} styles={styles} />
        </div>
      )}

      {/* Value bet analysis */}
      {v && (
        <div style={{
          ...styles.card,
          background: isValueBet ? `${valueColor}12` : undefined,
          border: isValueBet ? `1px solid ${valueColor}44` : undefined,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800, letterSpacing: 0.5 }}>VALUE ANALYSIS</div>
            {isValueBet && (
              <div style={{
                background: `${valueColor}22`,
                border: `1px solid ${valueColor}55`,
                borderRadius: 99,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 1000,
                color: valueColor,
              }}>
                ⚡ VALUE BET
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: result.red_fighter, model: v.r_model_pct, vegas: v.r_vegas_pct, edge: v.r_edge, kelly: v.r_kelly, color: RED_COLOR },
              { label: result.blue_fighter, model: v.b_model_pct, vegas: v.b_vegas_pct, edge: v.b_edge, kelly: v.b_kelly, color: BLUE_COLOR },
            ].map((f) => (
              <div key={f.label} style={{ ...styles.card, padding: 12 }}>
                <div style={{ fontWeight: 1000, fontSize: 13, color: f.color, marginBottom: 8 }}>{f.label}</div>
                <div style={{ display: "grid", gap: 5, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ opacity: 0.6 }}>Model</span><span style={{ fontWeight: 900 }}>{f.model.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ opacity: 0.6 }}>Vegas (vig-adj)</span><span style={{ fontWeight: 900 }}>{f.vegas.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ opacity: 0.6 }}>Edge</span>
                    <span style={{ fontWeight: 1000, color: f.edge >= 8 ? "#22c55e" : f.edge >= 0 ? "inherit" : "#ef4444" }}>
                      {f.edge >= 0 ? "+" : ""}{f.edge.toFixed(1)}%
                    </span>
                  </div>
                  {f.kelly > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ opacity: 0.6 }}>Kelly bet</span>
                      <span style={{ fontWeight: 900, color: "#22c55e" }}>{f.kelly.toFixed(1)}% bankroll</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isValueBet && (
            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 12,
              background: `${valueColor}18`,
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              <strong style={{ color: valueColor }}>⚡ Value detected on {valueFighter}:</strong>{" "}
              Model gives +{valueEdge.toFixed(1)}% edge over vig-adjusted Vegas.
              Quarter-Kelly suggests betting {(valueKelly * 0.25).toFixed(1)}% of bankroll.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [active, setActive] = useState("home");
  const { style: bgStyle, particles } = useAnimatedBackground(theme);
  const shellRef = useRef(null);

  const styles = useMemo(() => {
    const dark = theme === "dark";
    const fg = dark ? "#e8eef6" : "#0b0f14";
    const subtle = dark ? "rgba(232,238,246,0.70)" : "rgba(11,15,20,0.62)";
    const cardBg = dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.86)";
    const border = dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)";

    return {
      app: {
        minHeight: "100vh",
        color: fg,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        position: "relative",
        overflowX: "hidden",
      },
      wrapper: {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "22px 18px 60px",
        display: "grid",
        gap: 18,
        position: "relative",
        zIndex: 2,
      },
      nav: {
        position: "sticky",
        top: 14,
        zIndex: 10,
        borderRadius: 22,
        padding: 14,
        background: dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.78)",
        border,
        backdropFilter: "blur(10px)",
        boxShadow: dark ? "0 18px 35px rgba(0,0,0,0.35)" : "0 16px 30px rgba(0,0,0,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      },
      brand: { display: "flex", alignItems: "center", gap: 12, minWidth: 180 },
      avatar: {
        width: 42, height: 42, borderRadius: 18,
        display: "grid", placeItems: "center",
        fontWeight: 1000, letterSpacing: -0.6,
        background: dark
          ? "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(147,51,234,0.30))"
          : "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.14))",
        border,
      },
      navTabs: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
      tab: (isActive) => ({
        borderRadius: 14,
        padding: "10px 12px",
        border: isActive
          ? dark ? "1px solid rgba(59,130,246,0.50)" : "1px solid rgba(37,99,235,0.35)"
          : border,
        background: isActive
          ? dark
            ? "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(147,51,234,0.14))"
            : "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.08))"
          : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.70)",
        color: fg,
        fontWeight: 900,
        cursor: "pointer",
        display: "inline-flex",
        gap: 10,
        alignItems: "center",
        transition: "transform 120ms ease, filter 120ms ease",
      }),
      ufcTab: (isActive) => ({
        borderRadius: 14,
        padding: "10px 12px",
        border: isActive ? "1px solid rgba(239,68,68,0.55)" : border,
        background: isActive
          ? "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(59,130,246,0.14))"
          : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.70)",
        color: isActive ? "#ef4444" : fg,
        fontWeight: 900,
        cursor: "pointer",
        display: "inline-flex",
        gap: 10,
        alignItems: "center",
        transition: "transform 120ms ease, filter 120ms ease",
      }),
      btn: (variant = "ghost") => ({
        borderRadius: 14,
        padding: "10px 12px",
        border: variant === "primary" ? "none" : border,
        background:
          variant === "primary"
            ? dark
              ? "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(147,51,234,0.90))"
              : "linear-gradient(135deg, #2563eb, #7c3aed)"
            : "transparent",
        color: variant === "primary" ? "white" : fg,
        fontWeight: 900,
        cursor: "pointer",
        display: "inline-flex",
        gap: 10,
        alignItems: "center",
        transition: "transform 120ms ease, filter 120ms ease",
      }),
      hero: {
        borderRadius: 26, padding: "26px 22px",
        background: cardBg, border, backdropFilter: "blur(10px)",
        boxShadow: dark ? "0 18px 35px rgba(0,0,0,0.40)" : "0 16px 30px rgba(0,0,0,0.10)",
      },
      grid2: {
        display: "grid",
        gridTemplateColumns: "1.35fr 0.65fr",
        gap: 16,
      },
      card: {
        borderRadius: 20, padding: 16,
        background: cardBg, border, backdropFilter: "blur(10px)",
        boxShadow: dark ? "0 18px 35px rgba(0,0,0,0.30)" : "0 16px 30px rgba(0,0,0,0.08)",
      },
      subtle: { color: subtle },
      pill: {
        display: "inline-flex", alignItems: "center", gap: 8,
        borderRadius: 999, padding: "7px 12px",
        background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
        border, fontSize: 12, fontWeight: 800,
      },
      h1: { margin: 0, fontSize: 40, letterSpacing: -1.1, lineHeight: 1.05 },
      h2: { margin: 0, fontSize: 20, letterSpacing: -0.4 },
      hr: {
        border: "none", height: 1,
        background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
        margin: "14px 0",
      },
      link: { color: fg, textDecoration: "none", fontWeight: 900 },
      aGhost: {
        display: "inline-flex", gap: 10, alignItems: "center",
        padding: "10px 12px", borderRadius: 14, border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.75)",
        color: fg, textDecoration: "none", fontWeight: 900,
      },
      input: {
        width: "100%", padding: "12px 12px", borderRadius: 14, border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)",
        color: fg, outline: "none", boxSizing: "border-box",
      },
      textarea: {
        width: "100%", padding: "12px 12px", borderRadius: 14, border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)",
        color: fg, outline: "none", minHeight: 120, resize: "vertical",
      },
      footer: { textAlign: "center", fontSize: 12, color: subtle, paddingTop: 8 },
    };
  }, [theme]);

  // sync active nav with scroll
  useEffect(() => {
    const handler = () => {
      const ids = ["home", "projects", "ufc", "resume", "contact"];
      let best = "home", bestDist = Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 110);
        if (dist < bestDist) { bestDist = dist; best = id; }
      }
      setActive(best);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={styles.app} ref={shellRef}>
      {/* Background */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", ...bgStyle }} />
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage: theme === "dark"
          ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
          : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        opacity: theme === "dark" ? 0.26 : 0.18,
        maskImage: "radial-gradient(900px 600px at 50% 18%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
      }} />
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {particles.map((p) => (
          <div key={p.i} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: 999,
            background: theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)",
            opacity: p.o, transform: "translate(-50%, -50%)",
            animation: `floaty ${p.dur}s ease-in-out ${-(p.i % 7)}s infinite alternate`,
            filter: "blur(0.2px)",
          }} />
        ))}
        <style>{`
          @keyframes floaty {
            from { transform: translate(-50%, -50%) translate3d(-12px, -8px, 0); }
            to   { transform: translate(-50%, -50%) translate3d(18px, 16px, 0); }
          }
          button:hover { transform: translateY(-1px); filter: brightness(1.03); }
          a:hover { transform: translateY(-1px); filter: brightness(1.02); }
          * { box-sizing: border-box; }
        `}</style>
      </div>

      <div style={styles.wrapper}>
        {/* NAV */}
        <nav style={styles.nav}>
          <div style={styles.brand}>
            <div style={styles.avatar}>{CONTENT.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 1000, letterSpacing: -0.6 }}>{CONTENT.name}</div>
              <div style={{ fontSize: 12, ...styles.subtle }}>{CONTENT.title}</div>
            </div>
          </div>

          <div style={styles.navTabs}>
            {[["home","Home","home"],["projects","Projects","code"],["resume","Resume","doc"],["contact","Contact","mail"]].map(([id, label, icon]) => (
              <button key={id} type="button" style={styles.tab(active === id)} onClick={() => scrollTo(id)}>
                <Icon name={icon} /> {label}
              </button>
            ))}
            <button type="button" style={styles.ufcTab(active === "ufc")} onClick={() => scrollTo("ufc")}>
              <Icon name="ufc" /> UFC Predictor
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" style={styles.btn()} onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Icon name="moon" /> : <Icon name="sun" />}
            </button>
            <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={styles.btn("primary")}>
              <Icon name="link" /> GitHub
            </a>
          </div>
        </nav>

        {/* HERO */}
        <Section id="home" style={styles.hero}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={styles.pill}>{CONTENT.location}</div>
              <div style={styles.pill}>Open to opportunities</div>
              <div style={styles.pill}>Security-minded builder</div>
            </div>
            <h1 style={styles.h1}>{CONTENT.tagline}</h1>
            <div style={{ display: "grid", gap: 10, ...styles.subtle, fontSize: 14, lineHeight: 1.6, maxWidth: 900 }}>
              {CONTENT.about.map((p, i) => <div key={i}>{p}</div>)}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <a href={`mailto:${CONTENT.contact.email}`} style={styles.btn("primary")}><Icon name="mail" /> Email Me</a>
              <a href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={styles.btn()}><Icon name="link" /> LinkedIn</a>
              <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={styles.btn()}><Icon name="link" /> GitHub</a>
              <button type="button" style={styles.btn()} onClick={() => scrollTo("ufc")}>
                <Icon name="ufc" /> Try UFC Predictor
              </button>
            </div>
          </div>
        </Section>

        {/* HIGHLIGHTS + SKILLS */}
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={styles.h2}>Highlights</h2>
              <span style={styles.pill}>What I'm working on</span>
            </div>
            <div style={styles.hr} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {CONTENT.highlights.map((h) => (
                <div key={h.label} style={{ ...styles.card, padding: 14 }}>
                  <div style={{ ...styles.subtle, fontSize: 12 }}>{h.label}</div>
                  <div style={{ fontWeight: 1000, letterSpacing: -0.4, marginTop: 4 }}>{h.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>Skills Snapshot</h2>
            <div style={styles.hr} />
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(CONTENT.skills).map(([group, items]) => (
                <div key={group} style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 1000 }}>{group}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {items.map((s) => <span key={s} style={styles.pill}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROJECTS */}
        <Section id="projects" style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={styles.h2}>Projects</h2>
            <span style={styles.pill}>Selected work</span>
          </div>
          <div style={styles.hr} />
          <div style={{ display: "grid", gap: 14 }}>
            {CONTENT.projects.map((p) => (
              <div key={p.name} style={{
                ...styles.card,
                ...(p.featured ? {
                  background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(59,130,246,0.06))",
                  border: "1px solid rgba(239,68,68,0.25)",
                } : {}),
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 1100, letterSpacing: -0.5, fontSize: 16 }}>{p.name}</div>
                      {p.featured && (
                        <span style={{
                          ...styles.pill,
                          background: "rgba(239,68,68,0.15)",
                          borderColor: "rgba(239,68,68,0.35)",
                          color: "#ef4444",
                          fontSize: 10,
                          padding: "4px 9px",
                        }}>★ FEATURED</span>
                      )}
                    </div>
                    <div style={{ ...styles.subtle, lineHeight: 1.6 }}>{p.blurb}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {p.stack.map((t) => <span key={t} style={styles.pill}>{t}</span>)}
                  </div>
                </div>
                <div style={styles.hr} />
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, ...styles.subtle, lineHeight: 1.6 }}>
                  {p.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                {p.featured && (
                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => document.getElementById("ufc")?.scrollIntoView({ behavior: "smooth" })}
                      style={{ ...styles.btn("primary"), fontSize: 13 }}>
                      <Icon name="ufc" size={16} /> Try It Live →
                    </button>
                  </div>
                )}
                {p.links?.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {p.links.map((l) => (
                      <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={styles.aGhost}>
                        <Icon name="link" /> {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* UFC PREDICTOR */}
        <Section id="ufc" style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <h2 style={{ ...styles.h2, background: "linear-gradient(135deg, #ef4444, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                UFC Fight Predictor
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={styles.pill}>77% accuracy</span>
              <span style={styles.pill}>7,190 fights trained</span>
              <span style={styles.pill}>Elo + ML ensemble</span>
            </div>
          </div>
          <div style={{ ...styles.subtle, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Search any two UFC fighters, set the fight context, and get an instant ML prediction: winner confidence, method of victory breakdown, and value-bet analysis against Vegas odds.
          </div>
          <div style={styles.hr} />
          <UFCPredictor styles={styles} theme={theme} />
        </Section>

        {/* RESUME */}
        <Section id="resume" style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={styles.h2}>Resume</h2>
            <span style={styles.pill}>Experience & Education</span>
          </div>
          <div style={styles.hr} />
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Experience</div>
                <div style={styles.hr} />
                <div style={{ display: "grid", gap: 12 }}>
                  {CONTENT.experience.map((e) => (
                    <div key={e.role} style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 1000 }}>{e.role} • {e.org}</div>
                        <div style={{ ...styles.subtle, fontSize: 12 }}>{e.timeframe}</div>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, ...styles.subtle, lineHeight: 1.6 }}>
                        {e.points.map((pt) => <li key={pt}>{pt}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Education</div>
                <div style={styles.hr} />
                <div style={{ display: "grid", gap: 12 }}>
                  {CONTENT.education.map((ed) => (
                    <div key={ed.school} style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 1000 }}>{ed.school}</div>
                        <div style={{ ...styles.subtle, fontSize: 12 }}>{ed.timeframe}</div>
                      </div>
                      <div style={styles.subtle}>{ed.program}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {ed.notes.map((n) => <span key={n} style={styles.pill}>{n}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Certifications</div>
                <div style={styles.hr} />
                <div style={{ display: "grid", gap: 10 }}>
                  {CONTENT.certifications.map((c) => (
                    <div key={c.name} style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900 }}>{c.name}</div>
                      <div style={{ ...styles.subtle, fontSize: 12 }}>{c.year}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Download</div>
                <div style={styles.hr} />
                <div style={{ ...styles.subtle, lineHeight: 1.6 }}>Add a PDF resume link when you have one.</div>
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={CONTENT.contact.website} target="_blank" rel="noreferrer" style={styles.aGhost}>
                    <Icon name="link" /> Portfolio Link
                  </a>
                </div>
              </div>
              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>What I'm looking for</div>
                <div style={styles.hr} />
                <div style={{ ...styles.subtle, lineHeight: 1.6 }}>
                  Entry-level roles or internships in security, SOC, AppSec, or secure full-stack development.
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* CONTACT */}
        <Section id="contact" style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={styles.h2}>Contact</h2>
            <span style={styles.pill}>Let's talk</span>
          </div>
          <div style={styles.hr} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ ...styles.subtle, lineHeight: 1.6 }}>
                Want to connect about internships, projects, or security work? The fastest way to reach me is email.
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <a href={`mailto:${CONTENT.contact.email}`} style={styles.aGhost}><Icon name="mail" /> {CONTENT.contact.email}</a>
                <a href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={styles.aGhost}><Icon name="link" /> LinkedIn</a>
                <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={styles.aGhost}><Icon name="link" /> GitHub</a>
              </div>
            </div>
            <ContactForm styles={styles} />
          </div>
        </Section>

        <div style={styles.footer}>
          © {new Date().getFullYear()} {CONTENT.name} • Built with React • UFC Predictor powered by XGBoost + LightGBM
        </div>
      </div>
    </div>
  );
}

function ContactForm({ styles }) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg]     = useState("");
  const [toast, setToast] = useState("");

  function submit(e) {
    e.preventDefault();
    const n = name.trim(), em = email.trim(), m = msg.trim();
    if (!n || !em.includes("@") || m.length < 10) {
      setToast("Please add your name, a valid email, and a message (10+ chars).");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }
    const subject = encodeURIComponent(`Portfolio message from ${n}`);
    const body    = encodeURIComponent(`Name: ${n}\nEmail: ${em}\n\n${m}`);
    window.location.href = `mailto:${CONTENT.contact.email}?subject=${subject}&body=${body}`;
    setToast("Opening your email app…");
    window.setTimeout(() => setToast(""), 1600);
  }

  return (
    <div style={styles.card}>
      <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Send a message</div>
      <div style={styles.hr} />
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input style={styles.input} placeholder="Your name"    value={name}  onChange={(e) => setName(e.target.value)} />
        <input style={styles.input} placeholder="Your email"   value={email} onChange={(e) => setEmail(e.target.value)} />
        <textarea style={styles.textarea} placeholder="What would you like to talk about?" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button type="submit" style={styles.btn("primary")}><Icon name="mail" /> Send</button>
      </form>
      {toast && <div style={{ marginTop: 10, ...styles.subtle, fontWeight: 900 }}>{toast}</div>}
    </div>
  );
}
