import urllib.request

def verify_production():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    # 1. Production Homepage
    req_home = urllib.request.Request('https://iqosai.com/', headers=headers)
    with urllib.request.urlopen(req_home, timeout=12) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print("Production Homepage Status:", resp.status)
        assert 'hreflang="en-ae"' in html, "Missing en-ae hreflang on production"
        assert 'hreflang="ar-ae"' in html, "Missing ar-ae hreflang on production"
        assert 'aggregateRating' in html, "Missing aggregateRating on production"
        print("[OK] Production Homepage: 200 OK | hreflang & Store aggregateRating schema live!")

    # 2. Production Category Page
    req_cat = urllib.request.Request('https://iqosai.com/category.php?cat=terea-id', headers=headers)
    with urllib.request.urlopen(req_cat, timeout=12) as resp_cat:
        html_cat = resp_cat.read().decode('utf-8', errors='ignore')
        print("Production Category Status:", resp_cat.status)
        assert 'CollectionPage' in html_cat, "Missing CollectionPage on production"
        print("[OK] Production Category Page: 200 OK | CollectionPage schema live!")

    # 3. Production Product Page
    req_prod = urllib.request.Request('https://iqosai.com/product.php?id=iluma-prime-remix', headers=headers)
    with urllib.request.urlopen(req_prod, timeout=12) as resp_prod:
        html_prod = resp_prod.read().decode('utf-8', errors='ignore')
        print("Production Product Status:", resp_prod.status)
        assert 'Verified Buyer' in html_prod, "Missing verified buyer on production"
        assert 'aggregateRating' in html_prod, "Missing aggregateRating on product"
        print("[OK] Production Product Page: 200 OK | Product schema with review live!")

if __name__ == '__main__':
    verify_production()
