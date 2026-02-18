/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App*/

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Personal Professional Website (single-file App.jsx)
 * - Custom UI (no external libraries)
 * - Animated background + floating particles
 * - Multi-page nav: Home, Projects, Resume, Contact
 * - Smooth scroll + section-based routing feel
 * - Edit the CONTENT object to personalize everything
 */

const CONTENT = {
  name: "Kyle Suda",
  title: "Cybersecurity • Full-Stack Developer • Student",
  location: "Tampa, FL",
  tagline:
    "I build secure, reliable apps and learn fast through hands-on labs, projects, and real-world security practice.",
  about: [
    "I’m focused on cybersecurity and full-stack development—building practical projects while studying security fundamentals, networking, and secure software design.",
    "I enjoy hands-on labs (Wireshark, IDS/Snort, honeypots, HTB-style environments) and turning what I learn into clean, usable tools and dashboards.",
    "I’m especially interested in defensive security, detection engineering, and building systems that are secure by design.",
  ],
  highlights: [
    { label: "Focus", value: "Cybersecurity + Full-Stack" },
    { label: "Strength", value: "Hands-on labs & building" },
    { label: "Goal", value: "Security / SOC / AppSec" },
    { label: "Tech", value: "React • Node • Prisma • SQL" },
  ],
  skills: {
    "Security": ["Network fundamentals", "IDS/IPS basics", "Threat intel concepts", "Secure coding basics"],
    "Development": ["React", "Node/Express", "Prisma ORM", "REST APIs"],
    "Tools": ["Wireshark", "Nmap", "Snort", "Linux CLI"],
    "Workflow": ["Git/GitHub", "Documentation", "Debugging", "Testing mindset"],
  },
  projects: [
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
    website: "https://yourdomain.com",
  },
};

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

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (name === "home")
    return (
      <svg {...common}>
        <path {...stroke} d="M3 10.5 12 3l9 7.5V21a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 21V10.5Z" />
        <path {...stroke} d="M9 22V13h6v9" />
      </svg>
    );
  if (name === "code")
    return (
      <svg {...common}>
        <path {...stroke} d="M16 18 22 12 16 6" />
        <path {...stroke} d="M8 6 2 12l6 6" />
        <path {...stroke} d="M14 4 10 20" />
      </svg>
    );
  if (name === "doc")
    return (
      <svg {...common}>
        <path {...stroke} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...stroke} d="M14 2v6h6" />
        <path {...stroke} d="M8 13h8" />
        <path {...stroke} d="M8 17h8" />
      </svg>
    );
  if (name === "mail")
    return (
      <svg {...common}>
        <path {...stroke} d="M4 4h16v16H4z" />
        <path {...stroke} d="m4 6 8 7 8-7" />
      </svg>
    );
  if (name === "moon")
    return (
      <svg {...common}>
        <path {...stroke} d="M21 12.5A8.5 8.5 0 0 1 11.5 3a7.5 7.5 0 1 0 9.5 9.5Z" />
      </svg>
    );
  if (name === "sun")
    return (
      <svg {...common}>
        <circle {...stroke} cx="12" cy="12" r="4" />
        <path {...stroke} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
      </svg>
    );
  if (name === "link")
    return (
      <svg {...common}>
        <path {...stroke} d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
        <path {...stroke} d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
      </svg>
    );
  if (name === "chev")
    return (
      <svg {...common}>
        <path {...stroke} d="M6 9l6 6 6-6" />
      </svg>
    );
  return null;
}

function Section({ id, children, style }) {
  return (
    <section
      id={id}
      style={{
        scrollMarginTop: 96,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState("dark"); // dark | light
  const [active, setActive] = useState("home"); // home | projects | resume | contact
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
      },
      brand: { display: "flex", alignItems: "center", gap: 12, minWidth: 220 },
      avatar: {
        width: 42,
        height: 42,
        borderRadius: 18,
        display: "grid",
        placeItems: "center",
        fontWeight: 1000,
        letterSpacing: -0.6,
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
          ? dark
            ? "1px solid rgba(59,130,246,0.50)"
            : "1px solid rgba(37,99,235,0.35)"
          : border,
        background: isActive
          ? dark
            ? "linear-gradient(135deg, rgba(59,130,246,0.20), rgba(147,51,234,0.14))"
            : "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.08))"
          : dark
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.70)",
        color: fg,
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
        borderRadius: 26,
        padding: "26px 22px",
        background: cardBg,
        border,
        backdropFilter: "blur(10px)",
        boxShadow: dark ? "0 18px 35px rgba(0,0,0,0.40)" : "0 16px 30px rgba(0,0,0,0.10)",
      },
      grid2: {
        display: "grid",
        gridTemplateColumns: "1.35fr 0.65fr",
        gap: 16,
      },
      card: {
        borderRadius: 20,
        padding: 16,
        background: cardBg,
        border,
        backdropFilter: "blur(10px)",
        boxShadow: dark ? "0 18px 35px rgba(0,0,0,0.30)" : "0 16px 30px rgba(0,0,0,0.08)",
      },
      subtle: { color: subtle },
      pill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        padding: "7px 12px",
        background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
        border,
        fontSize: 12,
        fontWeight: 800,
      },
      h1: { margin: 0, fontSize: 40, letterSpacing: -1.1, lineHeight: 1.05 },
      h2: { margin: 0, fontSize: 20, letterSpacing: -0.4 },
      hr: {
        border: "none",
        height: 1,
        background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
        margin: "14px 0",
      },
      link: {
        color: fg,
        textDecoration: "none",
        fontWeight: 900,
      },
      aGhost: {
        display: "inline-flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 14,
        border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.75)",
        color: fg,
        textDecoration: "none",
        fontWeight: 900,
      },
      input: {
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)",
        color: fg,
        outline: "none",
      },
      textarea: {
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)",
        color: fg,
        outline: "none",
        minHeight: 120,
        resize: "vertical",
      },
      footer: {
        textAlign: "center",
        fontSize: 12,
        color: subtle,
        paddingTop: 8,
      },
    };
  }, [theme]);

  // keep nav highlighting in sync with scroll
  useEffect(() => {
    const handler = () => {
      const ids = ["home", "projects", "resume", "contact"];
      let best = "home";
      let bestDist = Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 110); // near sticky nav
        if (dist < bestDist) {
          bestDist = dist;
          best = id;
        }
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

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <div style={styles.app} ref={shellRef}>
      {/* Background layers */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", ...bgStyle }} />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage:
            theme === "dark"
              ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
              : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          opacity: theme === "dark" ? 0.26 : 0.18,
          maskImage: "radial-gradient(900px 600px at 50% 18%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {particles.map((p) => (
          <div
            key={p.i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              borderRadius: 999,
              background: theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)",
              opacity: p.o,
              transform: "translate(-50%, -50%)",
              animation: `floaty ${p.dur}s ease-in-out ${-(p.i % 7)}s infinite alternate`,
              filter: "blur(0.2px)",
            }}
          />
        ))}
        <style>{`
          @keyframes floaty {
            from { transform: translate(-50%, -50%) translate3d(-12px, -8px, 0); }
            to   { transform: translate(-50%, -50%) translate3d(18px, 16px, 0); }
          }
          button:hover { transform: translateY(-1px); filter: brightness(1.03); }
          a:hover { transform: translateY(-1px); filter: brightness(1.02); }
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
            <button type="button" style={styles.tab(active === "home")} onClick={() => scrollTo("home")}>
              <Icon name="home" /> Home
            </button>
            <button type="button" style={styles.tab(active === "projects")} onClick={() => scrollTo("projects")}>
              <Icon name="code" /> Projects
            </button>
            <button type="button" style={styles.tab(active === "resume")} onClick={() => scrollTo("resume")}>
              <Icon name="doc" /> Resume
            </button>
            <button type="button" style={styles.tab(active === "contact")} onClick={() => scrollTo("contact")}>
              <Icon name="mail" /> Contact
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" style={styles.btn()} onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? <Icon name="moon" /> : <Icon name="sun" />}
              {theme === "dark" ? "Dark" : "Light"}
            </button>
            <a
              href={CONTENT.contact.github}
              target="_blank"
              rel="noreferrer"
              style={styles.btn("primary")}
              title="Open GitHub"
            >
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

            <h1 style={styles.h1}>
              {CONTENT.tagline}
            </h1>

            <div style={{ display: "grid", gap: 10, ...styles.subtle, fontSize: 14, lineHeight: 1.6, maxWidth: 900 }}>
              {CONTENT.about.map((p, i) => (
                <div key={i}>{p}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <a href={`mailto:${CONTENT.contact.email}`} style={styles.btn("primary")}>
                <Icon name="mail" /> Email Me
              </a>
              <a href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={styles.btn()}>
                <Icon name="link" /> LinkedIn
              </a>
              <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={styles.btn()}>
                <Icon name="link" /> GitHub
              </a>
              <button type="button" style={styles.btn()} onClick={() => scrollTo("projects")}>
                <Icon name="chev" /> View Projects
              </button>
            </div>
          </div>
        </Section>

        {/* HIGHLIGHTS + SKILLS */}
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={styles.h2}>Highlights</h2>
              <span style={styles.pill}>What I’m working on</span>
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
                    {items.map((s) => (
                      <span key={s} style={styles.pill}>
                        {s}
                      </span>
                    ))}
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
              <div key={p.name} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 1100, letterSpacing: -0.5, fontSize: 16 }}>{p.name}</div>
                    <div style={{ ...styles.subtle, lineHeight: 1.6 }}>{p.blurb}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {p.stack.map((t) => (
                      <span key={t} style={styles.pill}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={styles.hr} />

                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, ...styles.subtle, lineHeight: 1.6 }}>
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                {p.links?.length ? (
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {p.links.map((l) => (
                      <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={styles.aGhost}>
                        <Icon name="link" /> {l.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
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
                        {e.points.map((pt) => (
                          <li key={pt}>{pt}</li>
                        ))}
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
                        {ed.notes.map((n) => (
                          <span key={n} style={styles.pill}>{n}</span>
                        ))}
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
                <div style={{ ...styles.subtle, lineHeight: 1.6 }}>
                  Add a PDF resume link when you have one.
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={CONTENT.contact.website} target="_blank" rel="noreferrer" style={styles.aGhost}>
                    <Icon name="link" /> Portfolio Link
                  </a>
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>What I’m looking for</div>
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
            <span style={styles.pill}>Let’s talk</span>
          </div>
          <div style={styles.hr} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ ...styles.subtle, lineHeight: 1.6 }}>
                Want to connect about internships, projects, or security work? The fastest way to reach me is email.
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <a href={`mailto:${CONTENT.contact.email}`} style={styles.aGhost}>
                  <Icon name="mail" /> {CONTENT.contact.email}
                </a>
                <a href={CONTENT.contact.linkedin} target="_blank" rel="noreferrer" style={styles.aGhost}>
                  <Icon name="link" /> LinkedIn
                </a>
                <a href={CONTENT.contact.github} target="_blank" rel="noreferrer" style={styles.aGhost}>
                  <Icon name="link" /> GitHub
                </a>
              </div>
            </div>

            <ContactForm styles={styles} theme={theme} />
          </div>
        </Section>

        <div style={styles.footer}>
          © {new Date().getFullYear()} {CONTENT.name} • Built with React • Custom UI + animated background
        </div>
      </div>
    </div>
  );
}

function ContactForm({ styles }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");

  function submit(e) {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const m = msg.trim();

    if (!n || !em.includes("@") || m.length < 10) {
      setToast("Please add your name, a valid email, and a message (10+ chars).");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    // client-side demo form: opens mailto with prefilled subject/body
    const subject = encodeURIComponent(`Portfolio message from ${n}`);
    const body = encodeURIComponent(`Name: ${n}\nEmail: ${em}\n\n${m}`);
    window.location.href = `mailto:${CONTENT.contact.email}?subject=${subject}&body=${body}`;

    setToast("Opening your email app…");
    window.setTimeout(() => setToast(""), 1600);
  }

  return (
    <div style={styles.card}>
      <div style={{ fontWeight: 1100, letterSpacing: -0.4 }}>Send a message</div>
      <div style={styles.hr} />

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input style={styles.input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={styles.input} placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <textarea style={styles.textarea} placeholder="What would you like to talk about?" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button type="submit" style={styles.btn("primary")}>
          <Icon name="mail" /> Send
        </button>
      </form>

      {toast ? (
        <div style={{ marginTop: 10, ...styles.subtle, fontWeight: 900 }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
