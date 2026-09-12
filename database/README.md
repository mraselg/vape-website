# Vape Club Dubai — Database Architecture & Import Guide

## Overview
This website supports **dual database architecture**:
1. **JSON Flat-File Store (Default & Recommended)**:
   - Located in `/data/*.json`
   - Zero setup required, zero configuration, works instantly on cPanel, OpenShift, Apache, NGINX, and PHP built-in server.
   - Atomic file locking (`LOCK_EX`) ensures zero data corruption under concurrent traffic.

2. **MySQL / MariaDB Relational Database**:
   - Schema and initial seed data available in `database/database.sql`
   - Can be imported directly using **phpMyAdmin** on cPanel or via command-line.

---

## Tables in `database.sql`
| Table | Description |
| :--- | :--- |
| `vcd_products` | Complete catalog of IQOS devices, TEREA sticks, disposables, pods, prices, variants, gallery images, specs, box contents, and SEO metadata. |
| `vcd_categories` | Category slugs, titles, descriptions, theme art, and hero badges. |
| `vcd_orders` | Customer checkout orders, phone numbers, delivery addresses, and item details. |
| `vcd_leads` | Customer WhatsApp leads, inquiry history, and statuses. |
| `vcd_settings` | Site-wide branding, WhatsApp phone numbers, delivery fees, rating metrics, and store hours. |
| `vcd_admin_users` | Staff credentials, encrypted password hashes, and permission roles (`admin`, `editor`, `author`). |

---

## How to Import into cPanel MySQL
1. In **cPanel**, go to **MySQL Databases** and create a new database (e.g. `cpaneluser_vape`).
2. Create a database user and assign all privileges to the database.
3. Open **phpMyAdmin** from cPanel, select your database, and click the **Import** tab.
4. Choose `database/database.sql` and click **Import**.
5. Copy `config.sample.php` to `config.php` and enter your database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'cpaneluser_vape');
   define('DB_USER', 'cpaneluser_dbuser');
   define('DB_PASS', 'your_password');
   ```
