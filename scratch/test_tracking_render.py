import urllib.request
import json

# 1. Check current live render
req = urllib.request.Request('http://localhost:8010/', headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req)
html = res.read().decode('utf-8')
print("Status code:", res.status)
print("Has canonical link:", ('rel="canonical"' in html))
print("Has JSON-LD schemas:", ('application/ld+json' in html))
print("Has VCD window object:", ('window.VCD =' in html))

# 2. Test sitemap.xml
s_req = urllib.request.Request('http://localhost:8010/sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
s_res = urllib.request.urlopen(s_req)
s_xml = s_res.read().decode('utf-8')
print("Sitemap status code:", s_res.status)
print("Sitemap urlset found:", ('<urlset' in s_xml))
print("Sitemap count of <url>:", s_xml.count('<url>'))

# 3. Test robots.txt
r_req = urllib.request.Request('http://localhost:8010/robots.txt', headers={'User-Agent': 'Mozilla/5.0'})
r_res = urllib.request.urlopen(r_req)
r_txt = r_res.read().decode('utf-8')
print("robots.txt status code:", r_res.status)
print("robots.txt sitemap reference:", ('sitemap.xml' in r_txt))
