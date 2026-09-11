import urllib.request

def test_site():
    # 1. Homepage
    with urllib.request.urlopen('http://localhost:8010/') as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        assert 'hreflang="en-ae"' in html, "Missing en-ae hreflang"
        assert 'hreflang="ar-ae"' in html, "Missing ar-ae hreflang"
        assert 'hreflang="x-default"' in html, "Missing x-default hreflang"
        assert '"@type":"Store"' in html, "Missing Store schema"
        assert 'aggregateRating' in html, "Missing aggregateRating in Store schema"
        print("[OK] Homepage: 200 OK | hreflang & Store aggregateRating schema verified!")

    # 2. Category Page
    with urllib.request.urlopen('http://localhost:8010/category.php?cat=terea-id') as resp2:
        html2 = resp2.read().decode('utf-8', errors='ignore')
        assert 'CollectionPage' in html2, "Missing CollectionPage schema"
        assert 'ItemList' in html2, "Missing ItemList schema"
        print("[OK] Category Page: 200 OK | CollectionPage & ItemList schemas verified!")

    # 3. Product Page
    with urllib.request.urlopen('http://localhost:8010/product.php?id=iluma-prime-remix') as resp3:
        html3 = resp3.read().decode('utf-8', errors='ignore')
        assert '"@type":"Product"' in html3, "Missing Product schema"
        assert 'aggregateRating' in html3, "Missing aggregateRating in Product schema"
        assert 'Verified Buyer' in html3, "Missing verified buyer review in Product schema"
        print("[OK] Product Page: 200 OK | Product schema with aggregateRating & Verified Review verified!")

if __name__ == '__main__':
    test_site()
