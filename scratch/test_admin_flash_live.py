import urllib.request, urllib.parse, json, http.cookiejar, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

# 1. Login to admin
login_url = "http://localhost:8010/admin/api.php?action=login"
login_payload = json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8')
req = urllib.request.Request(login_url, data=login_payload, headers={"Content-Type": "application/json"})
res = opener.open(req)
login_data = json.loads(res.read().decode('utf-8'))
print("1. Admin Login OK:", login_data.get('ok'))
csrf = login_data.get('csrf')

# 2. Get current home data
get_url = "http://localhost:8010/admin/api.php?action=get"
req = urllib.request.Request(get_url, headers={"X-CSRF": csrf})
res = opener.open(req)
get_data = json.loads(res.read().decode('utf-8'))
home_data = get_data['data']['home']
print("2. Current Flash Deal in Admin:", home_data.get('flash_deal'))

# 3. Update Flash Deal via Admin API
home_data['flash_deal'] = {
    "enabled": True,
    "badge": "⚡ SPECIAL RAMADAN OFFER",
    "text": "Get 1 Free Box of Swiss TEREA with Any IQOS ILUMA Device · Free Delivery",
    "cta_label": "Claim Now",
    "cta_href": "#shop"
}
save_url = "http://localhost:8010/admin/api.php?action=save"
save_payload = json.dumps({"section": "home", "data": home_data}).encode('utf-8')
req = urllib.request.Request(save_url, data=save_payload, headers={"Content-Type": "application/json", "X-CSRF": csrf})
res = opener.open(req)
save_res = json.loads(res.read().decode('utf-8'))
print("3. Admin API Save Result:", save_res)

# 4. Check Frontend to see if it immediately reflected the change!
req = urllib.request.Request("http://localhost:8010/", headers={"User-Agent": "Mozilla/5.0"})
html = opener.open(req).read().decode('utf-8')
idx = html.find('flash-strip')
print("4. Frontend HTML after update:")
print(html[idx:idx+320])

assert "SPECIAL RAMADAN OFFER" in html
assert "Get 1 Free Box of Swiss TEREA" in html
assert "Claim Now" in html
print("\n>>> SUCCESS! FLASH DEAL IMMEDIATELY SYNCED FROM ADMIN TO FRONTEND! <<<")

# 5. Restore default flash deal
home_data['flash_deal'] = {
    "enabled": True,
    "badge": "FLASH DEAL",
    "text": "Free TEREA pack with every ILUMA device · Today only",
    "cta_label": "Shop now",
    "cta_href": "#shop"
}
save_payload = json.dumps({"section": "home", "data": home_data}).encode('utf-8')
req = urllib.request.Request(save_url, data=save_payload, headers={"Content-Type": "application/json", "X-CSRF": csrf})
opener.open(req)
print("5. Restored original Flash Deal cleanly.")
