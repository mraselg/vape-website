import os
import sys

with open('admin/assets/admin.js', 'r', encoding='utf-8') as f:
    orig = f.read()

# Make a backup
with open('admin/assets/admin.js.bak', 'w', encoding='utf-8') as f:
    f.write(orig)

# 1. Prepare replacements
# Check indices
p_home = orig.find('function renderHomepage()')
p_settings = orig.find('function renderSettings()')
p_seo = orig.find('function renderSEO()')
p_orders = orig.find('function renderOrders()')
p_cats = orig.find('function renderCategories()')
p_account = orig.find('function renderAccount()')

print(f"p_home: {p_home}, p_settings: {p_settings}, p_seo: {p_seo}, p_orders: {p_orders}, p_cats: {p_cats}, p_account: {p_account}")
assert -1 not in [p_home, p_settings, p_seo, p_orders, p_cats, p_account], "One of the anchors was not found!"
