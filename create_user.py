import requests

# Suppress InsecureRequestWarning from urllib3
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY = "AIzaSyAp0LUs4P5xxo0g4L4Pxn-GVR40Is9QVHQ"
EMAIL = "jordysalim2@gmail.com"
PASSWORD = "Regulus2"

def main():
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
    payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "returnSecureToken": True
    }
    try:
        response = requests.post(url, json=payload, timeout=10, verify=False)
        data = response.json()
        if "error" in data:
            print(f"Error: {data['error']['message']}")
            if data['error']['message'] == "CONFIGURATION_NOT_FOUND":
                print("\n👉 Please go to the Firebase Console, click 'Authentication', then click 'Get Started' and enable the 'Email/Password' provider.")
        else:
            print("🎉 Success! Firebase Auth account successfully created!")
            print(f"Email: {EMAIL}")
            print("You can now use this account to log in on your Vercel frontend.")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
