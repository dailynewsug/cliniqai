import { useState } from "react";

const SECTION_STYLES = [
  { bg: "#0d2744", border: "#1a5a9a", header: "#1a6eb5", text: "#7ec8e3" },
  { bg: "#2d1244", border: "#6a2d9a", header: "#7d3ab5", text: "#c39be3" },
  { bg: "#0d3320", border: "#1a7a4a", header: "#1a9a5a", text: "#7ee3a8" },
  { bg: "#3d2000", border: "#9a5500", header: "#c47000", text: "#e3b87e" },
  { bg: "#3d0d0d", border: "#9a2020", header: "#c43030", text: "#e37e7e" },
  { bg: "#0d3333", border: "#1a8a8a", header: "#1aabab", text: "#7ee3e3" },
  { bg: "#2d2d00", border: "#7a7a00", header: "#9a9a00", text: "#e3e37e" },
  { bg: "#1a0d33", border: "#4a2d7a", header: "#6040a0", text: "#b09ee3" },
];

const SECTION_ICONS = {
  definition: "📖", overview: "📖", introduction: "📖",
  pathogenesis: "🔬", pathophysiology: "🔬", mechanism: "🔬", etiology: "🔬",
  types: "📊", classification: "📊", phenotypes: "📊", subtypes: "📊",
  signs: "🩺", symptoms: "🩺", clinical: "🩺", presentation: "🩺", features: "🩺",
  diagnosis: "🧪", investigations: "🧪", workup: "🧪", criteria: "🧪",
  management: "💊", treatment: "💊", therapy: "💊", drugs: "💊",
  complications: "⚠️", prognosis: "⚠️", outcomes: "⚠️",
  pearl: "⭐", key: "⭐", important: "⭐", remember: "⭐",
  triggers: "⚡", causes: "⚡", risk: "⚡",
  prevention: "🛡️", screening: "🔍",
};

function getIcon(label) {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📋";
}

function parse(text) {
  const lines = text.split('\n');
  let title = "";
  let subtitle = "";
  const sections = [];
  let cur = null;
  let curContent = [];
  let colorIdx = 0;

  const save = () => {
    if (cur && curContent.length > 0) {
      const filtered = curContent
        .filter(Boolean)
        .filter(p => !p.toLowerCase().includes('disclaimer'))
        .filter(p => !p.toLowerCase().includes('educational purposes'))
        .filter(p => p.length > 4);
      if (filtered.length > 0) {
        sections.push({
          ...cur,
          content: filtered.slice(0, 7),
          style: SECTION_STYLES[colorIdx % SECTION_STYLES.length]
        });
        colorIdx++;
      }
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const h2 = t.match(/^##\s+(.+)$/);
    const h3 = t.match(/^###\s+(.+)$/);
    const bold = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
    const bullet = t.match(/^[-•*]\s+(.+)$/) || t.match(/^\d+\.\s+(.+)$/);

    if (h2) {
      const ht = h2[1].replace(/\*\*/g, '').trim();
      if (!title) { title = ht; continue; }
      save(); cur = { label: ht, icon: getIcon(ht) }; curContent = [];
    } else if (h3) {
      const ht = h3[1].replace(/\*\*/g, '').trim();
      if (!title) title = ht;
      else if (!subtitle && sections.length === 0) subtitle = ht;
      else { save(); cur = { label: ht, icon: getIcon(ht) }; curContent = []; }
    } else if (bold) {
      const ht = bold[1].replace(/\*\*/g, '').trim();
      if (!title && sections.length === 0 && !cur) { title = ht; continue; }
      save(); cur = { label: ht, icon: getIcon(ht) }; curContent = [];
    } else if (bullet && cur) {
      const p = bullet[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (p.length > 3) curContent.push(p);
    } else if (cur && !t.startsWith('#')) {
      const p = t.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (p.length > 5 &&
          !p.toLowerCase().includes('disclaimer') &&
          !p.toLowerCase().includes('educational')) {
        curContent.push(p);
      }
    } else if (!title && t.length > 3) {
      title = t.replace(/[*#]/g, '').trim().slice(0, 80);
    }
  }
  save();

  if (sections.length === 0) {
    const bullets = lines
      .filter(l => l.trim().match(/^[-•*]\s+/))
      .map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 5).slice(0, 12);
    if (bullets.length > 0) {
      const h = Math.ceil(bullets.length / 2);
      sections.push({ label: "Key Points", icon: "📋", content: bullets.slice(0, h), style: SECTION_STYLES[0] });
      if (bullets.length > h)
        sections.push({ label: "More Points", icon: "📝", content: bullets.slice(h), style: SECTION_STYLES[1] });
    }
  }

  return { title: title || "Medical Summary", subtitle, sections };
}

export default function FlashcardGenerator({ text, specialty }) {
  const [view, setView] = useState("card");
  const { title, subtitle, sections } = parse(text);

  const clean = sections.filter(s =>
    !s.label.toLowerCase().includes('disclaimer') &&
    !s.label.toLowerCase().includes('educational')
  );

  if (!clean || clean.length === 0) return null;

  // Split into main grid and last row (complications/pearl)
  const mainSections = clean.length > 6 ? clean.slice(0, -2) : clean;
  const bottomSections = clean.length > 6 ? clean.slice(-2) : [];

  return (
    <div className="fcg">

      {/* TOPBAR */}
      <div className="fcg-bar">
        <span className="fcg-badge">📇 Auto Flashcard</span>
        <span className="fcg-spec">{specialty}</span>
        <div className="fcg-views">
          <button className={`fcg-vbtn ${view === "card" ? "on" : ""}`} onClick={() => setView("card")}>🗂 Card</button>
          <button className={`fcg-vbtn ${view === "list" ? "on" : ""}`} onClick={() => setView("list")}>📋 List</button>
        </div>
      </div>

      {view === "card" && (
        <div className="fcg-card">

          {/* TITLE BLOCK */}
          <div className="fcg-title-block">
            <div className="fcg-main-title">{title}</div>
            {subtitle && <div className="fcg-subtitle">{subtitle}</div>}
            <div className="fcg-refs">
              📚 Harrison's · Robbins · Goodman &amp; Gilman · WHO/CDC · ACC/AHA Guidelines
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="fcg-grid">
            {mainSections.map((s, i) => (
              <div key={i} className="fcg-cell" style={{ background: s.style.bg, borderColor: s.style.border }}>
                <div className="fcg-cell-hdr" style={{ background: s.style.header }}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
                <ul className="fcg-cell-list">
                  {s.content.slice(0, 5).map((p, j) => (
                    <li key={j} style={{ color: "#d8e8d8" }}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* BOTTOM ROW — full width sections */}
          {bottomSections.length > 0 && (
            <div className="fcg-bottom-row">
              {bottomSections.map((s, i) => (
                <div key={i} className="fcg-bottom-cell" style={{ background: s.style.bg, borderColor: s.style.border }}>
                  <div className="fcg-cell-hdr" style={{ background: s.style.header }}>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <div className="fcg-bottom-content">
                    {s.content.slice(0, 4).map((p, j) => (
                      <span key={j} className="fcg-bottom-item">• {p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className="fcg-footer">
            <span>🏥 MedVise Clinical Intelligence AI</span>
            <span>⚕ For educational purposes only — Always consult a clinician</span>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="fcg-list">
          <div className="fcg-list-title">{title}</div>
          {clean.map((s, i) => (
            <div key={i} className="fcg-list-item" style={{ borderLeftColor: s.style.header }}>
              <div className="fcg-list-hdr" style={{ color: s.style.text }}>
                {s.icon} {s.label}
              </div>
              <ul className="fcg-list-ul">
                {s.content.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fcg {
          margin-top: 14px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(0,200,150,0.3);
          background: #060e0a;
          font-family: 'DM Mono', monospace;
          box-shadow: 0 6px 30px rgba(0,0,0,0.5);
        }
        .fcg-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px;
          background: rgba(0,200,150,0.07);
          border-bottom: 1px solid rgba(0,200,150,0.12);
          flex-wrap: wrap;
        }
        .fcg-badge { font-size: 11px; color: #00c896; font-weight: 700; }
        .fcg-spec { font-size: 9px; color: #3a4a40; text-transform: uppercase; letter-spacing: 1.5px; flex: 1; }
        .fcg-views { display: flex; gap: 5px; }
        .fcg-vbtn {
          padding: 3px 9px; border-radius: 5px;
          border: 1px solid #1e2428; background: none;
          color: #6a7470; font-size: 10px; cursor: pointer;
          font-family: 'DM Mono', monospace; transition: all 0.15s;
        }
        .fcg-vbtn.on { border-color: #00c896; color: #00c896; background: rgba(0,200,150,0.1); }

        /* CARD */
        .fcg-card { padding: 0; }
        .fcg-title-block {
          padding: 18px 18px 14px;
          text-align: center;
          background: linear-gradient(160deg, #0a1f14 0%, #070f0a 100%);
          border-bottom: 1px solid rgba(0,200,150,0.1);
        }
        .fcg-main-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 24px; font-weight: 700;
          color: #f0f8f0; line-height: 1.2;
          margin-bottom: 6px;
        }
        .fcg-subtitle {
          font-size: 12px; color: #7a9a80;
          margin-bottom: 8px; line-height: 1.5;
          max-width: 500px; margin-left: auto; margin-right: auto;
        }
        .fcg-refs {
          font-size: 9px; color: rgba(0,200,150,0.5);
          letter-spacing: 0.3px;
        }

        /* GRID */
        .fcg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 10px 10px 4px;
        }
        .fcg-cell {
          border-radius: 10px;
          border: 1px solid;
          overflow: hidden;
        }
        .fcg-cell-hdr {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 10px;
          font-size: 11px; font-weight: 700; color: #fff;
          letter-spacing: 0.3px;
        }
        .fcg-cell-list {
          padding: 8px 10px 10px 22px;
          margin: 0; list-style: disc;
        }
        .fcg-cell-list li {
          font-size: 11px; margin-bottom: 4px;
          line-height: 1.5; color: #c8d8c8;
        }

        /* BOTTOM ROW */
        .fcg-bottom-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          padding: 4px 10px 10px;
        }
        .fcg-bottom-cell {
          border-radius: 10px;
          border: 1px solid;
          overflow: hidden;
        }
        .fcg-bottom-content {
          display: flex; flex-wrap: wrap; gap: 6px;
          padding: 8px 12px 10px;
        }
        .fcg-bottom-item {
          font-size: 11px; color: #c8d8c8;
          background: rgba(255,255,255,0.04);
          padding: 3px 8px; border-radius: 4px;
        }

        /* FOOTER */
        .fcg-footer {
          display: flex; justify-content: space-between;
          padding: 8px 14px;
          border-top: 1px solid rgba(255,255,255,0.04);
          background: rgba(0,0,0,0.3);
          font-size: 9px; color: #3a4a40;
          flex-wrap: wrap; gap: 4px;
        }

        /* LIST */
        .fcg-list { padding: 14px; }
        .fcg-list-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 20px; color: #e8ede8; font-weight: 700;
          margin-bottom: 14px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,200,150,0.2);
        }
        .fcg-list-item {
          padding: 10px 14px; margin-bottom: 10px;
          border-left: 3px solid; border-radius: 0 8px 8px 0;
          background: rgba(255,255,255,0.02);
        }
        .fcg-list-hdr {
          font-size: 12px; font-weight: 700;
          margin-bottom: 6px; letter-spacing: 0.3px;
        }
        .fcg-list-ul {
          padding-left: 16px; margin: 0;
        }
        .fcg-list-ul li {
          color: #a0b0a0; font-size: 11px;
          margin-bottom: 4px; line-height: 1.6;
        }

        @media (max-width: 500px) {
          .fcg-grid { grid-template-columns: 1fr; }
          .fcg-main-title { font-size: 18px; }
          .fcg-bottom-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}