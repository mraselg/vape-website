import urllib.request
import urllib.parse
import http.cookiejar
import json

BASE = "http://localhost:8010"
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# 1. Login to Admin
login_data = json.dumps({"action": "login", "username": "admin", "password": "password"}).encode('utf-8')
req = urllib.request.Request(f"{BASE}/admin/api.php?action=login", data=login_data, headers={'Content-Type': 'application/json'})
try:
    resp = opener.open(req)
    res_json = json.loads(resp.read().decode('utf-8'))
    print("Login result:", res_json)
    csrf = res_json.get('csrf', '')
except Exception as e:
    print("Login error:", e)
    # try password "admin123"
    login_data = json.dumps({"action": "login", "username": "admin", "password": "admin123"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE}/admin/api.php?action=login", data=login_data, headers={'Content-Type': 'application/json'})
    resp = opener.open(req)
    res_json = json.loads(resp.read().decode('utf-8'))
    print("Login with admin123 result:", res_json)
    csrf = res_json.get('csrf', '')

# 2. Test telegram with empty fields
req2 = urllib.request.Request(
    f"{BASE}/admin/api.php?action=test_telegram",
    data=json.dumps({"bot_token": "", "chat_id": ""}).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'X-CSRF': csrf}
)
try:
    opener.open(req2)
except urllib.error.HTTPError as e:
    err_body = json.loads(e.read().decode('utf-8'))
    print("\nEmpty fields test expected validation error:", err_body)

# 3. Test telegram with test token and chat_id
req3 = urllib.request.Request(
    f"{BASE}/admin/api.php?action=test_telegram",
    data=json.dumps({"bot_token": "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ", "chat_id": "123456789"}).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'X-CSRF': csrf}
)
try:
    opener.open(req3)
except urllib.error.HTTPError as e:
    err_body = json.loads(e.read().decode('utf-8'))
    print("\nInvalid token test expected Telegram API rejection:", err_body)
