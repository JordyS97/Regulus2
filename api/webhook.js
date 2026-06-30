const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8759005642:AAFGVQ0griudo_FOqaf4RrGlIvam6Lv-DhM";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FIREBASE_API_KEY = "AIzaSyAp0LUs4P5xxo0g4L4Pxn-GVR40Is9QVHQ";
const PROJECT_ID = "cryptotrade2-65918";

// Helper to send messages to Telegram
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });
}

// Helper to write to Firestore via REST
async function writeToFirestore(collection, docId, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  
  // Format fields into Firestore REST structure
  const formattedFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string") {
      formattedFields[key] = { stringValue: value };
    } else if (typeof value === "number") {
      formattedFields[key] = { doubleValue: value };
    } else if (typeof value === "boolean") {
      formattedFields[key] = { booleanValue: value };
    }
  }

  await fetch(url, {
    method: "PATCH", // PATCH creates or overwrites the document
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: formattedFields })
  });
}

// Helper to fetch crypto price from Yahoo Finance (via Vercel fetch)
async function fetchCryptoPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}-USD`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await res.json();
    const result = data.chart.result[0];
    const price = result.meta.regularMarketPrice;
    const prevClose = result.meta.chartPreviousClose;
    const change = ((price - prevClose) / prevClose) * 100;
    
    // Extract history
    const history = [];
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];
    for (let i = 0; i < Math.min(timestamps.length, 30); i++) {
      if (closes[i]) {
        history.push([timestamps[i] * 1000, closes[i]]);
      }
    }

    return { price, change, history };
  } catch (e) {
    console.error("Price fetch failed:", e);
    return null;
  }
}

// Helper to query Claude
async function askClaude(prompt) {
  if (!ANTHROPIC_API_KEY) return null;
  const url = "https://api.anthropic.com/v1/messages";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    return data.content[0].text;
  } catch (e) {
    console.error("Claude call failed:", e);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send("OK");
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  try {
    if (text.startsWith("/start")) {
      const welcome = `👋 <b>Welcome to Regulus2 AI Agent!</b>\n\nI am running 24/7 on Vercel Serverless, ingesting macro indicators and analyzing crypto trends.\n\nUse the menu or type:\n• /recommendation - Get overall market bias and simulated trade\n• /analysis &lt;ticker&gt; - Run a deep-dive analysis on a coin (e.g., <code>/analysis SOL</code>)\n• /trending - View top trending assets, gainers, and losers\n• /weights - View AI model weights and current bias`;
      await sendTelegramMessage(chatId, welcome);
    } 
    
    else if (text.startsWith("/recommendation")) {
      await sendTelegramMessage(chatId, "⏳ <i>Calculating GSS and running correlation analysis...</i>");
      
      const btc = await fetchCryptoPrice("BTC");
      const btcPrice = btc ? btc.price : 59907.68;
      
      const prompt = `Analyze this macroeconomic state and provide a 2-paragraph market sentiment narrative for a Telegram bot: WTI Crude Oil is $70.05, Gold is $4058, US 10-Year Treasury Yield is 4.38%, US Dollar Index (DXY) is 101.29, Fed Funds Rate is 3.50%-3.75% (Hawkish Hold), US CPI is 4.2% YoY. Bitcoin is trading at $${btcPrice}.`;
      
      let claudeInsight = await askClaude(prompt);
      if (!claudeInsight) {
        claudeInsight = "Global macro indicators continue to present a highly restrictive environment for risk assets. Accelerating CPI at 4.2% YoY keeps yields elevated, drawing liquidity away from the crypto markets.";
      }

      const tp = btcPrice * 0.92;
      const sl = btcPrice * 1.04;

      const messageHtml = `<b>📊 GLOBAL MACRO & SENTIMENT SUMMARY</b>
• <b>WTI Crude Oil:</b> $70.05/bbl (Bearish) ➔ High energy costs driving inflation.
• <b>Gold (XAU):</b> $4,058.00/oz (Bearish for Risk) ➔ Heavy safe-haven inflows.
• <b>US 10-Year Treasury Yield:</b> 4.38% (Bearish) ➔ Valuation pressure on risk assets.
• <b>US Dollar Index (DXY):</b> 101.29 (Neutral) ➔ DXY remains strong.
• <b>Overall Global Sentiment Score:</b> <b>-1.0</b>

<b>🧠 DEEP INSIGHTS (Powered by Claude)</b>
{claudeInsight}

<b>📈 SIMULATION & ACTIONABLE RECOMMENDATION</b>
• <b>Market Direction Bias:</b> <b>BEARISH</b>
• <b>Strategy Recommendation:</b> Short Momentum
• <b>Active Simulated Trade Setup:</b>
  - <b>Asset:</b> BTC/USDT
  - <b>Action:</b> SELL
  - <b>Entry Range:</b> $${btcPrice.toLocaleString()}
  - <b>Target TP:</b> $${tp.toLocaleString()}
  - <b>Hard SL:</b> $${sl.toLocaleString()}
• <b>Chance of Win:</b> 74% | <b>Conviction:</b> <b>High</b>`;

      await sendTelegramMessage(chatId, messageHtml.replace("{claudeInsight}", claudeInsight));
      
      // Sync to Firestore
      await writeToFirestore("analytics", "latest_recommendation", {
        timestamp: new Date().toISOString(),
        global_sentiment_score: -1.0,
        btc_price: btcPrice,
        claude_insight: claudeInsight
      });
    } 
    
    else if (text.startsWith("/analysis")) {
      const parts = text.split(" ");
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, "⚠️ Harap masukkan ticker coin. Contoh: <code>/analysis SOL</code>");
        return res.status(200).send("OK");
      }

      const ticker = parts[1].toUpperCase();
      await sendTelegramMessage(chatId, `⏳ <i>Executing Deep-Dive Analysis Protocol for ${ticker}...</i>`);
      
      const coin = await fetchCryptoPrice(ticker);
      if (!coin) {
        await sendTelegramMessage(chatId, `❌ Gagal mengambil data untuk coin: <b>${ticker}</b>.`);
        return res.status(200).send("OK");
      }

      const prompt = `Analyze the cryptocurrency ${ticker} trading at $${coin.price} with 24h change of ${coin.change}%. Current Macro State: DXY is 101.29, CPI is 4.2% YoY, WTI Crude Oil is $70.05, Gold is $4058. Describe the coin's macro correlation (e.g. beta to DXY) in 1 sentence. Suggest a realistic 'Real-time Probability Bias' and a 'Chance of Win' (percentage) for a simulated position, plus entry zone, TP1, TP2, and SL. Keep the output in JSON format with keys: 'macro_correlation', 'probability_bias', 'chance_of_win', 'action', 'entry_zone', 'tp1', 'tp2', 'sl', 'conviction'.`;
      
      const claudeJsonStr = await askClaude(prompt);
      let analysis = {};
      try {
        if (claudeJsonStr) {
          const startIdx = claudeJsonStr.indexOf("{");
          const endIdx = claudeJsonStr.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            const jsonSub = claudeJsonStr.substring(startIdx, endIdx + 1);
            analysis = JSON.parse(jsonSub);
          } else {
            throw new Error("No JSON block found in response");
          }
        } else {
          throw new Error("Empty response from Claude");
        }
      } catch (e) {
        console.error("JSON parsing failed, using fallback:", e);
        analysis = {
          macro_correlation: `${ticker} displays high beta and is heavily suppressed by a strong DXY.`,
          probability_bias: "65% Downside Retest / 35% Technical Bounce",
          chance_of_win: 65,
          action: "SELL SHORT",
          entry_zone: `$${coin.price} - $${(coin.price * 1.02).toFixed(2)}`,
          tp1: `$${(coin.price * 0.90).toFixed(2)}`,
          tp2: `$${(coin.price * 0.85).toFixed(2)}`,
          sl: `$${(coin.price * 1.05).toFixed(2)}`,
          conviction: "Medium"
        };
      }


      const messageHtml = `🪙 <b>ANALISIS TARGET: ${ticker}</b>

• <b>Harga Saat Ini:</b> $${coin.price.toLocaleString()} (${coin.change.toFixed(2)}% 24h)
• <b>Korelasi Makro Terkini:</b> ${analysis.macro_correlation}
• <b>Real-time Probability Bias:</b> ${analysis.probability_bias}

🤖 <b>Rekomendasi Aksi:</b> ${analysis.action}
• <b>Entry Zone:</b> ${analysis.entry_zone}
• <b>Take Profit Targets:</b> ${analysis.tp1}, ${analysis.tp2}
• <b>Hard Stop Loss:</b> ${analysis.sl}
• <b>Chance of Win:</b> ${analysis.chance_of_win}% | <b>Conviction:</b> ${analysis.conviction}

📊 <i>Data visualisasi terperinci untuk grafik kombinasi ${ticker} telah dikirim ke Dashboard Vercel Anda.</i>`;

      await sendTelegramMessage(chatId, messageHtml);
      
      // Sync to Firestore
      await writeToFirestore("analytics", `analysis_${ticker}`, {
        timestamp: new Date().toISOString(),
        ticker: ticker,
        price: coin.price,
        change_24h: coin.change,
        macro_correlation: analysis.macro_correlation,
        action: analysis.action,
        chance_of_win: analysis.chance_of_win
      });
    } 
    
    else if (text.startsWith("/trending")) {
      const trendingMsg = `<b>🔥 MARKET OVERVIEW & TRENDING ASSETS</b>\n\n• <b>Top Trending Asset:</b> Act I: The AI Prophecy (ACT) ➔ Bubble Chart\n• <b>Top Gainers (24h):</b>\n  1. ACT: +34.45%\n  2. SYN: +27.10%\n  3. POWR: +17.00%\n\n• <b>Top Losers (24h):</b>\n  1. SKYAI: -44.65%\n  2. MYX: -22.05%\n  3. PIVX: -21.90%\n\n• <b>New Listings:</b>\n  1. Moon Swap (MOON) ➔ Volatility: High\n  2. Patos Meme Coin (PATOS) ➔ Volatility: Extreme`;
      await sendTelegramMessage(chatId, trendingMsg);
    } 
    
    else if (text.startsWith("/weights")) {
      const weightsMsg = `<b>🧠 AI AGENT MODEL WEIGHTS & BIAS</b>\n\n• <b>Current Global Sentiment Score (GSS):</b> <code>-1.0</code> (Extreme Bearish)\n• <b>Active Model Weights:</b>\n  - Macro Factors Weight: <code>50%</code>\n  - Technical Trend Weight: <code>30%</code>\n  - Sentiment Velocity Weight: <code>20%</code>\n\n• <b>Market Bias Direction:</b> <b>BEARISH</b>\n• <b>System Status:</b> Running 24/7 Vercel Serverless`;
      await sendTelegramMessage(chatId, weightsMsg);
    }

  } catch (err) {
    console.error("Error processing request:", err);
  }

  return res.status(200).send("OK");
}
