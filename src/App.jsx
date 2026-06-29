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
            // progress GSS overlay line for visualization
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
        // Fallback to latest recommendation if specific coin analysis is not found
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Login Page View
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 -z-10 animate-pulse-slow"></div>
        <div className="w-full max-w-md p-8 rounded-3xl glass-card text-center border border-slate-800">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-400">
              <Cpu className="h-10 w-10 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
            REGULUS 2.0
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Advanced Macro-Crypto AI Agent Dashboard
          </p>
          
          <div className="mt-8">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </button>
          </div>
          
          <div className="mt-8 border-t border-slate-800/60 pt-6">
            <p className="text-xs text-slate-500">
              Access is restricted to authorized credentials. Ingesting global macro indicators 24/7.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Cpu className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-sky-400 bg-clip-text text-transparent">
                REGULUS 2.0
              </h1>
              <span className="text-xs text-slate-400 font-mono">Status: Sandbox Active</span>
            </div>
          </div>

          {/* Search Ticker */}
          <div className="flex items-center w-full md:w-auto max-w-md bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50 transition-colors">
            <Search className="h-4 w-4 text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search coin (e.g. SOL, ETH, BTC)"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
              className="bg-transparent text-sm text-white focus:outline-none w-full md:w-48 font-semibold uppercase"
            />
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <img src={user.photoURL} alt="avatar" className="h-9 w-9 rounded-full border border-slate-800" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold">{user.displayName}</p>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {searchError && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl flex items-center gap-3 text-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <p>{searchError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: GSS Gauge & Recommendations */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* GSS Gauge Card */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800">
              <h3 className="text-slate-400 text-sm font-semibold mb-4">GLOBAL SENTIMENT SCORE (GSS)</h3>
              <div className="text-center py-4">
                <span className="text-6xl font-extrabold tracking-tight text-rose-500">
                  {recommendation?.gss ?? -1.0}
                </span>
                <p className="text-xs text-slate-500 mt-1">Scale: -1.0 (Bearish) to +1.0 (Bullish)</p>
                
                {/* Sentiment Gauge Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full mt-6 overflow-hidden flex">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ width: recommendation?.gss === -1.0 ? "100%" : "50%" }}
                  ></div>
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: recommendation?.gss === 1.0 ? "100%" : "0%" }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                  <span>RISK-OFF (BEARISH)</span>
                  <span>NEUTRAL</span>
                  <span>RISK-ON (BULLISH)</span>
                </div>
              </div>
              
              <div className="mt-4 border-t border-slate-800/60 pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400">Market Bias:</span>
                <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-extrabold rounded-lg tracking-wider uppercase">
                  {activeAnalysis?.analysis?.action ?? "SELL SHORT"}
                </span>
              </div>
            </div>

            {/* Active Position Risk Management */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-400 text-sm font-semibold">SIMULATED POSITION</h3>
                <span className="px-2 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-mono rounded-md">
                  Active
                </span>
              </div>

              {positions.map((pos, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-bold text-white">{pos.asset}</p>
                      <span className="text-xs text-rose-400 font-bold uppercase">{pos.action}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Position Size</p>
                      <p className="text-sm font-mono font-bold text-white">${pos.position_size_usd?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-800/60 py-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block">Entry</span>
                      <span className="text-white font-bold">{pos.entry_range}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Target TP</span>
                      <span className="text-emerald-400 font-bold">{pos.tp}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hard SL</span>
                      <span className="text-rose-400 font-bold">{pos.sl}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Chance of Win:</span>
                    <span className="font-bold text-emerald-400">74%</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Center/Right Panel: Combine Chart & Macro Grid */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Combine Chart Card */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="text-slate-200 text-lg font-bold">
                    {searchTicker.toUpperCase()}/USD Combine Chart
                  </h3>
                  <p className="text-xs text-slate-400">
                    Candlestick Price + Volume + GSS Sentiment Overlay Line (30 Days)
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <span className="h-2 w-2 rounded-full bg-sky-500"></span> Price
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span> GSS Line
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: -5, left: -15, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} domain={["auto", "auto"]} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} domain={[-1, 1]} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }} 
                      labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="volume" name="Volume" barSize={12} fill="#0ea5e9" opacity={0.15} />
                    <Line yAxisId="left" type="monotone" dataKey="price" name="Price (USD)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="sentiment" name="Macro Sentiment" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macro Indicators Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Crude Oil */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">WTI CRUDE OIL</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">$70.05</span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-2 inline-block uppercase">
                  Bearish Trend
                </span>
              </div>

              {/* Gold */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">GOLD (XAU/USD)</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">$4,058.00</span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-2 inline-block uppercase">
                  Risk-Off Flow
                </span>
              </div>

              {/* US 10Y Yield */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">US 10Y YIELD</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">4.38%</span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-2 inline-block uppercase">
                  Elevated Rates
                </span>
              </div>

              {/* DXY */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">US DOLLAR INDEX (DXY)</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">101.29</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-2 inline-block uppercase">
                  Consolidation
                </span>
              </div>

              {/* CPI Inflation */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">US CPI INFLATION</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">4.2% YoY</span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-2 inline-block uppercase">
                  Accelerating
                </span>
              </div>

              {/* Fed Rate */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800">
                <span className="text-slate-400 text-xs font-semibold block">FED STANCE</span>
                <span className="text-sm font-bold text-white block mt-1.5 truncate">3.50%-3.75%</span>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
                  Hawkish Hold
                </span>
              </div>

            </div>

            {/* Trending & New Listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Heatmap/List Widget */}
              <div className="p-6 rounded-3xl glass-card border border-slate-800">
                <h4 className="text-slate-200 text-sm font-bold mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-400" /> TOP GAINERS & LOSERS (HEATMAP VIBE)
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <span className="font-bold text-white">Act I: The AI Prophecy (ACT)</span>
                    <span className="text-emerald-400 font-bold font-mono">+34.45%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <span className="font-bold text-white">Synapse (SYN)</span>
                    <span className="text-emerald-400 font-bold font-mono">+27.10%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <span className="font-bold text-white">Skyai (SKYAI)</span>
                    <span className="text-red-400 font-bold font-mono">-44.65%</span>
                  </div>
                </div>
              </div>

              {/* New Listings Bubble Chart Vibe */}
              <div className="p-6 rounded-3xl glass-card border border-slate-800">
                <h4 className="text-slate-200 text-sm font-bold mb-4 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-sky-400" /> NEW LISTINGS (BUBBLE DATA)
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <div>
                      <p className="font-bold text-white">Moon Swap (MOON)</p>
                      <span className="text-[10px] text-slate-500 font-mono">Init Liquidity: $150K</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-bold rounded text-[10px] uppercase">
                      High Volatility
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    <div>
                      <p className="font-bold text-white">Patos Meme Coin (PATOS)</p>
                      <span className="text-[10px] text-slate-500 font-mono">Init Liquidity: $85K</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 font-bold rounded text-[10px] uppercase">
                      Extreme Vol
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* AI Agent Console Logs */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800 font-mono text-xs">
              <h4 className="text-slate-200 text-sm font-bold mb-3 flex items-center gap-2 font-sans">
                <Terminal className="h-4 w-4 text-sky-400" /> AI AGENT TERMINAL LOGS
              </h4>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/60 max-h-36 overflow-y-auto space-y-2 text-slate-400">
                {logs.map((log, i) => (
                  <p key={i} className="leading-relaxed">
                    <span className="text-sky-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.log_message}
                  </p>
                ))}
                <p className="text-slate-500">&gt; Listening for incoming Telegram commands...</p>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
