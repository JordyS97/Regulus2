import requests
import sys

# Suppress InsecureRequestWarning from urllib3
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

TOKEN = "8759005642:AAFGVQ0griudo_FOqaf4RrGlIvam6Lv-DhM"
CHAT_ID = "5463495792"

html_message = """<b>📊 GLOBAL MACRO & SENTIMENT SUMMARY</b>
• <b>WTI Crude Oil:</b> $70.05/bbl (Bearish) ➔ High energy costs driving persistent inflation pressure.
• <b>Gold (XAU):</b> $4,058.00/oz (Bearish for Risk Assets) ➔ Heavy safe-haven inflows indicate institutional risk-off positioning.
• <b>US 10-Year Treasury Yield:</b> 4.38% (Bearish) ➔ Elevated risk-free rates compress equity and crypto valuations.
• <b>US Dollar Index (DXY):</b> 101.29 (Neutral-Bearish) ➔ DXY remains consolidated but strong, capping risk asset upside.
• <b>Monetary Policy:</b> 3.50%-3.75% (Hawkish Hold) ➔ Hawkish hold under new Fed Chair Kevin Warsh; CPI accelerated to 4.2% YoY.
• <b>Overall Global Sentiment Score:</b> <b>-1.0</b>

<b>🧠 TRAINING DATA & CORRELATION INSIGHTS</b>
• Historical pattern matching shows a 74% probability of short-term downside when Gold spikes near $4,000+ simultaneously with a hawkish Fed hold and accelerating CPI (4.2%). BTC 30-day trend is -18.6%, while ETH 30-day trend is -21.4%.

<b>📈 SIMULATION & ACTIONABLE RECOMMENDATION</b>
• <b>Market Direction Bias:</b> <b>BEARISH</b>
• <b>Strategy Recommendation:</b> Short Momentum (Hedging Spot)
• <b>Active Simulated Trade Setup:</b>
  - <b>Asset:</b> BTC/USDT
  - <b>Action:</b> SELL
  - <b>Entry Range:</b> $59,907.68
  - <b>Target TP:</b> $55,115.07
  - <b>Hard SL:</b> $62,303.99
• <b>Conviction Score:</b> <b>High</b> (GSS: -1.0)
"""

def main():
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": html_message,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload, timeout=10, verify=False)
        response.raise_for_status()
        print("Message successfully sent to Telegram!")
    except Exception as e:
        print(f"Error sending message to Telegram: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
