# -*- coding: utf-8 -*-
"""
Explore cPanel Lite File Manager, database, and terminal tools.
"""
import urllib.request
import urllib.parse
import http.cookiejar
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx)
)

BASE_URL = "https://iqosae-app-ani2-dev.apps.rm3.7wse.p1.openshiftapps.com/cp"

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with opener.open(req) as resp:
        return resp.status, resp.url, resp.read().decode("utf-8", errors="replace")

def post(path, data):
    url = f"{BASE_URL}{path}"
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded, headers={
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded"
    })
    with opener.open(req) as resp:
        return resp.status, resp.url, resp.read().decode("utf-8", errors="replace")

# Login
status, final_url, html = get("/login.php")
csrf_token = re.search(r'name="csrf_token"\s+value="([^"]+)"', html).group(1)
post("/login.php", {
    "csrf_token": csrf_token,
    "username": "karim0",
    "password": "01234567800"
})

print("--- Step 3: Inspect files.php ---")
status, url, f_html = get("/files.php")
print(f"files.php status: {status}, length: {len(f_html)}")

# Find forms and actions in files.php
forms = re.findall(r'<form[^>]*action="([^"]*)"[^>]*method="([^"]*)"[^>]*>(.*?)</form>', f_html, re.DOTALL | re.IGNORECASE)
print(f"Found {len(forms)} forms in files.php:")
for act, meth, content in forms:
    inputs = re.findall(r'<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"', content, re.IGNORECASE)
    types = re.findall(r'type="([^"]*)"', content, re.IGNORECASE)
    print(f"  Form action='{act}' method='{meth}', inputs={inputs[:5]}, types={types[:5]}")

# Find any action buttons (upload, extract, new, etc.)
buttons = re.findall(r'<button[^>]*>(.*?)</button>', f_html, re.DOTALL | re.IGNORECASE)
print(f"\nFound {len(buttons)} buttons in files.php:")
for b in buttons[:10]:
    print("  Button:", re.sub(r'<[^>]+>', '', b).strip())

# Check for table of files or current directory
curr_dir = re.search(r'(Current Directory|Path|dir)[:\s]*<[^>]*>([^<]+)', f_html, re.IGNORECASE)
if curr_dir:
    print("Current dir:", curr_dir.group(2))
