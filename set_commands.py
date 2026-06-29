import requests

# Suppress InsecureRequestWarning from urllib3
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

TOKEN = "8759005642:AAFGVQ0griudo_FOqaf4RrGlIvam6Lv-DhM"

commands = [
    {"command": "start", "description": "Start the bot and get welcome message"},
    {"command": "recommendation", "description": "Get latest macro-crypto market recommendation"},
    {"command": "analysis", "description": "Deep-dive analysis on a coin (e.g., /analysis SOL)"},
    {"command": "trending", "description": "Get trending assets, gainers, and new listings"},
    {"command": "weights", "description": "View current AI model weights and GSS bias"}
]

def main():
    url = f"https://api.telegram.org/bot{TOKEN}/setMyCommands"
    payload = {"commands": commands}
    try:
        response = requests.post(url, json=payload, timeout=10, verify=False)
        response.raise_for_status()
        print("Telegram bot commands successfully registered!")
    except Exception as e:
        print(f"Error registering commands: {e}")

if __name__ == "__main__":
    main()
