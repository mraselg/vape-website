# -*- coding: utf-8 -*-
import sys
import subprocess
from gen_home import MODULE_HOME
from gen_settings import MODULE_SETTINGS
from gen_seo import MODULE_SEO
from gen_categories import MODULE_CATEGORIES

with open('admin/assets/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Check original anchors
p_home = text.find('function renderHomepage()')
p_settings = text.find('function renderSettings()')
p_seo = text.find('function renderSEO()')
p_orders = text.find('function renderOrders()')
p_cats = text.find('function renderCategories()')
p_account = text.find('function renderAccount()')

print(f"Anchors before apply: home={p_home}, settings={p_settings}, seo={p_seo}, orders={p_orders}, cats={p_cats}, account={p_account}")
assert -1 not in [p_home, p_settings, p_seo, p_orders, p_cats, p_account], "One of the anchors was not found!"

# We will replace from the end to the start so that offsets don't change!
# 1. Replace renderCategories: [p_cats : p_account]
# Notice p_account has some comment before it: /* ============================================================ VIEW: ORDERS & CATEGORIES & ACCOUNT */
# Let's see what is right before renderAccount:
# In our earlier check, renderCategories ended right before "function renderAccount()".
# Let's preserve the comment banner or place MODULE_CATEGORIES cleanly.

# Let's do replacements:
# Part A: categories
text_new = text[:p_cats] + MODULE_CATEGORIES + "\n\n  " + text[p_account:]

# Now re-find the other anchors in text_new
p_home = text_new.find('function renderHomepage()')
p_settings = text_new.find('function renderSettings()')
p_seo = text_new.find('function renderSEO()')
p_orders = text_new.find('function renderOrders()')

# Part B: SEO: [p_seo : p_orders]
# In earlier check, before renderOrders was:
# /* ============================================================ VIEW: ORDERS & CATEGORIES & ACCOUNT ============================================================ */
# So let's find the banner before renderOrders
banner_orders = text_new.rfind('/* ============================================================', 0, p_orders)
text_new = text_new[:p_seo] + MODULE_SEO + "\n\n  " + text_new[banner_orders:]

# Re-find anchors
p_home = text_new.find('function renderHomepage()')
p_settings = text_new.find('function renderSettings()')
p_seo = text_new.find('function renderSEO()')

# Part C: settings: [p_settings : p_seo]
banner_seo = text_new.rfind('/* ============================================================', 0, p_seo)
text_new = text_new[:p_settings] + MODULE_SETTINGS + "\n\n  " + text_new[banner_seo:]

# Re-find anchors
p_home = text_new.find('function renderHomepage()')
p_settings = text_new.find('function renderSettings()')

# Part D: homepage: [p_home : p_settings]
banner_settings = text_new.rfind('/* ============================================================', 0, p_settings)
text_new = text_new[:p_home] + MODULE_HOME + "\n\n  " + text_new[banner_settings:]

with open('admin/assets/admin.js', 'w', encoding='utf-8') as f:
    f.write(text_new)

print("Saved updated admin.js, size:", len(text_new))
