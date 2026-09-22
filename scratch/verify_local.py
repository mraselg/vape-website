import urllib.request
import re

url = "http://localhost:8010/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    headers = dict(resp.info())
    body = resp.read().decode('utf-8')

print("Cache-Control:", headers.get('Cache-Control'))
print("Pragma:", headers.get('Pragma'))

idx = body.find('class="header-actions"')
if idx != -1:
    end_idx = body.find('</header>', idx)
    print("\n--- Header Actions HTML ---")
    print(body[idx:end_idx].strip())

print("\n--- Asset versions ---")
for tag in re.findall(r'<script [^>]*src="[^"]*"[^>]*>', body):
    print(tag)
