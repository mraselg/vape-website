import urllib.request
import json
import time

seo_path = 'data/seo.json'
with open(seo_path, 'r', encoding='utf-8') as f:
    orig = json.load(f)

# Set test tracking tags
modified = dict(orig)
modified['google_verification_code'] = 'google-verify-test-abc123'
modified['facebook_pixel_id'] = '112233445566'
modified['ga4_id'] = 'G-TEST987654'
modified['gtm_id'] = 'GTM-TESTXYZ1'
modified['tiktok_pixel_id'] = 'TT-TEST123456'
modified['extra_head_code'] = '<meta name="custom-head-tag" content="active">'
modified['extra_body_code'] = '<div id="custom-body-tracking"></div>'

with open(seo_path, 'w', encoding='utf-8') as f:
    json.dump(modified, f, indent=2, ensure_ascii=False)

try:
    req = urllib.request.Request('http://localhost:8010/', headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req)
    html = res.read().decode('utf-8')

    assert 'name="google-site-verification" content="google-verify-test-abc123"' in html, "GSC tag missing"
    assert "fbq('init', '112233445566')" in html, "FB Pixel missing"
    assert "https://www.googletagmanager.com/gtag/js?id=G-TEST987654" in html, "GA4 missing"
    assert "'dataLayer','GTM-TESTXYZ1'" in html, "GTM head missing"
    assert "https://www.googletagmanager.com/ns.html?id=GTM-TESTXYZ1" in html, "GTM body noscript missing"
    assert "ttq.load('TT-TEST123456')" in html, "TikTok Pixel missing"
    assert '<meta name="custom-head-tag" content="active">' in html, "Extra head code missing"
    assert '<div id="custom-body-tracking"></div>' in html, "Extra body code missing"

    print("ALL 7 TRACKING & ANALYTICS INJECTIONS VERIFIED PERFECTLY IN FRONTEND HTML!")
finally:
    # restore original
    with open(seo_path, 'w', encoding='utf-8') as f:
        json.dump(orig, f, indent=2, ensure_ascii=False)
    print("Restored data/seo.json to original clean state.")
