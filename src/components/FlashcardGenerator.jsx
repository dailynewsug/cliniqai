import { useState } from "react";

const SECTION_COLORS = [
  { bg: "#1a3a5c", border: "#2a6496", header: "#3a8fd4" },
  { bg: "#2d1b4e", border: "#6a3d9a", header: "#9b59b6" },
  { bg: "#1a4a2e", border: "#2d8a4e", header: "#27ae60" },
  { bg: "#4a2c1a", border: "#9a5a2a", header: "#e67e22" },
  { bg: "#4a1a1a", border: "#9a2a2a", header: "#e74c3c" },
  { bg: "#1a4a4a", border: "#2a8a8a", header: "#1abc9c" },
  { bg: "#3a3a1a", border: "#7a7a2a", header: "#f1c40f" },
  { bg: "#2a1a3a", border: "#5a3a7a", header: "#8e44ad" },
];

const SECTION_ICONS = {
  "definition": "📖", "overview": "📖",
  "pathogenesis": "🔬", "pathophysiology": "🔬", "mechanism": "🔬",
  "types": "📊", "classification": "📊", "phenotypes": "📊",
  "signs": "🩺", "symptoms": "🩺", "clinical": "🩺",
  "diagnosis": "🧪", "investigations": "🧪",
  "management": "💊", "treatment": "💊", "therapy": "💊",
  "complications": "⚠️", "prognosis": "⚠️",
  "pearl": "⭐", "key": "⭐", "important": "⭐",
  "triggers": "⚡", "causes": "⚡",
  "prevention": "🛡️", "screening": "🔍",
};

function getIcon(label) {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📋";
}

function parseIntoSections(text) {
  const lines = text.split('\n').filter(l => l.trim());
  let title = "";
  let subtitle = "";
  const sections = [];
  let currentSection = null;
  let currentContent = [];
  let colorIndex = 0;

  const saveSection = () => {
    if (currentSection && currentContent.length > 0) {
      sections.push({
        ...currentSection,
        content: currentContent.filter(Boolean).slice(0, 8),
        colors: SECTION_COLORS[colorIndex % SECTION_COLORS.length]
      });
      colorIndex++;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    const boldMatch = trimmed.match(/^\*\*(.+)\*\*\s*:?\s*$/);

    if (h2Match || boldMatch) {
      const headerText = (h2Match?.[1] || boldMatch?.[1])
        .replace(/\*\*/g, '').trim();

      if (!title && h2Match) {
        title = headerText;
        continue;
      }

      saveSection();
      currentSection = {
        label: headerText,
        icon: getIcon(headerText),
      };
      currentContent = [];
      colorIndex = sections.length;

    } else if (h3Match) {
      if (!subtitle && !title) {
        subtitle = h3Match[1].replace(/\*\*/g, '').trim();
      }
    } else if (currentSection) {
      const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/) ||
                          trimmed.match(/^\d+\.\s+(.+)$/);
      if (bulletMatch) {
        const point = bulletMatch[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (point.length > 3) currentContent.push(point);
      } else if (!trimmed.startsWith('#') && trimmed.length > 5) {
        const clean = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (clean.length > 5 &&
            !clean.toLowerCase().includes('disclaimer') &&
            !clean.toLowerCase().includes('educational purposes')) {
          currentContent.push(clean);
        }
      }
    } else if (!title) {
      title = trimmed.replace(/[*#]/g, '').trim().slice(0, 80);
    }
  }

  saveSection();

  // Fallback if no sections
  if (sections.length === 0) {
    const bullets = lines
      .filter(l => l.trim().match(/^[-•*]\s+/))
      .map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 5)
      .slice(0, 10);

    if (bullets.length > 0) {
      const half = Math.ceil(bullets.length / 2);
      sections.push({
        label: "Key Points",
        icon: "📋",
        content: bullets.slice(0, half),
        colors: SECTION_COLORS[0]
      });
      if (bullets.length > half) {
        sections.push({
          label: "Additional Points",
          icon: "📝",
          content: bullets.slice(half),
          colors: SECTION_COLORS[1]
        });
      }
    }
  }

  return { title, subtitle, sections };
}

export default function FlashcardGenerator({ text, specialty }) {
  const [activeView, setActiveView] = useState("card");
  const { title, subtitle, sections } = parseIntoSections(text);

  if (!sections || sections.length === 0) return null;

  const gridSections = sections.filter(s =>
    !s.label.toLowerCase().includes('disclaimer') &&
    !s.label.toLowerCase().includes('educational')
  );

  return (
    <div className="fcg-wrapper">
      {/* Top bar */}
      <div className="fcg-topbar">
        <div className="fcg-badge">📇 Auto Flashcard</div>
        <div className="fcg-specialty">{specialty}</div>
        <div className="fcg-view-btns">
          <button
            className={`fcg-view-btn ${activeView === "card" ? "active" : ""}`}
            onClick={() => setActiveView("card")}>
            🗂 Card
          </button>
          <button
            className={`fcg-view-btn ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}>
            📋 List
          </button>
        </div>
      </div>

      {/* Card View — looks like your reference images */}
      {activeView === "card" && (
        <div className="fcg-card">
          {/* Title section */}
          <div className="fcg-card-title-section">
            <div className="fcg-card-title">{title}</div>
            {subtitle && <div className="fcg-card-subtitle">{subtitle}</div>}
            <div className="fcg-card-ref">
              Reference: Harrison's · Robbins · WHO/CDC Guidelines
            </div>
          </div>

          {/* Sections grid */}
          <div className="fcg-sections-grid">
            {gridSections.map((section, i) => (
              <div
                key={i}
                className="fcg-section"
                style={{
                  background: section.colors.bg,
                  borderColor: section.colors.border,
                }}>
                <div
                  className="fcg-section-header"
                  style={{ background: section.colors.header }}>
                  {section.icon} {section.label}
                </div>
                <ul className="fcg-section-list">
                  {section.content.slice(0, 5).map((point, j) => (
                    <li key={j}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="fcg-card-footer">
            <span>🏥 MedVise Clinical Intelligence</span>
            <span>⚕ For educational purposes only</span>
          </div>
        </div>
      )}

      {/* List View — clean scrollable list */}
      {activeView === "list" && (
        <div className="fcg-list">
          <div className="fcg-list-title">{title}</div>
          {gridSections.map((section, i) => (
            <div key={i} className="fcg-list-section"
              style={{ borderLeft: `3px solid ${section.colors.header}` }}>
              <div className="fcg-list-header"
                style={{ color: section.colors.header }}>
                {section.icon} {section.label}
              </div>
              <ul className="fcg-list-bullets">
                {section.content.map((point, j) => (
                  <li key={j}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fcg-wrapper {
          margin-top: 16px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(0,200,150,0.35);
          background: #050f0a;
          font-family: 'DM Mono', monospace;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }

        /* TOP BAR */
        .fcg-topbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(0,200,150,0.08);
          border-bottom: 1px solid rgba(0,200,150,0.15);
          flex-wrap: wrap;
        }
        .fcg-badge {
          font-size: 11px;
          color: #00c896;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .fcg-specialty {
          font-size: 9px;
          color: #4a5450;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          flex: 1;
        }
        .fcg-view-btns {
          display: flex;
          gap: 6px;
        }
        .fcg-view-btn {
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #252b30;
          background: none;
          color: #8a9490;
          font-size: 10px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
        }
        .fcg-view-btn.active {
          border-color: #00c896;
          color: #00c896;
          background: rgba(0,200,150,0.1);
        }

        /* CARD VIEW */
        .fcg-card {
          padding: 0;
        }
        .fcg-card-title-section {
          padding: 16px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(135deg, #0a1f18 0%, #0d1a14 100%);
          text-align: center;
        }
        .fcg-card-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #e8ede8;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .fcg-card-subtitle {
          font-size: 11px;
          color: #8a9490;
          margin-bottom: 6px;
          line-height: 1.5;
        }
        .fcg-card-ref {
          font-size: 9px;
          color: #00c896;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        /* SECTIONS GRID */
        .fcg-sections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 12px;
        }
        .fcg-section {
          border-radius: 10px;
          border: 1px solid;
          overflow: hidden;
        }
        .fcg-section-header {
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.3px;
        }
        .fcg-section-list {
          padding: 8px 12px 10px 24px;
          margin: 0;
          list-style: disc;
        }
        .fcg-section-list li {
          color: #d0d8d0;
          font-size: 11px;
          margin-bottom: 4px;
          line-height: 1.5;
        }

        /* FOOTER */
        .fcg-card-footer {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
          font-size: 9px;
          color: #4a5450;
          flex-wrap: wrap;
          gap: 4px;
        }

        /* LIST VIEW */
        .fcg-list {
          padding: 14px;
        }
        .fcg-list-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 20px;
          color: #e8ede8;
          font-weight: 600;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,200,150,0.2);
        }
        .fcg-list-section {
          padding: 10px 14px;
          margin-bottom: 10px;
          border-radius: 0 8px 8px 0;
          background: rgba(255,255,255,0.02);
        }
        .fcg-list-header {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }
        .fcg-list-bullets {
          padding-left: 16px;
          margin: 0;
        }
        .fcg-list-bullets li {
          color: #b0b8b0;
          font-size: 11px;
          margin-bottom: 4px;
          line-height: 1.6;
        }

        /* MOBILE */
        @media (max-width: 500px) {
          .fcg-sections-grid {
            grid-template-columns: 1fr;
          }
          .fcg-card-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}