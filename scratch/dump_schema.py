import urllib.request
import re

h = urllib.request.urlopen('http://localhost:8010/product.php?id=iluma-prime-remix').read().decode('utf-8')
schemas = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', h)
for i, s in enumerate(schemas):
    print(f"--- Schema {i} ---")
    print(s)
