import { useState, useEffect } from "react";

function detectBrowser() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Firefox/.test(ua)) return "firefox";
  if (/Edg/.test(ua)) return "edge";
  if (/Chrome/.test(ua)) return "chrome";
  if (/Safari/.test(ua)) return "safari";
  return "other";
}

function detectOS() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Mac/.test(ua)) return "mac";
  return "other";
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function InstallPrompt({ onDismiss }) {
  const [step, setStep] = useState("splash"); // splash | install | instructions
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const browser = detectBrowser();
  const os = detectOS();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setTimeout(() => onDismiss(), 2000);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [onDismiss]);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setTimeout(() => onDismiss(), 2000);
      }
    } else {
      setStep("instructions");
    }
  };

  const getInstructions = () => {
    if (os === "ios") {
      return [
        { icon: "1️⃣", text: "Tap the Share button at the bottom of Safari", highlight: "□↑" },
        { icon: "2️⃣", text: "Scroll down and tap", highlight: '"Add to Home Screen"' },
        { icon: "3️⃣", text: "Tap", highlight: '"Add"' + " in the top right corner" },
        { icon: "✅", text: "MedVise will appear on your home screen!", highlight: "" },
      ];
    }
    if (browser === "firefox") {
      return [
        { icon: "1️⃣", text: "Tap the three dots menu", highlight: "⋮" },
        { icon: "2️⃣", text: "Tap", highlight: '"Install"' },
        { icon: "3️⃣", text: "Tap", highlight: '"Add to Home screen"' },
        { icon: "✅", text: "MedVise is now on your home screen!", highlight: "" },
      ];
    }
    if (browser === "edge") {
      return [
        { icon: "1️⃣", text: "Tap the three dots menu", highlight: "···" },
        { icon: "2️⃣", text: "Tap", highlight: '"Add to phone"' },
        { icon: "3️⃣", text: "Tap", highlight: '"Install"' },
        { icon: "✅", text: "MedVise is now on your home screen!", highlight: "" },
      ];
    }
    return [
      { icon: "1️⃣", text: "Open your browser menu", highlight: "⋮ or ···" },
      { icon: "2️⃣", text: "Look for", highlight: '"Add to Home Screen"' },
      { icon: "3️⃣", text: "Tap", highlight: '"Install" or "Add"' },
      { icon: "✅", text: "MedVise is now on your home screen!", highlight: "" },
    ];
  };

  return (
    <div className="ip-overlay">

      {/* SPLASH SCREEN */}
      {step === "splash" && (
        <div className="ip-splash">
          {/* Animated background */}
          <div className="ip-bg-circles">
            <div className="ip-circle ip-c1" />
            <div className="ip-circle ip-c2" />
            <div className="ip-circle ip-c3" />
          </div>

          {/* Top bar */}
          <div className="ip-topbar">
            <div className="ip-logo">
              <div className="ip-logo-icon">Mv</div>
              <span className="ip-logo-text">MedVise</span>
            </div>
            <button className="ip-skip" onClick={onDismiss}>
              Skip →
            </button>
          </div>

          {/* Main content */}
          <div className="ip-main">
            <div className="ip-hero-icon">⚕</div>
            <h1 className="ip-title">MedVise</h1>
            <p className="ip-tagline">Clinical Intelligence AI</p>
            <p className="ip-desc">
              Evidence-based medical knowledge for doctors and medical students.
              Drug database, differential diagnoses, USMLE prep and more.
            </p>

            {/* Feature pills */}
            <div className="ip-features">
              {[
                "💊 Drug Database",
                "🧠 DDx Generator",
                "🎓 USMLE Quiz",
                "📄 PDF Analysis",
                "🌍 4 Languages",
                "⭐ Clinical Pearls",
              ].map((f, i) => (
                <div key={i} className="ip-feature-pill">{f}</div>
              ))}
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="ip-bottom">
            {!installed ? (
              <>
                <button className="ip-install-btn" onClick={() => setStep("install")}>
                  📱 Install MedVise App
                </button>
                <button className="ip-web-btn" onClick={onDismiss}>
                  Continue in Browser →
                </button>
                <p className="ip-note">
                  Free · No sign up · Works offline
                </p>
              </>
            ) : (
              <div className="ip-success">
                <div className="ip-success-icon">✅</div>
                <div className="ip-success-text">MedVise Installed!</div>
                <div className="ip-success-sub">Check your home screen</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSTALL STEP */}
      {step === "install" && (
        <div className="ip-install-panel">
          <div className="ip-panel-header">
            <button className="ip-back" onClick={() => setStep("splash")}>← Back</button>
            <div className="ip-panel-title">Install App</div>
            <button className="ip-skip" onClick={onDismiss}>Skip</button>
          </div>

          <div className="ip-install-content">
            <div className="ip-install-hero">
              <div className="ip-install-icon-big">Mv</div>
              <div className="ip-install-name">MedVise</div>
              <div className="ip-install-url">medvise.dailynewsug.online</div>
            </div>

            <div className="ip-install-info">
              <div className="ip-info-row">📱 Works like a native app</div>
              <div className="ip-info-row">⚡ Faster loading</div>
              <div className="ip-info-row">🔔 Quick access from home screen</div>
              <div className="ip-info-row">📶 Works with poor connection</div>
            </div>

            {deferredPrompt ? (
              <button className="ip-install-btn" onClick={handleNativeInstall}>
                Install Now
              </button>
            ) : (
              <button className="ip-install-btn" onClick={() => setStep("instructions")}>
                Show Me How →
              </button>
            )}

            <button className="ip-web-btn" onClick={onDismiss}>
              Continue in Browser
            </button>
          </div>
        </div>
      )}

      {/* INSTRUCTIONS STEP */}
      {step === "instructions" && (
        <div className="ip-install-panel">
          <div className="ip-panel-header">
            <button className="ip-back" onClick={() => setStep("install")}>← Back</button>
            <div className="ip-panel-title">How to Install</div>
            <button className="ip-skip" onClick={onDismiss}>Skip</button>
          </div>

          <div className="ip-instructions-content">
            <div className="ip-browser-badge">
              {browser === "ios" || os === "ios" ? "🍎 Safari" :
               browser === "firefox" ? "🦊 Firefox" :
               browser === "edge" ? "🌊 Edge" :
               "🌐 Your Browser"}
            </div>

            <div className="ip-steps">
              {getInstructions().map((step, i) => (
                <div key={i} className="ip-step-row">
                  <div className="ip-step-num">{step.icon}</div>
                  <div className="ip-step-text">
                    {step.text}{" "}
                    {step.highlight && (
                      <span className="ip-step-highlight">{step.highlight}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Visual hint for iOS */}
            {(os === "ios" || browser === "ios") && (
              <div className="ip-ios-hint">
                <div className="ip-ios-bar">
                  <span>medvise.dailynewsug.online</span>
                </div>
                <div className="ip-ios-share">
                  <span>□↑ Share</span>
                  <span>···</span>
                </div>
                <div className="ip-ios-arrow">↑ Tap Share button</div>
              </div>
            )}

            <button className="ip-install-btn" style={{ marginTop: "20px" }} onClick={onDismiss}>
              Got it — Open MedVise
            </button>
          </div>
        </div>
      )}

      <style>{`
        .ip-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: #0a0d0f;
          font-family: 'DM Mono', monospace;
          overflow-y: auto;
        }

        /* SPLASH */
        .ip-splash {
          min-height: 100vh; min-height: 100dvh;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }

        /* Animated background */
        .ip-bg-circles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .ip-circle {
          position: absolute; border-radius: 50%;
          background: rgba(0,200,150,0.05);
          animation: pulse 4s ease-in-out infinite;
        }
        .ip-c1 { width: 400px; height: 400px; top: -100px; right: -100px; animation-delay: 0s; }
        .ip-c2 { width: 300px; height: 300px; bottom: 100px; left: -80px; animation-delay: 1.5s; }
        .ip-c3 { width: 200px; height: 200px; top: 40%; right: 10%; animation-delay: 3s; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        /* Top bar */
        .ip-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; flex-shrink: 0; position: relative; z-index: 1;
        }
        .ip-logo { display: flex; align-items: center; gap: 8px; }
        .ip-logo-icon {
          width: 32px; height: 32px; background: #00c896; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #000; font-weight: 700; font-size: 12px;
        }
        .ip-logo-text {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 20px; font-weight: 600; color: #e8ede8;
        }
        .ip-skip {
          background: none; border: 1px solid #1e2428; border-radius: 6px;
          color: #4a5450; font-family: 'DM Mono', monospace;
          font-size: 11px; padding: 5px 12px; cursor: pointer;
          transition: all 0.15s;
        }
        .ip-skip:hover { border-color: #4a5450; color: #8a9490; }

        /* Main */
        .ip-main {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 20px 24px; text-align: center;
          position: relative; z-index: 1;
        }
        .ip-hero-icon {
          font-size: 64px; margin-bottom: 16px;
          filter: drop-shadow(0 0 20px rgba(0,200,150,0.4));
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .ip-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 42px; font-weight: 700; color: #e8ede8;
          margin: 0 0 6px; letter-spacing: -0.5px;
        }
        .ip-tagline {
          font-size: 13px; color: #00c896; letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .ip-desc {
          font-size: 13px; color: #8a9490; line-height: 1.7;
          max-width: 340px; margin-bottom: 24px;
        }

        /* Feature pills */
        .ip-features {
          display: flex; flex-wrap: wrap; gap: 8px;
          justify-content: center; max-width: 360px;
        }
        .ip-feature-pill {
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid #1e2428; background: #111417;
          color: #8a9490; font-size: 11px;
          animation: fadeInUp 0.5s ease both;
        }
        .ip-feature-pill:nth-child(1) { animation-delay: 0.1s; }
        .ip-feature-pill:nth-child(2) { animation-delay: 0.2s; }
        .ip-feature-pill:nth-child(3) { animation-delay: 0.3s; }
        .ip-feature-pill:nth-child(4) { animation-delay: 0.4s; }
        .ip-feature-pill:nth-child(5) { animation-delay: 0.5s; }
        .ip-feature-pill:nth-child(6) { animation-delay: 0.6s; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Bottom */
        .ip-bottom {
          padding: 24px; display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          position: relative; z-index: 1;
          border-top: 1px solid #1e2428;
          background: rgba(10,13,15,0.9);
          backdrop-filter: blur(10px);
        }
        .ip-install-btn {
          width: 100%; max-width: 360px; padding: 14px;
          background: #00c896; border: none; border-radius: 12px;
          color: #000; font-family: 'DM Mono', monospace;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(0,200,150,0.3);
        }
        .ip-install-btn:hover { background: #00e0aa; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,200,150,0.4); }
        .ip-install-btn:active { transform: translateY(0); }
        .ip-web-btn {
          background: none; border: 1px solid #1e2428; border-radius: 10px;
          color: #4a5450; font-family: 'DM Mono', monospace;
          font-size: 12px; padding: 10px 24px; cursor: pointer;
          transition: all 0.15s; width: 100%; max-width: 360px;
        }
        .ip-web-btn:hover { border-color: #252b30; color: #8a9490; }
        .ip-note { font-size: 10px; color: #2a3430; }

        /* Success */
        .ip-success { text-align: center; padding: 20px; }
        .ip-success-icon { font-size: 48px; margin-bottom: 12px; }
        .ip-success-text { font-size: 18px; color: #00c896; font-weight: 600; margin-bottom: 6px; }
        .ip-success-sub { font-size: 12px; color: #8a9490; }

        /* INSTALL PANEL */
        .ip-install-panel {
          min-height: 100vh; min-height: 100dvh;
          display: flex; flex-direction: column;
        }
        .ip-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #1e2428; flex-shrink: 0;
        }
        .ip-back {
          background: none; border: none; color: #8a9490;
          font-family: 'DM Mono', monospace; font-size: 12px;
          cursor: pointer; padding: 4px 8px;
        }
        .ip-back:hover { color: #e8ede8; }
        .ip-panel-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 18px; color: #e8ede8;
        }
        .ip-install-content {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; padding: 32px 24px; gap: 16px;
        }
        .ip-install-hero { text-align: center; margin-bottom: 8px; }
        .ip-install-icon-big {
          width: 80px; height: 80px; background: #00c896; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          color: #000; font-weight: 700; font-size: 28px;
          margin: 0 auto 12px; box-shadow: 0 8px 30px rgba(0,200,150,0.3);
        }
        .ip-install-name {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 24px; color: #e8ede8; font-weight: 600; margin-bottom: 4px;
        }
        .ip-install-url { font-size: 11px; color: #4a5450; }
        .ip-install-info {
          background: #111417; border: 1px solid #1e2428;
          border-radius: 12px; padding: 16px; width: 100%; max-width: 360px;
        }
        .ip-info-row { font-size: 12px; color: #8a9490; padding: 6px 0; border-bottom: 1px solid #1e2428; }
        .ip-info-row:last-child { border-bottom: none; }

        /* INSTRUCTIONS */
        .ip-instructions-content {
          flex: 1; padding: 24px; display: flex;
          flex-direction: column; align-items: center;
        }
        .ip-browser-badge {
          padding: 6px 16px; border-radius: 20px;
          border: 1px solid #252b30; background: #111417;
          color: #8a9490; font-size: 11px; margin-bottom: 24px;
        }
        .ip-steps {
          width: 100%; max-width: 380px; margin-bottom: 20px;
        }
        .ip-step-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; margin-bottom: 8px;
          background: #111417; border: 1px solid #1e2428;
          border-radius: 10px;
        }
        .ip-step-num { font-size: 20px; flex-shrink: 0; }
        .ip-step-text { font-size: 12px; color: #8a9490; line-height: 1.6; }
        .ip-step-highlight {
          color: #00c896; font-weight: 700;
          background: rgba(0,200,150,0.1);
          padding: 1px 6px; border-radius: 4px;
        }

        /* iOS hint */
        .ip-ios-hint {
          width: 100%; max-width: 300px;
          background: #111417; border: 1px solid #1e2428;
          border-radius: 12px; overflow: hidden; margin-bottom: 8px;
        }
        .ip-ios-bar {
          padding: 10px 14px; background: #1a1e22;
          font-size: 11px; color: #4a5450;
          border-bottom: 1px solid #1e2428;
        }
        .ip-ios-share {
          display: flex; justify-content: space-between;
          padding: 10px 14px; font-size: 12px; color: #8a9490;
        }
        .ip-ios-arrow {
          text-align: center; padding: 8px;
          font-size: 11px; color: #00c896;
          background: rgba(0,200,150,0.05);
        }

        @media (max-width: 380px) {
          .ip-title { font-size: 34px; }
          .ip-hero-icon { font-size: 52px; }
        }
      `}</style>
    </div>
  );
}