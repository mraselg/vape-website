import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "http://104.207.64.113:8010/",
    "https://iqosai.com/"
]

for url in urls:
    print(f"\n==========================================")
    print(f"Testing {url}")
    print(f"==========================================")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            status = resp.status
            headers = dict(resp.info())
            body = resp.read().decode('utf-8', errors='replace')

        print(f"HTTP Status: {status}")
        print(f"Cache-Control: {headers.get('Cache-Control') or headers.get('cache-control')}")

        has_theme_toggle = 'js-theme-toggle' in body or 'headerThemeToggle' in body
        has_phone_btn_in_header = False
        
        idx = body.find('class="header-actions"')
        if idx != -1:
            end_idx = body.find('</header>', idx)
            header_actions = body[idx:end_idx]
            has_phone_btn_in_header = 'href="tel:' in header_actions
            has_theme_btn_in_header = 'js-theme-toggle' in header_actions
            has_wa_btn_in_header = 'js-open-wa-chat' in header_actions
            has_search_btn_in_header = 'js-open-search' in header_actions
            has_cart_btn_in_header = 'cart-btn' in header_actions

            print(f"Header Theme Switcher Present: {has_theme_btn_in_header}")
            print(f"Header WhatsApp Present: {has_wa_btn_in_header}")
            print(f"Header Search Present: {has_search_btn_in_header}")
            print(f"Header Cart Present: {has_cart_btn_in_header}")
            print(f"Header Call Phone Present: {has_phone_btn_in_header} (Should be False)")

        # Check script tags
        scripts_v3 = re.findall(r'<script [^>]*src="[^"]*v=3\.0[^"]*"[^>]*>', body)
        print(f"V3.0 Script Tags count: {len(scripts_v3)}")
        for s in scripts_v3:
            print("  ", s)

    except Exception as e:
        print(f"Error checking {url}: {e}")

# Check JS file shop-shared.js on production
try:
    js_url = "https://iqosai.com/assets/js/shop-shared.js?v=3.0"
    req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        js_body = resp.read().decode('utf-8', errors='replace')
    print("\n==========================================")
    print("Testing shop-shared.js?v=3.0 on https://iqosai.com/")
    print(f"Contains 'Order Now ·': {'Order Now ·' in js_body}")
    print(f"Contains 'Order on WhatsApp ·': {'Order on WhatsApp ·' in js_body}")
    print(f"Contains 'headerThemeToggle': {'headerThemeToggle' in js_body}")
except Exception as e:
    print(f"Error checking shop-shared.js: {e}")
