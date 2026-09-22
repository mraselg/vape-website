# -*- coding: utf-8 -*-
"""
Generate a professional, fully-populated MySQL / MariaDB database dump
from the current JSON store (data/*.json).
"""
import json
import os
import re

def esc_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        s = json.dumps(val, ensure_ascii=False)
    else:
        s = str(val)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"

def main():
    sql = []
    sql.append("-- ============================================================")
    sql.append("-- Vape Club Dubai — Production Database Dump")
    sql.append("-- Target Host: cPanel / MySQL / MariaDB (5.7+ / 8.0+)")
    sql.append("-- Character Set: utf8mb4 / utf8mb4_unicode_ci")
    sql.append("-- ============================================================\n")
    sql.append("SET NAMES utf8mb4;")
    sql.append("SET FOREIGN_KEY_CHECKS = 0;\n")

    # 1. Categories table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_categories")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_categories` (
  `slug` VARCHAR(64) NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `sub` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `theme` VARCHAR(64) DEFAULT 'art-emerald',
  `art` VARCHAR(64) DEFAULT 'pack',
  `photo` VARCHAR(255) DEFAULT '',
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")

    with open('data/categories.json', 'r', encoding='utf-8') as f:
        cat_data = json.load(f)
    cats = cat_data.get('cats', {})
    for slug, c in cats.items():
        sql.append(f"INSERT INTO `vcd_categories` (`slug`, `title`, `sub`, `description`, `theme`, `art`, `photo`) VALUES ("
                   f"{esc_sql(slug)}, {esc_sql(c.get('title'))}, {esc_sql(c.get('sub'))}, {esc_sql(c.get('desc'))}, "
                   f"{esc_sql(c.get('theme'))}, {esc_sql(c.get('art'))}, {esc_sql(c.get('photo'))}) "
                   f"ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`);")
    sql.append("")

    # 2. Products table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_products")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_products` (
  `id` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(64) DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(128) DEFAULT '',
  `cat` VARCHAR(64) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `old_price` DECIMAL(10,2) DEFAULT NULL,
  `stock` ENUM('in', 'low', 'out') NOT NULL DEFAULT 'in',
  `best` TINYINT(1) NOT NULL DEFAULT 0,
  `flavor` VARCHAR(255) DEFAULT '',
  `photo` VARCHAR(255) DEFAULT '',
  `photo_alt` VARCHAR(255) DEFAULT '',
  `gallery` JSON DEFAULT NULL,
  `variants` JSON DEFAULT NULL,
  `specs_table` JSON DEFAULT NULL,
  `box_contents` JSON DEFAULT NULL,
  `description` TEXT,
  `seo_title` VARCHAR(255) DEFAULT '',
  `seo_desc` TEXT,
  `seo_keywords` VARCHAR(255) DEFAULT '',
  `slug` VARCHAR(128) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cat` (`cat`),
  KEY `idx_brand` (`brand`),
  KEY `idx_stock` (`stock`),
  KEY `idx_best` (`best`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")

    with open('data/products.json', 'r', encoding='utf-8') as f:
        prod_data = json.load(f)
    prods = prod_data.get('products', [])
    for p in prods:
        p_id = p.get('id', '')
        sku = p.get('sku', '')
        name = p.get('name', '')
        brand = p.get('brand', '')
        cat = p.get('cat', '')
        price = float(p.get('price', 0))
        old = float(p.get('old')) if p.get('old') else None
        stock = p.get('stock', 'in')
        best = 1 if p.get('best') else 0
        flavor = p.get('flavor', '')
        photo = p.get('photo', '')
        photo_alt = p.get('photo_alt', '')
        gallery = p.get('gallery', [])
        variants = p.get('variants', {})
        specs_table = p.get('specsTable', {})
        box_contents = p.get('boxContents', [])
        desc = p.get('description', p.get('desc', ''))
        seo_title = p.get('seo_title', '')
        seo_desc = p.get('seo_desc', '')
        seo_keywords = p.get('seo_keywords', '')
        slug = p.get('slug', p_id)

        sql.append(
            f"INSERT INTO `vcd_products` (`id`, `sku`, `name`, `brand`, `cat`, `price`, `old_price`, `stock`, `best`, `flavor`, `photo`, `photo_alt`, `gallery`, `variants`, `specs_table`, `box_contents`, `description`, `seo_title`, `seo_desc`, `seo_keywords`, `slug`) VALUES ("
            f"{esc_sql(p_id)}, {esc_sql(sku)}, {esc_sql(name)}, {esc_sql(brand)}, {esc_sql(cat)}, {price}, {esc_sql(old)}, {esc_sql(stock)}, {best}, {esc_sql(flavor)}, {esc_sql(photo)}, {esc_sql(photo_alt)}, "
            f"{esc_sql(gallery)}, {esc_sql(variants)}, {esc_sql(specs_table)}, {esc_sql(box_contents)}, {esc_sql(desc)}, {esc_sql(seo_title)}, {esc_sql(seo_desc)}, {esc_sql(seo_keywords)}, {esc_sql(slug)}) "
            f"ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `price`=VALUES(`price`), `photo`=VALUES(`photo`), `gallery`=VALUES(`gallery`), `variants`=VALUES(`variants`);"
        )
    sql.append("")

    # 3. Settings table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_settings")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` TEXT,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
    with open('data/settings.json', 'r', encoding='utf-8') as f:
        settings_data = json.load(f)
    for k, v in settings_data.items():
        sql.append(f"INSERT INTO `vcd_settings` (`setting_key`, `setting_value`) VALUES ({esc_sql(k)}, {esc_sql(v)}) ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);")
    sql.append("")

    # 4. Admin users table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_admin_users")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_admin_users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `role` ENUM('admin', 'editor', 'author') NOT NULL DEFAULT 'admin',
  `phone` VARCHAR(32) DEFAULT '',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
    with open('data/admin.json', 'r', encoding='utf-8') as f:
        admin_data = json.load(f)
    # Root admin
    sql.append(f"INSERT INTO `vcd_admin_users` (`id`, `username`, `password_hash`, `name`, `role`, `phone`, `status`) VALUES ("
               f"'usr_admin', {esc_sql(admin_data.get('username', 'admin'))}, {esc_sql(admin_data.get('password_hash'))}, "
               f"'Super Admin', 'admin', '+971 50 123 4567', 'active') ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`);")
    for u in admin_data.get('users', []):
        sql.append(f"INSERT INTO `vcd_admin_users` (`id`, `username`, `password_hash`, `name`, `role`, `phone`, `status`) VALUES ("
                   f"{esc_sql(u.get('id'))}, {esc_sql(u.get('username'))}, {esc_sql(u.get('password_hash'))}, "
                   f"{esc_sql(u.get('name'))}, {esc_sql(u.get('role'))}, {esc_sql(u.get('phone'))}, {esc_sql(u.get('status'))}) "
                   f"ON DUPLICATE KEY UPDATE `password_hash`=VALUES(`password_hash`), `role`=VALUES(`role`);")
    sql.append("")

    # 5. Orders table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_orders")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_orders` (
  `id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `emirate` VARCHAR(64) DEFAULT 'Dubai',
  `address` TEXT,
  `payment_method` VARCHAR(64) DEFAULT 'cod',
  `notes` TEXT,
  `items` JSON NOT NULL,
  `total_aed` DECIMAL(10,2) NOT NULL,
  `status` ENUM('new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")

    # 6. WhatsApp Leads table
    sql.append("-- ------------------------------------------------------------")
    sql.append("-- Table: vcd_leads")
    sql.append("-- ------------------------------------------------------------")
    sql.append("""CREATE TABLE IF NOT EXISTS `vcd_leads` (
  `id` VARCHAR(64) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) DEFAULT '',
  `source` VARCHAR(64) DEFAULT 'whatsapp_modal',
  `initial_product` VARCHAR(128) DEFAULT '',
  `chat_history` JSON DEFAULT NULL,
  `status` ENUM('open', 'contacted', 'converted', 'closed') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
    sql.append("\nSET FOREIGN_KEY_CHECKS = 1;\n-- Dump complete.")

    output_sql = "\n".join(sql)
    return output_sql

if __name__ == '__main__':
    sql_text = main()
    os.makedirs('database', exist_ok=True)
    with open('database/database.sql', 'w', encoding='utf-8') as f:
        f.write(sql_text)
    print(f"Generated database/database.sql ({len(sql_text)} bytes)")
