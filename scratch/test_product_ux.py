import urllib.request

req = urllib.request.Request('http://localhost:8010/product.php?id=iluma-prime-remix', headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req)
html = res.read().decode('utf-8')

print("Status:", res.status)
print("Has Order Now button:", ('pd-primary-order-btn' in html and 'Order Now (' in html))
print("Has Complete Order Now:", ('Complete Order Now' in html))
print("Has old Complete Order on WhatsApp:", ('Complete Order on WhatsApp' in html))
print("Has pd-tabs-nav:", ('pd-tabs-nav' in html))
print("Has panel-desc:", ('id="panel-desc"' in html))
print("Has panel-specs:", ('id="panel-specs"' in html))
print("Has panel-box:", ('id="panel-box"' in html))
print("Has panel-flavor:", ('id="panel-flavor"' in html))
print("Has panel-faq:", ('id="panel-faq"' in html))
print("Any inline display:none on panels:", ('id="panel-specs" role="tabpanel" style="display:none"' in html))
