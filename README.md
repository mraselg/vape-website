# Vape Club Dubai — Dynamic PHP + JSON CMS & Luxury E-Commerce Storefront

A high-performance, dark-luxury e-commerce website and content management system (CMS) tailored for Dubai & UAE heated tobacco (IQOS/TEREA), pod kits, and disposable vapes.

Built with **PHP 8.2+ SSR**, **Vanilla CSS**, **Vanilla ES6 JavaScript**, and flat **JSON atomic data stores** in `/data/` — zero heavy SQL dependencies, zero build steps, instant page speeds, and complete SEO control.

---

## ⚡ Live & Local URLs

| Environment | Access URL | Description |
| :--- | :--- | :--- |
| **This PC (Local)** | [http://localhost:8010/](http://localhost:8010/) | Dedicated local port `8010` |
| **Wi-Fi Mobile Devices** | `http://192.168.0.100:8010/` | Preview on mobile/tablet on same network |
| **Admin Control Panel** | [http://localhost:8010/admin/](http://localhost:8010/admin/) | Full CMS, SEO center, orders & catalog |
| **Live VPS Deployment** | [http://104.207.64.113:8010/](http://104.207.64.113:8010/) | Production server running `router.php` |
| **Custom Domain** | `https://iqosai.com/` | Configured via canonical SEO settings |

---

## 🔐 Admin Panel & Default Credentials

Navigate to `/admin/` in your browser:

- **Username**: `admin`
- **Default Password**: `admin123`
- *(Important: Change your credentials immediately in the **Account & Backup** section upon first login!)*

### Admin Capabilities:
1. **📊 Dashboard**: Catalog overview, stock health, real-time pending order counters, revenue analytics, and SEO health audit.
2. **📦 Products Manager**: Full CRUD with search/filter, multi-tier pricing (AED), stock levels (`in`, `low`, `out`), VIP bestseller flags, specifications table editor, flavor meter sliders (0–5), variants & bundles configurator, product-specific FAQs, and custom SEO overrides.
3. **🗂️ Categories Manager**: Edit category names, descriptions, hero background images, and custom navigation/tab labels dictionary.
4. **🏠 Homepage CMS**: Real-time management of top announcement tickers, currency chips, flash deal banner, 3-slide hero carousel, VIP storefront section, customer reviews, ordering FAQs, and UAE 18+ age verification gate.
5. **🔍 SEO Center**: Canonical site URL switcher, schema toggles (LocalBusiness, FAQPage, Product, Breadcrumb), dynamic meta title/description templates with tokens (`{product}`, `{brand}`, `{price}`, `{category}`), custom `<head>` injection (GTM / Pixel), and automatic `robots.txt` / `sitemap.xml` synchronization.
6. **🧾 Orders & Dispatch**: Real-time customer orders table with 30-second polling, status lifecycle management (`new` → `confirmed` → `delivered` → `cancelled`), customer phone links, itemized breakdowns, and deletion.
7. **⚙️ Store Settings**: Brand identity, WhatsApp hotline (`971562848450`), Dragon Mart address, delivery fee (20 AED), free delivery threshold (**450 AED** across all UAE), business hours, and ESMA compliance warnings.
8. **🔐 Account & Backup**: Credential rotation, 1-click JSON backup export, and full catalog restore.

---

## 🚀 Running the Local Server

Per project rules, run on dedicated port `8010` binding to all network interfaces (`0.0.0.0`):

```bash
php -S 0.0.0.0:8010 router.php
```

Or under Apache in XAMPP:
- Document root: `c:\xampp\htdocs\Vape Website`
- URL: `http://localhost/Vape%20Website/`

---

## 📁 Architecture & File Layout

```text
/
├── admin/                    # Admin Panel
│   ├── api.php               # Secure JSON backend API (session auth, CSRF, CRUD)
│   ├── index.php             # SPA shell & authentication gate
│   └── assets/
│       ├── admin.css         # Dark luxury design system tokens & styles
│       └── admin.js          # Pure vanilla ES6 SPA router, widgets & state
├── api/
│   └── order.php             # Public checkout submission endpoint
├── assets/
│   ├── css/style.css         # Storefront design system
│   ├── images/               # Product photos, hero graphics & banners
│   └── js/main.js            # Storefront interactivity, cart drawer & modals
├── data/                     # Flat JSON Atomic Data Stores
│   ├── admin.json            # Hashed admin credentials
│   ├── categories.json       # 10 categories & 12 filter labels
│   ├── home.json             # Carousel slides, VIP sections, FAQs, reviews
│   ├── orders.json           # Live customer orders store
│   ├── products.json         # 17 authentic products with full specs & variants
│   ├── seo.json              # Canonical URL, meta templates & schema flags
│   └── settings.json         # Store identity, WhatsApp numbers, 450 AED free ship
├── includes/                 # Reusable PHP partials (header, footer, modals, etc.)
├── lib/                      # Core helpers (bootstrap.php, head.php, render.php)
├── scratch/                  # Scripts, tools, and archived legacy static files
│   ├── backup-static/        # Archived index.html, category.html, product.html
│   └── deploy_to_vps.py      # Automated VPS deployment script (requires confirmation)
├── category.php              # Dynamic Category listing page
├── index.php                 # Dynamic Storefront Homepage
├── product.php               # Dynamic Product Detail Page (PDP)
├── router.php                # Built-in PHP server router (security & URL rewrite)
└── sitemap.php               # Dynamic XML sitemap generator
```

---

## 🛡️ Security & Integrity

- **Session Security**: Cookies set with `HttpOnly`, `SameSite=Lax`, and 12-hour sliding expiry.
- **CSRF Protection**: All mutating API actions require matching `X-CSRF` headers.
- **Access Control**: Internal directories (`/data/`, `/lib/`, `/includes/`, `/scratch/`) are strictly blocked from public access in `router.php`.
- **Atomic File Writes**: All data modifications in `lib/bootstrap.php` utilize `file_put_contents(..., LOCK_EX)` with temporary file writes and atomic renames to prevent partial write corruption.
