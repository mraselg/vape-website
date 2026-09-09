import urllib.request

html = urllib.request.urlopen('http://104.207.64.113:8010/').read().decode('utf-8')
print("1. 'bestsellers-vip' in html:", 'bestsellers-vip' in html)
pos_best = html.find('id="bestsellers"')
pos_shop = html.find('id="shop"')
print(f"2. pos_best ({pos_best}) < pos_shop ({pos_shop}):", pos_best < pos_shop)
print("3. 'vip-showcase-shell' in html:", 'vip-showcase-shell' in html)
print("4. 'DUBAI\\'S #1 MOST RE-ORDERED' in html:", "DUBAI'S #1 MOST RE-ORDERED" in html)
