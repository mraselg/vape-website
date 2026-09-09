import re

with open(r'c:\xampp\htdocs\Vape Website\assets\js\catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

items = re.findall(r'\{\s*id:\s*[\'"]([^\'"]+)[\'"].*?name:\s*[\'"]([^\'"]+)[\'"].*?price:\s*(\d+).*?best:\s*(true|false)', text, re.DOTALL)
print("BEST SELLERS:")
for pid, name, price, best in items:
    if best == 'true':
        print(f" - {pid} | {name} | {price} AED")
