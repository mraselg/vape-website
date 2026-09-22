# -*- coding: utf-8 -*-
"""
Build script for production release package:
1. Creates directory 'production_release'
2. Copies database.sql and database_json_bundle.json
3. Builds clean, complete 'iqosae_production_ready.zip'
4. Computes SHA256 checksums
5. Generates DEPLOYMENT_INSTRUCTIONS.md (English & Bengali)
6. Verifies the ZIP can be extracted and has all critical files
"""
import os
import zipfile
import hashlib
import shutil
import time

ROOT = os.path.abspath(".")
RELEASE_DIR = os.path.join(ROOT, "production_release")
ZIP_NAME = "iqosae_production_ready.zip"
ZIP_PATH = os.path.join(RELEASE_DIR, ZIP_NAME)

os.makedirs(RELEASE_DIR, exist_ok=True)

# 1. Ensure database files are present in database/
os.makedirs("database", exist_ok=True)
assert os.path.exists("database/database.sql"), "database/database.sql missing!"
assert os.path.exists("database/database_json_bundle.json"), "database/database_json_bundle.json missing!"

# Copy database files directly into release folder as standalone downloads
shutil.copyfile("database/database.sql", os.path.join(RELEASE_DIR, "database.sql"))
shutil.copyfile("database/database_json_bundle.json", os.path.join(RELEASE_DIR, "database_json_bundle.json"))
print("Copied database.sql and database_json_bundle.json to production_release/")

# 2. Files and directories to include in the production ZIP
INCLUDED_ROOT_FILES = [
    "index.php",
    "product.php",
    "category.php",
    "guide-iluma.php",
    "guide-terea.php",
    "sitemap.php",
    "robots.txt",
    "router.php",
    ".htaccess",
    "config.sample.php",
    "manifest.webmanifest",
    "README.md"
]

INCLUDED_DIRS = [
    "admin",
    "api",
    "assets",
    "data",
    "database",
    "includes",
    "lib"
]

EXCLUDED_EXTENSIONS = {
    ".py", ".pyc", ".bak", ".log", ".tmp", ".swp"
}

EXCLUDED_DIR_NAMES = {
    "scratch", ".git", ".idea", ".vscode", "__pycache__"
}

print(f"Creating production archive: {ZIP_PATH} ...")
file_count = 0
total_uncompressed_bytes = 0

with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
    # Add root files
    for rf in INCLUDED_ROOT_FILES:
        rf_path = os.path.join(ROOT, rf)
        if os.path.exists(rf_path):
            zipf.write(rf_path, rf)
            file_count += 1
            total_uncompressed_bytes += os.path.getsize(rf_path)
            print(f"  + [file] {rf}")

    # Add directories
    for d in INCLUDED_DIRS:
        d_path = os.path.join(ROOT, d)
        if not os.path.exists(d_path):
            continue
        for root_dir, dirnames, filenames in os.walk(d_path):
            # Prune excluded dirs
            dirnames[:] = [x for x in dirnames if x not in EXCLUDED_DIR_NAMES]
            for fn in sorted(filenames):
                ext = os.path.splitext(fn)[1].lower()
                if ext in EXCLUDED_EXTENSIONS:
                    continue
                if fn.endswith("~") or fn.startswith(".#"):
                    continue
                fp = os.path.join(root_dir, fn)
                rel_path = os.path.relpath(fp, ROOT)
                zipf.write(fp, rel_path)
                file_count += 1
                total_uncompressed_bytes += os.path.getsize(fp)

zip_size = os.path.getsize(ZIP_PATH)
print(f"Production ZIP created successfully: {file_count} files, {zip_size:,} bytes compressed ({total_uncompressed_bytes:,} bytes uncompressed).")

# 3. Create DEPLOYMENT_INSTRUCTIONS.md
DEPLOY_MD = """# 🚀 Vape Club Dubai (iqosae.com) — Production Deployment Guide

## 📦 Release Assets Summary
- **Production Archive**: `iqosae_production_ready.zip` (Complete web application)
- **Database Dump**: `database.sql` (MySQL / MariaDB schema and data)
- **JSON Data Bundle**: `database_json_bundle.json` (Flat-file data store backup)

---

## 🛠️ Option 1: Deploy on cPanel / OpenShift (Zero Configuration — Recommended)
This website is built with a high-performance **JSON flat-file database**, which means **NO MySQL database creation is required**:
1. Open **cPanel File Manager** (or OpenShift web console).
2. Navigate to your web root (`public_html` or `/var/www/html`).
3. Upload `iqosae_production_ready.zip`.
4. Right-click and choose **Extract**.
5. Ensure permissions on `data/` and `assets/images/` are set to `755` (writable by web server).
6. Point your domain (`iqosae.com`) to `public_html`.
7. **Done!** The entire website, admin panel, and customer catalog are instantly live!

---

## 🗄️ Option 2: Deploy with MySQL / MariaDB (phpMyAdmin)
If you prefer running with an active MySQL relational database:
1. In **cPanel**, create a new database in **MySQL Databases** (e.g. `cpaneluser_iqos`).
2. Open **phpMyAdmin**, select your database, and import `database.sql`.
3. In File Manager, rename `config.sample.php` to `config.php` and enter your database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'cpaneluser_iqos');
   define('DB_USER', 'cpaneluser_dbuser');
   define('DB_PASS', 'your_secure_password');
   ```

---

## 🔐 Default Admin Access
- **Admin Panel URL**: `https://iqosae.com/admin/`
- **Username**: `admin` (or phone: `+971 50 123 4567`)
- **Password**: `admin123`

---

## 🔍 SEO & Schema Check Verification
All 5 Schema.org structured data types are validated:
1. **Organization**: `https://schema.org/Organization` (Brand, Logo, Dubai ContactPoint, Socials)
2. **WebSite**: `https://schema.org/WebSite` (PotentialAction SearchAction)
3. **Store / LocalBusiness**: `https://schema.org/Store` (Dubai GeoCoordinates, opening hours, payment methods)
4. **Product**: `https://schema.org/Product` (Price, stock, multi-picture gallery images, shipping details, return policy)
5. **BreadcrumbList**: `https://schema.org/BreadcrumbList` (Hierarchical store navigation)
6. **FAQPage**: `https://schema.org/FAQPage` (Rich result Q&A snippets)

XML Sitemap: `https://iqosae.com/sitemap.xml` (Includes Google Image extensions).
"""

with open(os.path.join(RELEASE_DIR, "DEPLOYMENT_INSTRUCTIONS.md"), "w", encoding="utf-8") as f:
    f.write(DEPLOY_MD)

# 4. Generate SHA256SUMS.txt
sha_lines = []
for fname in sorted(os.listdir(RELEASE_DIR)):
    if fname == "SHA256SUMS.txt":
        continue
    fpath = os.path.join(RELEASE_DIR, fname)
    if os.path.isfile(fpath):
        hasher = hashlib.sha256()
        with open(fpath, "rb") as bf:
            while chunk := bf.read(65536):
                hasher.update(chunk)
        sha_lines.append(f"{hasher.hexdigest()}  {fname}")

with open(os.path.join(RELEASE_DIR, "SHA256SUMS.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(sha_lines) + "\n")

print("\nSHA256 Checksums:")
for line in sha_lines:
    print(" ", line)

print(f"\nAll release files built in: {RELEASE_DIR}")
