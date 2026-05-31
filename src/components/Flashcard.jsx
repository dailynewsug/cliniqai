import { useState } from "react";

const SECTION_CONFIG = [
  { keys: ["definition", "overview", "what is", "introduction"], label: "Definition", icon: "📖", color: "#0d2235" },
  { keys: ["pathogenesis", "pathophysiology", "mechanism", "etiology", "cause"], label: "Pathogenesis", icon: "🔬", color: "#1a1a35" },
  { keys: ["types", "phenotypes", "classification", "stages"], label: "Types", icon: "📊", color: "#1a0d35" },
  { keys: ["signs", "symptoms", "clinical", "presentation", "features"], label: "Signs & Symptoms", icon: "🩺", color: "#0d2a1a" },
  { keys: ["diagnosis", "investigations", "workup", "test"], label: "Diagnosis", icon: "🧪", color: "#2a1a0d" },
  { keys: ["management", "treatment", "therapy", "drug", "medication"], label: "Management", icon: "💊", color: "#0d2a2a" },
  { keys: ["complication", "prognosis", "outcome"], label: "Complications", icon: "⚠️", color: "#2a0d0d" },
  { keys: ["pearl", "key point", "remember", "tip", "note", "important"], label: "Clinical Pearl", icon: "⭐", color: "#1a2a0d" },
];

function parseResponse(text) {
  if (!text || text.length < 20) return { title: "", sections: [] };

  const lines = text.split('\n').filter(l => l.trim());
  let title = "";
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  // Try to find title from first ## header
  for (const line of lines) {
    const h = line.match(/^##?\s+(.+)$/);
    if (h) {
      title = h[1].replace(/\*\*/g, '').trim();
      break;
    }
  }

  // If no title found use first meaningful line
  if (!title) {
    title = lines[0]?.replace(/[*#]/g, '').trim().slice(0, 60) || "Medical Summary";
  }

  const saveSection = () => {
    if (currentSection && currentContent.length > 0) {
      sections.push({ ...currentSection, content: [...currentContent] });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const cleanLine = trimmed.replace(/^##?\s*/, '').replace(/\*\*/g, '').trim();
    const lowerLine = cleanLine.toLowerCase();

    // Check if this line is a section header
    const isHeader = trimmed.startsWith('#') || (
      trimmed.endsWith(':') &&
      trimmed.length < 40 &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('•')
    );

    if (isHeader) {
      const matched = SECTION_CONFIG.find(sc =>
        sc.keys.some(k => lowerLine.includes(k))
      );

      if (matched) {
        saveSection();
        currentSection = { ...matched };
        currentContent = [];
        continue;
      }
    }

    // Collect bullet points into current section
    if (currentSection) {
      const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/) ||
                          trimmed.match(/^\d+\.\s+(.+)$/);
      if (bulletMatch) {
        const point = bulletMatch[1].replace(/\*\*/g, '').trim();
        if (point && point.length > 3) currentContent.push(point);
      } else if (
        !trimmed.startsWith('#') &&
        cleanLine.length > 10 &&
        !cleanLine.toLowerCase().includes('disclaimer') &&
        !cleanLine.toLowerCase().includes('educational')
      ) {
        currentContent.push(cleanLine);
      }
    }
  }

  saveSection();

  // If still no sections — force-create sections from bullet points
  if (sections.length === 0) {
    const allBullets = lines
      .filter(l => l.trim().match(/^[-•*]\s+/) || l.trim().match(/^\d+\.\s+/))
      .map(l => l.replace(/^[-•*\d.]\s+/, '').replace(/\*\*/g, '').trim())
      .filter(l => l.length > 5)
      .slice(0, 12);

    if (allBullets.length > 0) {
      const half = Math.ceil(allBullets.length / 2);
      sections.push({
        label: "Key Points",
        icon: "📋",
        color: "#0d2235",
        content: allBullets.slice(0, half)
      });
      if (allBullets.length > half) {
        sections.push({
          label: "Additional Points",
          icon: "📝",
          color: "#1a2a0d",
          content: allBullets.slice(half)
        });
      }
    }

    // Last resort — split text into chunks
    if (sections.length === 0) {
      const chunks = text
        .replace(/\*\*/g, '')
        .split(/[.!?]/)
        .filter(s => s.trim().length > 20)
        .slice(0, 6);

      if (chunks.length > 0) {
        sections.push({
          label: "Summary",
          icon: "📋",
          color: "#0d2235",
          content: chunks.map(c => c.trim())
        });
      }
    }
  }

  return { title, sections: sections.slice(0, 8) };
}

export default function Flashcard({ text, specialty }) {
  const [activeSection, setActiveSection] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { title, sections } = parseResponse(text);

  if (!sections || sections.length === 0) return null;

  const current = sections[activeSection] || sections[0];

  return (
    <div className="fc-wrapper">
      {/* Header */}
      <div className="fc-top">
        <div className="fc-badge">📇 Flashcard</div>
        <div className="fc-spec">{specialty}</div>
        <button className="fc-flip" onClick={() => setFlipped(f => !f)}>
          {flipped ? "📖 Detail View" : "⚡ Quick Review"}
        </button>
      </div>

      {/* Title */}
      <div className="fc-title">{title}</div>

      {!flipped ? (
        <>
          {/* Tab buttons */}
          <div className="fc-tabs">
            {sections.map((s, i) => (
              <button
                key={i}
                className={`fc-tab-btn ${activeSection === i ? "fc-tab-active" : ""}`}
                onClick={() => setActiveSection(i)}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="fc-panel" style={{ background: current?.color || "#0d2235" }}>
            <div className="fc-panel-title">
              {current?.icon} {current?.label}
            </div>
            <ul className="fc-bullets">
              {current?.content.slice(0, 7).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Dot navigation */}
          <div className="fc-dots">
            {sections.map((_, i) => (
              <span
                key={i}
                className={`fc-dot ${activeSection === i ? "fc-dot-active" : ""}`}
                onClick={() => setActiveSection(i)}
              />
            ))}
          </div>
        </>
      ) : (
        /* Quick review grid */
        <div className="fc-grid">
          {sections.map((s, i) => (
            <div
              key={i}
              className="fc-grid-item"
              style={{ background: s.color }}
              onClick={() => { setActiveSection(i); setFlipped(false); }}>
              <div className="fc-grid-label">{s.icon} {s.label}</div>
              {s.content.slice(0, 2).map((p, j) => (
                <div key={j} className="fc-grid-point">
                  • {p.slice(0, 55)}{p.length > 55 ? "…" : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fc-wrapper {
          margin-top: 14px;
          background: #0a1510;
          border: 1px solid rgba(0,200,150,0.4);
          border-radius: 14px;
          overflow: hidden;
          font-family: 'DM Mono', monospace;
          box-shadow: 0 0 20px rgba(0,200,150,0.05);
        }
        .fc-top {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(0,200,150,0.08);
          border-bottom: 1px solid rgba(0,200,150,0.15);
          flex-wrap: wrap;
        }
        .fc-badge {
          font-size: 11px;
          color: #00c896;
          font-weight: 600;
        }
        .fc-spec {
          font-size: 9px;
          color: #4a5450;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          flex: 1;
        }
        .fc-flip {
          background: rgba(0,200,150,0.1);
          border: 1px solid rgba(0,200,150,0.25);
          border-radius: 6px;
          color: #00c896;
          font-size: 10px;
          padding: 4px 10px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
        }
        .fc-flip:hover { background: #00c896; color: #000; }
        .fc-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 18px;
          color: #e8ede8;
          font-weight: 600;
          padding: 12px 14px 4px;
          line-height: 1.3;
        }
        .fc-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px 14px;
        }
        .fc-tab-btn {
          padding: 5px 11px;
          border-radius: 20px;
          border: 1px solid #1e2428;
          background: #111417;
          color: #8a9490;
          font-size: 10px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .fc-tab-btn:hover { border-color: #00a07a; color: #e8ede8; }
        .fc-tab-active {
          border-color: #00c896 !important;
          color: #00c896 !important;
          background: rgba(0,200,150,0.1) !important;
        }
        .fc-panel {
          margin: 0 14px 10px;
          border-radius: 10px;
          padding: 14px 16px;
          min-height: 110px;
          transition: background 0.3s ease;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .fc-panel-title {
          font-size: 12px;
          color: #00c896;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .fc-bullets {
          padding-left: 16px;
          margin: 0;
        }
        .fc-bullets li {
          color: #d0d8d0;
          font-size: 12px;
          margin-bottom: 6px;
          line-height: 1.6;
        }
        .fc-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px 14px;
        }
        .fc-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1e2428;
          cursor: pointer;
          transition: background 0.15s;
          display: inline-block;
        }
        .fc-dot-active { background: #00c896; }
        .fc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 10px 14px 14px;
        }
        .fc-grid-item {
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.15s;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .fc-grid-item:hover { opacity: 0.8; }
        .fc-grid-label {
          font-size: 10px;
          color: #00c896;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .fc-grid-point {
          font-size: 10px;
          color: #8a9490;
          line-height: 1.5;
          margin-bottom: 2px;
        }
        @media (max-width: 480px) {
          .fc-grid { grid-template-columns: 1fr; }
          .fc-title { font-size: 16px; }
          .fc-tab-btn { font-size: 9px; padding: 4px 8px; }
        }
      `}</style>
    </div>
  );
}