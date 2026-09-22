# -*- coding: utf-8 -*-
"""
Test unpacking production_release/iqosae_production_ready.zip
into a temporary scratch directory and checking all files.
"""
import os
import zipfile
import shutil
import subprocess

zip_path = "production_release/iqosae_production_ready.zip"
test_dir = "scratch/test_unpack"

if os.path.exists(test_dir):
    shutil.rmtree(test_dir)
os.makedirs(test_dir, exist_ok=True)

print(f"Testing extraction of {zip_path} ...")
with zipfile.ZipFile(zip_path, 'r') as zf:
    zf.extractall(test_dir)

print(f"Extracted successfully into {test_dir}!")

# Verify critical files
critical = [
    "index.php", "product.php", "category.php", "sitemap.php",
    "robots.txt", ".htaccess", "router.php",
    "lib/bootstrap.php", "lib/head.php", "lib/render.php",
    "admin/index.php", "admin/api.php", "admin/assets/admin.js", "admin/assets/admin.css",
    "data/products.json", "data/categories.json", "data/settings.json", "data/seo.json",
    "database/database.sql", "database/database_json_bundle.json",
    "assets/css/style.css", "assets/js/catalog.js", "assets/js/product-page.js"
]

all_ok = True
for c in critical:
    fp = os.path.join(test_dir, c)
    if not os.path.exists(fp):
        print(f"[FAIL] Missing critical file: {c}")
        all_ok = False
    else:
        size = os.path.getsize(fp)
        print(f" [OK] {c:35} ({size:,} bytes)")

# Test PHP syntax on extracted PHP files
php_errors = 0
for root, dirs, files in os.walk(test_dir):
    for f in files:
        if f.endswith(".php"):
            full_p = os.path.join(root, f)
            res = subprocess.run(["php", "-l", full_p], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"[PHP LINT ERROR] {full_p}: {res.stderr}")
                php_errors += 1

if php_errors == 0:
    print("All extracted PHP files passed syntax check ('php -l') 100%!")

assert all_ok and php_errors == 0, "ZIP validation failed!"
print("ZIP ARCHIVE VALIDATION COMPLETED 100% SUCCESSFULLY!")
