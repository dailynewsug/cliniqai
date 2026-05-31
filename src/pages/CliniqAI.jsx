import { useState, useRef, useEffect } from "react";

const SPECIALTIES = [
  "General", "Cardiology", "Neurology", "Pharmacology",
  "Surgery", "Pediatrics", "Oncology", "Psychiatry",
  "Endocrinology", "Gastroenterology", "Pulmonology", "Nephrology",
  "Infectious Disease", "Rheumatology", "Dermatology", "Hematology",
  "Orthopedics", "Ophthalmology", "OB/GYN", "Emergency Medicine"
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Kiswahili" }
];

const DEPTH_LEVELS = ["Student", "Resident", "Specialist"];

function buildSystemPrompt(specialty, language, settings) {
  const depthMap = {
    Student: "Use simple language, avoid heavy jargon, explain all terms.",
    Resident: "Use clinical language appropriate for a medical resident.",
    Specialist: "Use advanced clinical and research-level language."
  };
  const langMap = {
    en: "Respond in English.",
    ar: "Respond in Arabic.",
    fr: "Respond in French.",
    sw: "Respond in Kiswahili."
  };
  return `You are CliniqAI — an advanced clinical intelligence assistant for doctors and medical students.
Current specialty context: ${specialty}
Depth level: ${settings.depth} — ${depthMap[settings.depth]}
Language: ${langMap[language]}
You provide evidence-based medical Q&A, drug info, differential diagnoses, and clinical guidelines.
${settings.clinicalPearls ? "Always end responses with a ⭐ Clinical Pearl." : ""}
${settings.flashcards ? "Always end with a 📇 Flashcard:\n  FRONT: [key concept]\n  BACK: [concise answer]" : ""}
Format with ## headers and bullet points. Always add educational disclaimer.`;
}

function formatMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/(<\/ul>)\s*(<ul>)/g, '')
    .replace(/\n\n/g, '</p><p>')
    .trim();
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  );
}

function MessageBlock({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`message-row ${isUser ? "user-row" : "ai-row"}`}>
      {!isUser && <div className="avatar ai-avatar">✦</div>}
      <div className={`message-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
        {isUser
          ? <p>{msg.content}</p>
          : <div className="ai-content"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
        }
        {msg.fileInfo && (
          <div className="file-tag">📎 {msg.fileInfo}</div>
        )}
        {msg.specialty && !isUser && (
          <span className="specialty-tag">{msg.specialty}</span>
        )}
      </div>
      {isUser && <div className="avatar user-avatar">U</div>}
    </div>
  );
}

export default function CliniqAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState("General");
  const [language, setLanguage] = useState("en");
  const [activePanel, setActivePanel] = useState("specialties");
  const [settings, setSettings] = useState({
    usmlMode: false,
    flashcards: false,
    clinicalPearls: true,
    depth: "Student"
  });
  const [showSettings, setShowSettings] = useState(false);
  const [drugQuery, setDrugQuery] = useState("");
  const [ddxInput, setDdxInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    } else {
      setUploadPreview(null);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText && !uploadedFile) return;
    if (loading) return;

    const displayText = userText || (uploadedFile ? `Analyze this file: ${uploadedFile.name}` : '');
    const userMsg = {
      role: "user",
      content: displayText,
      fileInfo: uploadedFile ? uploadedFile.name : null
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      let data;

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('question', userText || 'Please analyze this medical document and provide a detailed summary.');
        formData.append('system', buildSystemPrompt(specialty, language, settings));

        const res = await fetch("http://localhost:3001/api/upload", {
          method: "POST",
          body: formData
        });
        data = await res.json();
        removeFile();
      } else {
        const res = await fetch("http://localhost:3001/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: buildSystemPrompt(specialty, language, settings),
            messages: updated.map(m => ({ role: m.role, content: m.content }))
          })
        });
        data = await res.json();
      }

      const aiText = data.content?.map(b => b.text || "").join("") || "No response.";
      setMessages(prev => [...prev, { role: "assistant", content: aiText, specialty }]);
      setChatHistory(prev => {
        const title = displayText.slice(0, 40) + (displayText.length > 40 ? "…" : "");
        return [{ title, specialty, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)];
      });
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Connection error. Please try again.",
        specialty
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const runDrugLookup = () => {
    if (!drugQuery.trim()) return;
    sendMessage(`Drug lookup: ${drugQuery}. Give me: mechanism of action, indications, dosing, drug interactions, and a clinical pearl.`);
    setDrugQuery("");
  };

  const runDDx = () => {
    if (!ddxInput.trim()) return;
    sendMessage(`Generate a ranked differential diagnosis for this clinical presentation: ${ddxInput}. For each diagnosis give probability (high/medium/low), key supporting features, and recommended investigations.`);
    setDdxInput("");
  };

  const runUSMLE = () => {
    sendMessage(`Generate a USMLE-style vignette question for ${specialty}. Include 5 answer choices (A–E), then reveal the correct answer with a detailed explanation.`);
  };

  const toggleSetting = (key) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const isRTL = language === "ar";

  return (
    <div className={`app ${isRTL ? "rtl" : ""}`}>

      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            <div className="settings-title">⚙ Settings</div>
            {[
              { key: "usmlMode", label: "USMLE Quiz Mode", sub: "Generates vignette-style questions" },
              { key: "flashcards", label: "Auto Flashcards", sub: "Adds flashcard to every response" },
              { key: "clinicalPearls", label: "Clinical Pearls", sub: "Ends each response with a key pearl" },
            ].map(({ key, label, sub }) => (
              <div className="setting-row" key={key}>
                <div>
                  <div className="setting-label">{label}</div>
                  <div className="setting-sub">{sub}</div>
                </div>
                <button className={`toggle ${settings[key] ? "on" : "off"}`}
                  onClick={() => toggleSetting(key)} />
              </div>
            ))}
            <div className="setting-row">
              <div>
                <div className="setting-label">Depth Level</div>
                <div className="setting-sub">Adjusts complexity of answers</div>
              </div>
              <div className="depth-btns">
                {DEPTH_LEVELS.map(d => (
                  <button key={d}
                    className={`depth-btn ${settings.depth === d ? "active" : ""}`}
                    onClick={() => setSettings(prev => ({ ...prev, depth: d }))}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <button className="close-settings-btn" onClick={() => setShowSettings(false)}>
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <div className="logo-icon">Cq</div>
            <span className="logo-name">CliniqAI</span>
          </div>
          <span className="logo-tagline">Clinical Intelligence AI</span>
        </div>
        <div className="topbar-right">
          {LANGUAGES.map(l => (
            <button key={l.code}
              className={`lang-btn ${language === l.code ? "active" : ""}`}
              onClick={() => setLanguage(l.code)}>
              {l.label}
            </button>
          ))}
          <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙</button>
          <div className="status-dot" />
        </div>
      </div>

      {/* BODY */}
      <div className="body">

        {/* LEFT SIDEBAR */}
        <div className="left-sidebar">
          <div className="panel-tabs">
            {[
              { id: "specialties", label: "Spec" },
              { id: "drugs", label: "Drug" },
              { id: "ddx", label: "DDx" },
              { id: "history", label: "Hist" },
            ].map(p => (
              <button key={p.id}
                className={`panel-tab ${activePanel === p.id ? "active" : ""}`}
                onClick={() => setActivePanel(p.id)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="panel-content">
            {activePanel === "specialties" && (
              <>
                <div className="section-label">Specialty Context</div>
                <div className="specialty-grid">
                  {SPECIALTIES.map(s => (
                    <button key={s}
                      className={`spec-chip ${specialty === s ? "active" : ""}`}
                      onClick={() => setSpecialty(s)}>{s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activePanel === "drugs" && (
              <>
                <div className="section-label">Drug Database</div>
                <input className="side-input"
                  placeholder="e.g. metformin, warfarin..."
                  value={drugQuery}
                  onChange={e => setDrugQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runDrugLookup()}
                />
                <button className="action-btn" onClick={runDrugLookup}>🔍 Look Up Drug</button>
                <div className="panel-hint">mechanism · indications · dosing · interactions · pearl</div>
              </>
            )}

            {activePanel === "ddx" && (
              <>
                <div className="section-label">DDx Generator</div>
                <textarea className="side-textarea" rows={5}
                  placeholder="e.g. 45yo male, chest pain, diaphoresis..."
                  value={ddxInput}
                  onChange={e => setDdxInput(e.target.value)}
                />
                <button className="action-btn" onClick={runDDx}>🧠 Generate Differentials</button>
                <div className="panel-hint">ranked DDx · probability · investigations</div>
              </>
            )}

            {activePanel === "history" && (
              <>
                <div className="section-label">Chat History</div>
                {chatHistory.length === 0
                  ? <div className="panel-hint">No history yet. Start chatting!</div>
                  : chatHistory.map((h, i) => (
                    <div key={i} className="history-item">
                      <div className="history-title">{h.title}</div>
                      <div className="history-meta">{h.specialty} · {h.time}</div>
                    </div>
                  ))
                }
              </>
            )}
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="main">
          <div className="chat-area">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚕</div>
                <div className="empty-title">Ask CliniqAI anything</div>
                <div className="empty-sub">
                  Evidence-based answers for clinicians and medical students.<br />
                  Select a specialty · look up a drug · upload a document
                </div>
              </div>
            ) : (
              messages.map((msg, i) => <MessageBlock key={i} msg={msg} />)
            )}
            {loading && (
              <div className="message-row ai-row">
                <div className="avatar ai-avatar">✦</div>
                <div className="message-bubble ai-bubble"><TypingIndicator /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* FILE PREVIEW */}
          {uploadedFile && (
            <div className="file-preview-bar">
              <div className="file-preview-info">
                {uploadPreview
                  ? <img src={uploadPreview} alt="preview" className="img-thumb" />
                  : <span className="file-icon">📄</span>
                }
                <span className="file-name">{uploadedFile.name}</span>
              </div>
              <button className="remove-file-btn" onClick={removeFile}>✕</button>
            </div>
          )}

          {/* INPUT */}
          <div className="input-area">
            <div className="input-wrapper">
              <button className="attach-btn" onClick={() => fileRef.current?.click()}
                title="Upload PDF or Image">
                📎
              </button>
              <input ref={fileRef} type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <textarea ref={inputRef} className="chat-input"
                placeholder={uploadedFile
                  ? "Ask a question about this file, or press send to analyze it..."
                  : "Ask about drugs, diseases, pathophysiology, diagnostics..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
              />
              <button className="send-btn"
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !uploadedFile) || loading}>
                <svg width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="input-meta">
              <span className="input-hint">Enter to send · 📎 to upload PDF or image</span>
              <button className="usmle-btn" onClick={runUSMLE}>🎓 USMLE Quiz</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; height: 52px; min-height: 52px;
          background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .topbar-right { display: flex; align-items: center; gap: 8px; }
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo-icon {
          width: 28px; height: 28px; background: var(--accent); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #000; font-weight: 700; font-size: 11px;
        }
        .logo-name { font-family: var(--font-serif); font-size: 20px; font-weight: 600; }
        .logo-tagline { font-size: 11px; color: var(--text3); }
        .lang-btn {
          padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border2);
          background: var(--surface2); color: var(--text2); cursor: pointer;
          font-size: 11px; font-family: var(--font-mono); transition: all 0.15s;
        }
        .lang-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
        .icon-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border2);
          background: var(--surface2); color: var(--text2); cursor: pointer;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); }
        .body { display: flex; flex: 1; overflow: hidden; }
        .left-sidebar {
          width: 240px; min-width: 240px; background: var(--surface);
          border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden;
        }
        .panel-tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .panel-tab {
          flex: 1; padding: 10px 4px; background: none; border: none;
          color: var(--text3); font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.15s;
        }
        .panel-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .panel-content { flex: 1; overflow-y: auto; padding: 14px; }
        .section-label {
          font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--text3); margin-bottom: 10px;
        }
        .specialty-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .spec-chip {
          padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border2);
          background: none; color: var(--text2); font-family: var(--font-mono);
          font-size: 10px; cursor: pointer; transition: all 0.15s;
        }
        .spec-chip:hover { border-color: var(--accent2); color: var(--text); }
        .spec-chip.active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }
        .side-input {
          width: 100%; background: var(--surface2); border: 1px solid var(--border2);
          border-radius: 8px; padding: 8px 10px; color: var(--text);
          font-family: var(--font-mono); font-size: 11px; outline: none;
        }
        .side-input:focus { border-color: var(--accent); }
        .side-textarea {
          width: 100%; background: var(--surface2); border: 1px solid var(--border2);
          border-radius: 8px; padding: 8px 10px; color: var(--text);
          font-family: var(--font-mono); font-size: 11px; outline: none; resize: none;
        }
        .side-textarea:focus { border-color: var(--accent); }
        .action-btn {
          width: 100%; margin-top: 8px; padding: 8px; border-radius: 8px;
          border: 1px solid var(--accent2); background: var(--accent-glow);
          color: var(--accent); font-family: var(--font-mono); font-size: 11px;
          cursor: pointer; transition: all 0.15s;
        }
        .action-btn:hover { background: var(--accent); color: #000; }
        .panel-hint { margin-top: 10px; font-size: 10px; color: var(--text3); line-height: 1.6; }
        .history-item {
          padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
          margin-bottom: 6px; cursor: pointer; transition: all 0.15s;
        }
        .history-item:hover { border-color: var(--border2); background: var(--surface2); }
        .history-title { font-size: 11px; color: var(--text); margin-bottom: 2px; }
        .history-meta { font-size: 9px; color: var(--text3); }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-area { flex: 1; overflow-y: auto; padding: 24px; }
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%; gap: 12px; text-align: center;
        }
        .empty-icon { font-size: 40px; }
        .empty-title { font-family: var(--font-serif); font-size: 26px; }
        .empty-sub { font-size: 12px; color: var(--text2); max-width: 400px; line-height: 1.7; }
        .message-row { display: flex; gap: 12px; margin-bottom: 20px; align-items: flex-start; }
        .user-row { flex-direction: row-reverse; }
        .avatar {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
        }
        .ai-avatar { background: var(--accent-glow); border: 1px solid var(--accent2); color: var(--accent); }
        .user-avatar { background: var(--user-bg); border: 1px solid var(--user-border); color: var(--text2); }
        .message-bubble { max-width: 72%; padding: 14px 16px; border-radius: 12px; line-height: 1.6; }
        .ai-bubble { background: var(--surface); border: 1px solid var(--border); border-radius: 4px 12px 12px 12px; }
        .user-bubble { background: var(--user-bg); border: 1px solid var(--user-border); border-radius: 12px 4px 12px 12px; }
        .ai-content .md-h3 { font-family: var(--font-serif); font-size: 16px; color: var(--accent); margin: 12px 0 6px; font-weight: 600; }
        .ai-content .md-h4 { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--text2); margin: 10px 0 4px; }
        .ai-content ul { padding-left: 16px; margin: 6px 0; }
        .ai-content li { margin-bottom: 4px; }
        .ai-content strong { color: var(--accent); }
        .ai-content em { color: var(--text2); font-style: italic; }
        .ai-content p { margin-bottom: 6px; }
        .specialty-tag {
          display: inline-block; margin-top: 8px; padding: 2px 8px;
          background: var(--accent-glow); border: 1px solid var(--accent2);
          border-radius: 4px; font-size: 9px; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--accent);
        }
        .file-tag {
          display: inline-block; margin-top: 6px; padding: 2px 8px;
          background: var(--surface2); border: 1px solid var(--border2);
          border-radius: 4px; font-size: 10px; color: var(--text2);
        }
        .file-preview-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 24px; background: var(--surface2); border-top: 1px solid var(--border);
        }
        .file-preview-info { display: flex; align-items: center; gap: 10px; }
        .img-thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border2); }
        .file-icon { font-size: 24px; }
        .file-name { font-size: 12px; color: var(--text2); }
        .remove-file-btn {
          background: none; border: none; color: var(--text3); cursor: pointer;
          font-size: 16px; padding: 4px 8px; border-radius: 4px;
        }
        .remove-file-btn:hover { color: var(--red); }
        .typing-indicator { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .typing-indicator span { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: bounce 1.2s ease-in-out infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100% { transform: scale(0.7); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        .input-area {
          padding: 16px 24px; border-top: 1px solid var(--border);
          background: var(--surface); flex-shrink: 0;
        }
        .input-wrapper {
          display: flex; gap: 10px; align-items: flex-end;
          background: var(--surface2); border: 1px solid var(--border2);
          border-radius: 12px; padding: 10px 14px; transition: border-color 0.2s;
        }
        .input-wrapper:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
        .attach-btn {
          background: none; border: none; cursor: pointer; font-size: 18px;
          padding: 0 4px; opacity: 0.6; transition: opacity 0.15s; flex-shrink: 0;
        }
        .attach-btn:hover { opacity: 1; }
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text); font-family: var(--font-mono); font-size: 13px;
          line-height: 1.5; resize: none; max-height: 120px; min-height: 20px;
        }
        .chat-input::placeholder { color: var(--text3); }
        .send-btn {
          background: var(--accent); border: none; border-radius: 8px;
          width: 34px; height: 34px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; color: #000; transition: all 0.15s; flex-shrink: 0;
        }
        .send-btn:hover { background: #00e0aa; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        .input-meta { display: flex; justify-content: space-between; margin-top: 6px; }
        .input-hint { font-size: 10px; color: var(--text3); }
        .usmle-btn {
          padding: 2px 10px; border-radius: 4px; border: 1px solid var(--border2);
          background: none; color: var(--text3); font-family: var(--font-mono);
          font-size: 10px; cursor: pointer; transition: all 0.15s;
        }
        .usmle-btn:hover { border-color: var(--accent); color: var(--accent); }
        .settings-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .settings-panel {
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 16px; padding: 28px; width: 380px; max-width: 90vw;
        }
        .settings-title { font-family: var(--font-serif); font-size: 22px; margin-bottom: 20px; }
        .setting-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid var(--border);
        }
        .setting-label { font-size: 13px; color: var(--text); margin-bottom: 2px; }
        .setting-sub { font-size: 10px; color: var(--text3); }
        .toggle {
          width: 40px; height: 22px; border-radius: 11px; border: none;
          cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0;
        }
        .toggle.on { background: var(--accent); }
        .toggle.off { background: var(--border2); }
        .toggle::after {
          content: ''; position: absolute; width: 16px; height: 16px;
          border-radius: 50%; background: white; top: 3px; transition: left 0.2s;
        }
        .toggle.on::after { left: 21px; }
        .toggle.off::after { left: 3px; }
        .depth-btns { display: flex; gap: 6px; }
        .depth-btn {
          padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border2);
          background: none; color: var(--text3); font-family: var(--font-mono);
          font-size: 10px; cursor: pointer; transition: all 0.15s;
        }
        .depth-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
        .close-settings-btn {
          width: 100%; margin-top: 20px; padding: 10px; border-radius: 8px;
          border: 1px solid var(--border2); background: none; color: var(--text2);
          font-family: var(--font-mono); font-size: 12px; cursor: pointer; transition: all 0.15s;
        }
        .close-settings-btn:hover { border-color: var(--accent); color: var(--accent); }
        .rtl { direction: rtl; text-align: right; }
      `}</style>
    </div>
  );
}