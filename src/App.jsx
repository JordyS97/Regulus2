import React, { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  DollarSign, 
  Coins, 
  LogOut, 
  Search, 
  Cpu, 
  Terminal, 
  Compass, 
  Flame, 
  Activity 
} from "lucide-react";

// Firebase Configuration (using cryptotrade2-65918)
const firebaseConfig = {
  apiKey: "AIzaSyAp0LUs4P5xxo0g4L4Pxn-GVR40Is9QVHQ",
  authDomain: "cryptotrade2-65918.firebaseapp.com",
  projectId: "cryptotrade2-65918",
  storageBucket: "cryptotrade2-65918.firebasestorage.app",
  messagingSenderId: "99135911140",
  appId: "1:99135911140:web:2f4bf546d135bed7c4e8f1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  // Real-time data states
  const [searchTicker, setSearchTicker] = useState("BTC");
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [weights, setWeights] = useState(null);
  const [logs, setLogs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [searchError, setSearchError] = useState("");

  // Handle Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Real-time Firestore Listeners
  useEffect(() => {
    if (!user) return;

    // 1. Listen to active coin analysis (based on search ticker)
    const analysisRef = doc(db, "analytics", `analysis_${searchTicker.toUpperCase()}`);
    const unsubAnalysis = onSnapshot(analysisRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveAnalysis(data);
        setSearchError("");
        
        // Format historical chart data
        if (data.historical_data) {
          const formatted = data.historical_data.map((item, idx) => {
            const progress = idx / Math.max(1, data.historical_data.length - 1);
            const macroSentiment = -0.3 - (0.7 * progress);
            return {
              date: new Date(item.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              price: item.val,
              volume: Math.floor(item.val * (1.2 + Math.random() * 0.5)),
              sentiment: parseFloat(macroSentiment.toFixed(2))
            };
          });
          setChartData(formatted);
        }
      } else {
        setSearchError(`Analysis for ${searchTicker.toUpperCase()} not found. Run '/analysis ${searchTicker.toUpperCase()}' in Telegram to generate it!`);
        if (searchTicker.toUpperCase() !== "BTC") {
          setSearchTicker("BTC");
        }
      }
    });

    // 2. Listen to latest global recommendation
    const recRef = doc(db, "analytics", "latest_recommendation");
    const unsubRec = onSnapshot(recRef, (docSnap) => {
      if (docSnap.exists()) {
        setRecommendation(docSnap.data());
      }
    });

    // 3. Listen to model weights
    const weightsRef = doc(db, "weights", "latest");
    const unsubWeights = onSnapshot(weightsRef, (docSnap) => {
      if (docSnap.exists()) {
        setWeights(docSnap.data());
      }
    });

    // 4. Listen to active positions
    const posRef = doc(db, "positions", "btc_short_20260629");
    const unsubPos = onSnapshot(posRef, (docSnap) => {
      if (docSnap.exists()) {
        setPositions([docSnap.data()]);
      }
    });

    // 5. Listen to training logs
    const logRef = doc(db, "logs", "log_20260629_091606");
    const unsubLogs = onSnapshot(logRef, (docSnap) => {
      if (docSnap.exists()) {
        setLogs([docSnap.data()]);
      }
    });

    return () => {
      unsubAnalysis();
      unsubRec();
      unsubWeights();
      unsubPos();
      unsubLogs();
    };
  }, [user, searchTicker]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === "auth/unauthorized-domain") {
        setAuthError(
          `Unauthorized Domain: The domain "${window.location.hostname}" is not authorized in your Firebase project. ` +
          `Please go to your Firebase Console -> Authentication -> Settings -> Authorized Domains, and add this domain.`
        );
      } else {
        setAuthError(`Login failed: ${err.message}`);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "screen", backgroundColor: "#020617" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Login Page View
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-glow"></div>
        <div className="login-card">
          <div className="brand-icon-container">
            <Cpu style={{ width: "40px", height: "40px" }} />
          </div>
          <h1 className="login-title">REGULUS 2.0</h1>
          <p className="login-subtitle">Advanced Macro-Crypto AI Agent Dashboard</p>
          
          <button onClick={handleGoogleLogin} className="btn-google">
            <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign In with Google
          </button>

          {authError && (
            <div className="error-banner">
              <strong>⚠️ Authentication Error</strong>
              <p style={{ marginTop: "6px" }}>{authError}</p>
              <p style={{ marginTop: "8px" }}>
                <a href="https://console.firebase.google.com/project/cryptotrade2-65918/authentication/settings" target="_blank" rel="noreferrer">
                  Open Firebase Console to add domain
                </a>
              </p>
            </div>
          )}

          <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Access restricted to authorized credentials. Ingesting global macro indicators 24/7.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="header-icon">
              <Cpu style={{ width: "24px", height: "24px" }} />
            </div>
            <div className="header-title-group">
              <h1>REGULUS 2.0</h1>
              <span>Status: Sandbox Active</span>
            </div>
          </div>

          {/* Search Ticker */}
          <div className="search-bar">
            <Search style={{ width: "16px", height: "16px", color: "var(--text-secondary)" }} />
            <input 
              type="text" 
              placeholder="Search ticker (e.g. SOL, ETH)"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value)}
            />
          </div>

          {/* User Profile */}
          <div className="user-profile">
            <img src={user.photoURL} alt="avatar" className="user-avatar" />
            <div className="user-info" style={{ display: "none" }}>
              <p className="user-name">{user.displayName}</p>
              <p className="user-email">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Logout">
              <LogOut style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {searchError && (
          <div className="error-banner" style={{ marginBottom: "24px" }}>
            <strong>⚠️ Search Alert</strong>
            <p style={{ marginTop: "4px" }}>{searchError}</p>
          </div>
        )}

        <div className="grid-layout">
          {/* Left Panel */}
          <div className="side-panel">
            {/* GSS Score */}
            <div className="dashboard-card">
              <h3 className="card-title">GLOBAL SENTIMENT SCORE (GSS)</h3>
              <div className="gss-container">
                <div className="gss-value">{recommendation?.global_sentiment_score ?? -1.0}</div>
                <p className="gss-subtitle">Scale: -1.0 (Bearish) to +1.0 (Bullish)</p>

                <div className="gss-bar">
                  <div 
                    className="gss-progress-bearish" 
                    style={{ width: (recommendation?.global_sentiment_score ?? -1.0) === -1.0 ? "100%" : "50%" }}
                  ></div>
                  <div 
                    className="gss-progress-bullish" 
                    style={{ width: (recommendation?.global_sentiment_score ?? -1.0) === 1.0 ? "100%" : "0%" }}
                  ></div>
                </div>
                
                <div className="gss-labels">
                  <span>BEARISH</span>
                  <span>NEUTRAL</span>
                  <span>BULLISH</span>
                </div>
              </div>
            </div>

            {/* Position Details */}
            <div className="dashboard-card">
              <div className="position-header">
                <h3 className="card-title" style={{ marginBottom: 0 }}>ACTIVE POSITION</h3>
                <span className="badge-active">OPEN</span>
              </div>

              {positions.map((pos, idx) => (
                <div key={idx} style={{ marginTop: "16px" }}>
                  <div className="pos-detail-row">
                    <div>
                      <p className="pos-asset">{pos.asset}</p>
                      <span className="pos-action">{pos.action}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="pos-size-label">Simulated Size</span>
                      <p className="pos-size-val">${pos.position_size_usd?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pos-grid">
                    <div>
                      <span className="pos-grid-label">Entry Range</span>
                      <strong>{pos.entry_range}</strong>
                    </div>
                    <div>
                      <span className="pos-grid-label">Target TP</span>
                      <strong style={{ color: "var(--emerald-primary)" }}>{pos.tp}</strong>
                    </div>
                    <div>
                      <span className="pos-grid-label">Hard SL</span>
                      <strong style={{ color: "var(--rose-primary)" }}>{pos.sl}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "between", fontSize: "12px", marginTop: "12px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Chance of Win:</span>
                    <strong style={{ color: "var(--emerald-primary)", marginLeft: "auto" }}>74%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="side-panel">
            {/* Chart */}
            <div className="dashboard-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{searchTicker.toUpperCase()}/USD Market Feed</h3>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Price + Volume + Macro Sentiment Overlay Line (30 Days)</p>
                </div>
              </div>

              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={9} tickLine={false} />
                    <YAxis yAxisId="left" stroke="var(--sky-primary)" fontSize={9} domain={["auto", "auto"]} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--rose-primary)" fontSize={9} domain={[-1, 1]} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)", borderRadius: "10px" }} 
                      labelStyle={{ fontWeight: "bold", color: "#fff" }}
                    />
                    <Legend fontSize={10} />
                    <Bar yAxisId="left" dataKey="volume" name="Volume" barSize={10} fill="var(--sky-primary)" opacity={0.12} />
                    <Line yAxisId="left" type="monotone" dataKey="price" name="Price (USD)" stroke="var(--sky-primary)" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="sentiment" name="Macro Sentiment" stroke="var(--rose-primary)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macro Grid */}
            <div className="macro-grid">
              <div className="macro-card">
                <span className="macro-label">WTI CRUDE OIL</span>
                <span className="macro-value">$70.05</span>
                <span className="macro-status status-bearish">Bearish</span>
              </div>
              <div className="macro-card">
                <span className="macro-label">GOLD (XAU/USD)</span>
                <span className="macro-value">$4,058.00</span>
                <span className="macro-status status-bearish">Risk-Off</span>
              </div>
              <div className="macro-card">
                <span className="macro-label">US 10Y YIELD</span>
                <span className="macro-value">4.38%</span>
                <span className="macro-status status-bearish">Elevated</span>
              </div>
              <div className="macro-card">
                <span className="macro-label">US DOLLAR INDEX</span>
                <span className="macro-value">101.29</span>
                <span className="macro-status status-neutral">Flat</span>
              </div>
              <div className="macro-card">
                <span className="macro-label">US CPI INFLATION</span>
                <span className="macro-value">4.2% YoY</span>
                <span className="macro-status status-bearish">High</span>
              </div>
              <div className="macro-card">
                <span className="macro-label">FED RATE</span>
                <span className="macro-value">3.50%-3.75%</span>
                <span className="macro-status status-bearish">Hawkish</span>
              </div>
            </div>

            {/* Trending & New Listings */}
            <div className="trending-grid">
              <div className="dashboard-card">
                <h4 className="card-title">TOP GAINERS & LOSERS</h4>
                <div className="list-item">
                  <div>
                    <p className="list-item-title">Act I: The AI Prophecy (ACT)</p>
                    <span className="list-item-sub">Trending #1 | Bubble Chart</span>
                  </div>
                  <strong style={{ color: "var(--emerald-primary)" }}>+34.45%</strong>
                </div>
                <div className="list-item">
                  <div>
                    <p className="list-item-title">Synapse (SYN)</p>
                    <span className="list-item-sub">Gainer #2</span>
                  </div>
                  <strong style={{ color: "var(--emerald-primary)" }}>+27.10%</strong>
                </div>
                <div className="list-item">
                  <div>
                    <p className="list-item-title">Skyai (SKYAI)</p>
                    <span className="list-item-sub">Loser #1</span>
                  </div>
                  <strong style={{ color: "var(--rose-primary)" }}>-44.65%</strong>
                </div>
              </div>

              <div className="dashboard-card">
                <h4 className="card-title">NEW LISTINGS</h4>
                <div className="list-item">
                  <div>
                    <p className="list-item-title">Moon Swap (MOON)</p>
                    <span className="list-item-sub">Init Liq: $150K</span>
                  </div>
                  <span className="badge-volatility" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>High Vol</span>
                </div>
                <div className="list-item">
                  <div>
                    <p className="list-item-title">Patos Meme Coin (PATOS)</p>
                    <span className="list-item-sub">Init Liq: $85K</span>
                  </div>
                  <span className="badge-volatility status-bearish">Extreme Vol</span>
                </div>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="dashboard-card">
              <h4 className="card-title">AI AGENT CONSOLE</h4>
              <div className="terminal-window">
                {logs.map((log, i) => (
                  <div key={i} className="terminal-line">
                    <span className="terminal-timestamp">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    {log.log_message}
                  </div>
                ))}
                <div className="terminal-line" style={{ color: "var(--text-secondary)" }}>
                  &gt; Polling Telegram Bot server for user commands...
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
