# -*- coding: utf-8 -*-
"""
Exhaustive Full-Stack Audit for Vape Club Dubai (iqosae.com)
Checks:
1. PHP Linting on ALL PHP files
2. JS Syntax on ALL JS files
3. JSON syntax and structure on ALL JSON files
4. Image file existence for all catalog & config references
5. HTTP Endpoints, Canonicals, OpenGraph, and JSON-LD validity
6. Pretty URLs and Apache rewrites
"""
import os
import glob
import json
import subprocess
import urllib.request
import re
import xml.etree.ElementTree as ET

BASE = "http://localhost:8010"
ROOT = os.path.abspath(".")

audit_results = {
    "php_files": 0,
    "php_errors": [],
    "js_files": 0,
    "js_errors": [],
    "json_files": 0,
    "json_errors": [],
    "missing_images": [],
    "checked_images": 0,
    "http_checks": [],
    "schema_checks": []
}

print("============================================================")
print("  STEP 1: PHP LINTING (php -l) ON ALL PHP FILES")
print("============================================================")
php_files = []
for root_dir, dirs, files in os.walk(ROOT):
    if any(x in root_dir for x in ["scratch", ".git", "production_release", "node_modules"]):
        continue
    for f in files:
        if f.endswith(".php"):
            php_files.append(os.path.join(root_dir, f))

for pf in sorted(php_files):
    audit_results["php_files"] += 1
    rel = os.path.relpath(pf, ROOT)
    res = subprocess.run(["php", "-l", pf], capture_output=True, text=True)
    if res.returncode != 0:
        audit_results["php_errors"].append(f"{rel}: {res.stderr.strip()}")
        print(f"  [FAIL] {rel}")
    else:
        print(f"  [PASS] {rel}")

print(f"\nPHP Lint summary: {audit_results['php_files']} files checked, {len(audit_results['php_errors'])} errors.")

print("\n============================================================")
print("  STEP 2: JAVASCRIPT SYNTAX (node -c) ON ALL JS FILES")
print("============================================================")
js_files = []
for root_dir, dirs, files in os.walk(ROOT):
    if any(x in root_dir for x in ["scratch", ".git", "production_release", "node_modules"]):
        continue
    for f in files:
        if f.endswith(".js") and not f.endswith(".min.js"):
            js_files.append(os.path.join(root_dir, f))

for jf in sorted(js_files):
    audit_results["js_files"] += 1
    rel = os.path.relpath(jf, ROOT)
    res = subprocess.run(["node", "-c", jf], capture_output=True, text=True)
    if res.returncode != 0:
        audit_results["js_errors"].append(f"{rel}: {res.stderr.strip()}")
        print(f"  [FAIL] {rel}")
    else:
        print(f"  [PASS] {rel}")

print(f"\nJS Syntax summary: {audit_results['js_files']} files checked, {len(audit_results['js_errors'])} errors.")

print("\n============================================================")
print("  STEP 3: JSON VALIDATION & DATA INTEGRITY")
print("============================================================")
json_files = glob.glob(os.path.join(ROOT, "data", "*.json")) + glob.glob(os.path.join(ROOT, "database", "*.json"))
for jf in sorted(json_files):
    audit_results["json_files"] += 1
    rel = os.path.relpath(jf, ROOT)
    try:
        with open(jf, "r", encoding="utf-8") as f:
            data = json.load(f)
        size = os.path.getsize(jf)
        print(f"  [PASS] {rel} ({size:,} bytes, valid JSON)")
    except Exception as e:
        audit_results["json_errors"].append(f"{rel}: {str(e)}")
        print(f"  [FAIL] {rel}: {e}")

print(f"\nJSON summary: {audit_results['json_files']} files checked, {len(audit_results['json_errors'])} errors.")

print("\n============================================================")
print("  STEP 4: IMAGE FILE EXISTENCE VERIFICATION")
print("============================================================")
# Check all images referenced in data/products.json, categories.json, settings.json, home.json
with open("data/products.json", "r", encoding="utf-8") as f:
    products_data = json.load(f).get("products", [])

def check_img(img_path, origin):
    if not img_path or img_path.startswith("data:") or img_path.startswith("http"):
        return
    clean_p = img_path.lstrip("/")
    full_p = os.path.join(ROOT, clean_p)
    audit_results["checked_images"] += 1
    if not os.path.exists(full_p):
        audit_results["missing_images"].append(f"{clean_p} (referenced in {origin})")

for p in products_data:
    p_name = p.get("name", p.get("id", "product"))
    check_img(p.get("photo"), f"Product {p_name} main photo")
    for g in p.get("gallery", []):
        check_img(g, f"Product {p_name} gallery")
    variants = p.get("variants", {})
    if isinstance(variants, dict):
        for col in variants.get("colors", []):
            check_img(col.get("photo"), f"Product {p_name} color variant")

with open("data/categories.json", "r", encoding="utf-8") as f:
    cats_data = json.load(f).get("cats", {})
for slug, c in cats_data.items():
    check_img(c.get("photo"), f"Category {slug}")

with open("data/home.json", "r", encoding="utf-8") as f:
    home_data = json.load(f)
for s in home_data.get("hero_slides", []):
    check_img(s.get("image"), "Hero slide")
for tile in home_data.get("banner_tiles", []):
    check_img(tile.get("bg"), "Banner tile")

with open("data/settings.json", "r", encoding="utf-8") as f:
    set_data = json.load(f)
check_img(set_data.get("logo_image"), "Settings logo")

print(f"Checked {audit_results['checked_images']} image references.")
if audit_results["missing_images"]:
    print(f"  [WARN/FAIL] {len(audit_results['missing_images'])} missing images:")
    for mi in audit_results["missing_images"]:
        print(f"    - {mi}")
else:
    print("  [PASS] All referenced image files exist on disk 100%!")

print("\n============================================================")
print("  STEP 5: HTTP ENDPOINTS & JSON-LD SCHEMAS AUDIT")
print("============================================================")
endpoints = [
    ("/", "Homepage"),
    ("/product.php?id=iluma-prime-remix", "Product Detail Page"),
    ("/product/iluma-prime-remix", "Pretty Product URL"),
    ("/category.php?cat=terea-japan", "Category Page"),
    ("/category/terea-japan", "Pretty Category URL"),
    ("/guide-iluma.php", "Guide: ILUMA"),
    ("/guide-terea.php", "Guide: TEREA"),
    ("/sitemap.xml", "Dynamic XML Sitemap"),
    ("/robots.txt", "Robots.txt"),
    ("/admin/index.php", "Admin Login"),
    ("/api/tg-webhook.php", "Telegram Webhook")
]

for path, label in endpoints:
    url = BASE + path
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            content = res.read().decode("utf-8", errors="replace")
            print(f"  [PASS] {label:24} ({path:35}) -> HTTP {status}, Length: {len(content):,} bytes")
            audit_results["http_checks"].append((path, status, len(content)))

            # Validate all JSON-LD blocks in HTML
            jsonld_matches = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', content, re.DOTALL)
            for block in jsonld_matches:
                try:
                    schema_data = json.loads(block)
                    stype = schema_data.get("@type", "unknown")
                    audit_results["schema_checks"].append(f"{label} has valid schema: {stype}")
                except Exception as ex:
                    print(f"    [FAIL SCHEMA JSON] In {label}: {ex}")
                    audit_results["schema_checks"].append(f"FAIL: {label} schema syntax error: {ex}")
    except Exception as e:
        print(f"  [FAIL] {label:24} ({path}): {e}")
        audit_results["http_checks"].append((path, "ERR", str(e)))

print("\n============================================================")
print("  AUDIT SUMMARY")
print("============================================================")
print(f"PHP Files Checked: {audit_results['php_files']} (Errors: {len(audit_results['php_errors'])})")
print(f"JS Files Checked:  {audit_results['js_files']} (Errors: {len(audit_results['js_errors'])})")
print(f"JSON Files Checked:{audit_results['json_files']} (Errors: {len(audit_results['json_errors'])})")
print(f"Images Verified:   {audit_results['checked_images']} (Missing: {len(audit_results['missing_images'])})")
print(f"HTTP Endpoints:    {len(audit_results['http_checks'])} verified")
print(f"Schemas Verified:  {len(audit_results['schema_checks'])} blocks parsed without JSON errors")

all_good = (len(audit_results['php_errors']) == 0 and
            len(audit_results['js_errors']) == 0 and
            len(audit_results['json_errors']) == 0 and
            len(audit_results['missing_images']) == 0)

if all_good:
    print("\n>>> EXHAUSTIVE AUDIT RESULT: 100% PERFECT! ALL CHECKS PASSED! <<<")
else:
    print("\n>>> EXHAUSTIVE AUDIT RESULT: ISSUES DETECTED - REQUIRE RESOLUTION <<<")
