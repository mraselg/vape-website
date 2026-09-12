# 🚀 Vape Club Dubai (iqosae.com) — Production Deployment Guide

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
