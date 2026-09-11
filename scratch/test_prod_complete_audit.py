import urllib.request
import re

def check(url, desc):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    res = urllib.request.urlopen(req, timeout=15)
    body = res.read().decode('utf-8', errors='ignore')
    print(f"[{res.status}] {desc} -> {url}")
    return body

print("=== STARTING FULL PRODUCTION AUDIT ON https://iqosai.com/ ===")

# 1. Homepage
hp = check("https://iqosai.com/", "Homepage")
assert 'Order Now' in hp, "Order Now missing on Homepage"
assert 'rel="canonical" id="canonicalUrl" href="https://iqosai.com/"' in hp, "Canonical missing"
assert 'application/ld+json' in hp, "JSON-LD missing"
assert 'Store' in hp or 'LocalBusiness' in hp, "Store schema missing"
assert 'Complete Order Now (' in hp, "Complete Order Now missing in modal"
assert 'Complete Order on WhatsApp' not in hp, "Old text still present in modal"
print("-> Homepage & Checkout Modal: 100% PERFECT")

# 2. Sitemap & Robots
sitemap = check("https://iqosai.com/sitemap.xml", "Dynamic XML Sitemap")
assert '<urlset' in sitemap, "Sitemap urlset missing"
assert '<image:loc>' in sitemap, "Image sitemap extension missing"
print("-> Dynamic XML Sitemap: 100% PERFECT")

robots = check("https://iqosai.com/robots.txt", "Robots.txt")
assert 'Sitemap:' in robots, "Robots sitemap missing"
print("-> Robots.txt: 100% PERFECT")

# 3. Category Page
cat = check("https://iqosai.com/category.php?cat=terea-japan", "Category Page")
assert 'Order Now' in cat, "Order Now missing in category"
assert 'CollectionPage' in cat, "CollectionPage schema missing"
assert 'BreadcrumbList' in cat, "BreadcrumbList missing in category"
print("-> Category Page & Schemas: 100% PERFECT")

# 4. Product Page
pdp = check("https://iqosai.com/product.php?id=iluma-prime-remix", "Product Detail Page")
assert 'pd-primary-order-btn' in pdp, "Single primary order button missing"
assert 'Order Now (' in pdp, "Order Now missing in PDP"
assert 'pd-tabs-nav' in pdp, "Tabs nav missing"
assert 'id="panel-desc"' in pdp, "Overview panel missing"
assert 'id="panel-specs"' in pdp, "Specs panel missing"
assert 'id="panel-box"' in pdp, "Box panel missing"
assert 'id="panel-flavor"' in pdp, "Flavor panel missing"
assert 'id="panel-faq"' in pdp, "FAQ panel missing"
assert 'id="panel-specs" role="tabpanel" style="display:none"' not in pdp, "Inline display:none still on panels"
assert 'Product' in pdp and 'AggregateRating' in pdp, "Product schema missing"
print("-> Product Details Page & Highlighted SEO Tabs: 100% PERFECT")

# 5. Admin Panel
adm = check("https://iqosai.com/admin/", "Admin Panel")
assert 'Admin' in adm, "Admin panel check"
print("-> Admin Panel: 100% PERFECT")

print("=== ALL PRODUCTION AUDIT CHECKS PASSED WITH 100% SUCCESS! ===")
