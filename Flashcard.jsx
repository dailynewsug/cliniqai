import { useState } from "react";

function parseFlashcardData(text) {
  const sections = [];

  const sectionPatterns = [
    { key: "definition", label: "Definition", icon: "📖", color: "#1a3a4a" },
    { key: "pathogenesis", label: "Pathogenesis", icon: "🔬", color: "#1a2a3a" },
    { key: "types", label: "Types / Phenotypes", icon: "📊", color: "#2a1a3a" },
    { key: "signs", label: "Signs & Symptoms", icon: "🩺", color: "#1a3a2a" },
    { key: "diagnosis", label: "Diagnosis", icon: "🧪", color: "#3a2a1a" },
    { key: "management", label: "Management", icon: "💊", color: "#1a2a2a" },
    { key: "complications", label: "Complications", icon: "⚠️", color: "#3a1a1a" },
    { key: "pearl", label: "Clinical Pearl", icon: "⭐", color: "#2a3a1a" },
  ];

  const lines = text.split('\n').filter(l => l.trim());
  let currentSection = null;
  let currentContent = [];
  let title = "";

  // Extract title from first heading
  for (const line of lines) {
    const h3Match = line.match(/^##\s+(.+)$/);
    if (h3Match) {
      title = h3Match[1].replace(/[*#]/g, '').trim();
      break;
    }
  }

  if (!title) {
    const firstLine = lines[0]?.replace(/[*#]/g, '').trim();
    title = firstLine?.slice(0, 50) || "Medical Flashcard";
  }

  for (const line of lines) {
    const cleanLine = line.replace(/^##?\s*/, '').replace(/\*\*/g, '').trim();

    const matchedSection = sectionPatterns.find(s =>
      cleanLine.toLowerCase().includes(s.key) ||
      cleanLine.toLowerCase().includes(s.label.toLowerCase())
    );

    if (matchedSection && line.startsWith('#')) {
      if (currentSection && currentContent.length > 0) {
        sections.push({ ...currentSection, content: currentContent });
      }
      currentSection = matchedSection;
      currentContent = [];
    } else if (currentSection) {
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const point = cleanLine.replace(/^[-•]\s*/, '').trim();
        if (point) currentContent.push(point);
      } else if (cleanLine && !line.startsWith('#')) {
        currentContent.push(cleanLine);
      }
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.push({ ...currentSection, content: currentContent });
  }

  // If no sections found, create a general one
  if (sections.length === 0) {
    const bullets = lines
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim())
      .slice(0, 8);

    if (bullets.length > 0) {
      sections.push({
        key: "general",
        label: "Key Points",
        icon: "📋",
        color: "#1a3a4a",
        content: bullets
      });
    }
  }

  return { title, sections: sections.slice(0, 6) };
}

export default function Flashcard({ text, specialty }) {
  const [flipped, setFlipped] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const { title, sections } = parseFlashcardData(text);

  if (sections.length === 0) return null;

  return (
    <div className="flashcard-wrapper">
      <div className="flashcard-header">
        <div className="flashcard-badge">📇 Auto Flashcard</div>
        <div className="flashcard-specialty">{specialty}</div>
        <button
          className="flashcard-flip-btn"
          onClick={() => setFlipped(f => !f)}>
          {flipped ? "📖 Show Summary" : "🔄 Flip Card"}
        </button>
      </div>

      {!flipped ? (
        // FRONT — Summary view
        <div className="flashcard-front">
          <div className="flashcard-title">{title}</div>
          <div className="flashcard-tabs">
            {sections.map((s, i) => (
              <button
                key={i}
                className={`fc-tab ${activeSection === i ? "active" : ""}`}
                onClick={() => setActiveSection(i)}
                style={activeSection === i ? { borderColor: "#00c896", color: "#00c896" } : {}}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
          <div className="flashcard-content"
            style={{ background: sections[activeSection]?.color || "#1a3a4a" }}>
            <div className="fc-section-title">
              {sections[activeSection]?.icon} {sections[activeSection]?.label}
            </div>
            <ul className="fc-list">
              {sections[activeSection]?.content.slice(0, 6).map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="flashcard-dots">
            {sections.map((_, i) => (
              <button
                key={i}
                className={`fc-dot ${activeSection === i ? "active" : ""}`}
                onClick={() => setActiveSection(i)}
              />
            ))}
          </div>
        </div>
      ) : (
        // BACK — Quick recall view
        <div className="flashcard-back">
          <div className="flashcard-title">{title}</div>
          <div className="fc-back-grid">
            {sections.map((s, i) => (
              <div key={i} className="fc-back-section"
                style={{ borderLeft: `3px solid #00c896`, background: s.color }}>
                <div className="fc-back-label">{s.icon} {s.label}</div>
                <div className="fc-back-content">
                  {s.content.slice(0, 3).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .flashcard-wrapper {
          margin-top: 16px;
          background: #0d1f1a;
          border: 1px solid #00c896;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'DM Mono', monospace;
        }
        .flashcard-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(0,200,150,0.1);
          border-bottom: 1px solid rgba(0,200,150,0.2);
          flex-wrap: wrap;
        }
        .flashcard-badge {
          font-size: 11px;
          color: #00c896;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .flashcard-specialty {
          font-size: 9px;
          color: #4a5450;
          text-transform: uppercase;
          letter-spacing: 1px;
          flex: 1;
        }
        .flashcard-flip-btn {
          background: rgba(0,200,150,0.15);
          border: 1px solid rgba(0,200,150,0.3);
          border-radius: 6px;
          color: #00c896;
          font-size: 10px;
          padding: 4px 10px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
        }
        .flashcard-flip-btn:hover {
          background: #00c896;
          color: #000;
        }
        .flashcard-front, .flashcard-back {
          padding: 14px;
        }
        .flashcard-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 18px;
          color: #e8ede8;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .flashcard-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .fc-tab {
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid #252b30;
          background: none;
          color: #8a9490;
          font-size: 10px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .fc-tab:hover { border-color: #00a07a; color: #e8ede8; }
        .fc-tab.active { background: rgba(0,200,150,0.1); }
        .flashcard-content {
          border-radius: 10px;
          padding: 14px;
          min-height: 120px;
          transition: background 0.3s;
        }
        .fc-section-title {
          font-size: 13px;
          color: #00c896;
          font-weight: 600;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        .fc-list {
          padding-left: 16px;
          margin: 0;
        }
        .fc-list li {
          color: #e8ede8;
          font-size: 12px;
          margin-bottom: 6px;
          line-height: 1.5;
        }
        .flashcard-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
        }
        .fc-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #252b30;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          padding: 0;
        }
        .fc-dot.active { background: #00c896; }
        .fc-back-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .fc-back-section {
          padding: 10px 12px;
          border-radius: 8px;
        }
        .fc-back-label {
          font-size: 10px;
          color: #00c896;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        .fc-back-content {
          font-size: 11px;
          color: #8a9490;
          line-height: 1.5;
        }
        @media (max-width: 480px) {
          .fc-back-grid { grid-template-columns: 1fr; }
          .flashcard-title { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}