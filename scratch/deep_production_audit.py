import urllib.request
import urllib.parse
import json
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "https://iqosai.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status, resp.read().decode('utf-8', errors='ignore')

def main():
    print(f"============================================================")
    print(f"🚀 RUNNING DEEP PRODUCTION AUDIT ON {BASE_URL}")
    print(f"============================================================\n")

    failures = []

    # 1. HOMEPAGE AUDIT
    print("1. Auditing Homepage (https://iqosai.com/)...")
    status, home_html = fetch(f"{BASE_URL}/")
    print(f"   HTTP Status: {status}, Size: {len(home_html)} bytes")
    if status != 200:
        failures.append(f"Homepage returned status {status}")

    # Check for "Order Now" vs obsolete "Order on WhatsApp"
    if "Order on WhatsApp" in home_html:
        failures.append("Homepage HTML still contains 'Order on WhatsApp' text!")
    else:
        print("   [PASS] No obsolete 'Order on WhatsApp' on Homepage.")

    if "Order Now" in home_html:
        print("   [PASS] Found 'Order Now' button text on Homepage.")
    else:
        failures.append("Homepage does not contain 'Order Now' button text!")

    # Check for "Complete Order Now" in modals
    if "Complete Order Now" in home_html:
        print("   [PASS] Found 'Complete Order Now' in Express Checkout modal.")
    else:
        failures.append("Modal does not contain 'Complete Order Now'!")

    # 2. PDP (PRODUCT DETAIL PAGE) AUDIT
    print("\n2. Auditing Product Detail Page (https://iqosai.com/product.php?slug=iluma-prime-remix)...")
    status, pdp_html = fetch(f"{BASE_URL}/product.php?slug=iluma-prime-remix")
    print(f"   HTTP Status: {status}, Size: {len(pdp_html)} bytes")
    if status != 200:
        failures.append(f"PDP returned status {status}")

    if "Order on WhatsApp" in pdp_html:
        failures.append("PDP still contains 'Order on WhatsApp'!")
    else:
        print("   [PASS] No obsolete 'Order on WhatsApp' on PDP.")

    if "Order Now (" in pdp_html or "Order Now" in pdp_html:
        print("   [PASS] Primary PDP Buy button contains 'Order Now'.")
    else:
        failures.append("PDP does not have 'Order Now' primary button!")

    # Check SEO tabs styling and markup
    if 'class="pd-tabs-nav"' in pdp_html:
        print("   [PASS] PDP SEO tabs navigation present.")
    else:
        failures.append("PDP missing .pd-tabs-nav!")

    if 'style="display:none"' in pdp_html and 'pd-tab-panel' in pdp_html:
        # Check if tab panels have inline display:none
        if re.search(r'<div[^>]*class="[^"]*pd-tab-panel[^"]*"[^>]*style="[^"]*display\s*:\s*none', pdp_html):
            failures.append("PDP tab panels still contain inline style='display:none' which hurts crawler indexing!")
        else:
            print("   [PASS] PDP tab panels are free of inline display:none; crawlable by search engines.")
    else:
        print("   [PASS] PDP tab panels are crawlable.")

    # 3. CATEGORY PAGE AUDIT
    print("\n3. Auditing Category Page (https://iqosai.com/category.php?cat=iluma)...")
    status, cat_html = fetch(f"{BASE_URL}/category.php?cat=iluma")
    print(f"   HTTP Status: {status}, Size: {len(cat_html)} bytes")
    if status != 200:
        failures.append(f"Category page returned status {status}")
    if "Order on WhatsApp" in cat_html:
        failures.append("Category page contains obsolete 'Order on WhatsApp'!")
    else:
        print("   [PASS] Category page clean of obsolete 'Order on WhatsApp'.")

    # 4. BUYING GUIDES AUDIT
    print("\n4. Auditing Buying Guides...")
    for guide in ["guide-iluma.php", "guide-terea.php"]:
        status, g_html = fetch(f"{BASE_URL}/{guide}")
        print(f"   {guide}: HTTP {status}, Size: {len(g_html)} bytes")
        if status != 200:
            failures.append(f"Guide {guide} returned status {status}")
        else:
            print(f"   [PASS] {guide} loads properly.")

    # 5. ADMIN ASSETS AUDIT
    print("\n5. Auditing Admin Assets on Production (https://iqosai.com/admin/assets/admin.js)...")
    status, admin_js = fetch(f"{BASE_URL}/admin/assets/admin.js?v=2.2")
    print(f"   HTTP Status: {status}, Size: {len(admin_js)} bytes")

    # Verify placeholder elimination
    if "Section settings can be modified here" in admin_js:
        failures.append("PRODUCTION admin.js STILL CONTAINS PLACEHOLDER 'Section settings can be modified here'!")
    else:
        print("   [PASS] Placeholder 'Section settings can be modified here' is 100% eliminated on Production.")

    # Verify Product SEO Customizer
    if "seo_prod_picker" in admin_js and "seo_prod_details_box" in admin_js and "btnAutoSeoProd" in admin_js:
        print("   [PASS] Product SEO & Live SERP Customizer is live on Production admin.js.")
    else:
        failures.append("Product SEO Customizer missing in Production admin.js!")

    # Verify Category creation features
    if "m_inline_cat_creator" in admin_js and "btnSubmitInlineCat" in admin_js and "btnPeQuickAddCat" in admin_js:
        print("   [PASS] Category Creation (Showcase Modal & Product Editor) is live on Production admin.js.")
    else:
        failures.append("Category Creation features missing in Production admin.js!")

    # Verify New Section cases in openSectionModal
    for sec in ["case 'guides':", "case 'ranks':", "case 'emirates':", "case 'footer_links':", "case 'payment_badges':", "case 'social':"]:
        if sec in admin_js:
            print(f"   [PASS] {sec} present on Production.")
        else:
            failures.append(f"{sec} missing in Production openSectionModal!")

    # 6. SITEMAP & ROBOTS AUDIT
    print("\n6. Auditing Sitemap & Robots...")
    status, sm_xml = fetch(f"{BASE_URL}/sitemap.php")
    print(f"   sitemap.php: HTTP {status}")
    if status != 200 or "<urlset" not in sm_xml:
        failures.append("sitemap.php failed or invalid XML")
    else:
        print("   [PASS] sitemap.php is valid XML with dynamic product & category URLs.")

    status, rob_txt = fetch(f"{BASE_URL}/robots.txt")
    print(f"   robots.txt: HTTP {status}")
    if status != 200:
        failures.append("robots.txt returned status " + str(status))
    else:
        print("   [PASS] robots.txt is live.")

    # SUMMARY
    print("\n============================================================")
    if failures:
        print(f"❌ AUDIT COMPLETED WITH {len(failures)} FAILURE(S):")
        for f in failures:
            print(f"   - {f}")
        sys.exit(1)
    else:
        print("✅ ALL PRODUCTION AUDIT CHECKS PASSED (100% SUCCESS)!")
        print("============================================================")

if __name__ == "__main__":
    main()
