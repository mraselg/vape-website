# -*- coding: utf-8 -*-
import glob
import re

php_files = glob.glob('*.php') + glob.glob('lib/*.php') + glob.glob('includes/*.php')
for pf in sorted(php_files):
    with open(pf, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    schemas = re.findall(r'@type["\':\s]+([A-Za-z]+)', content)
    ld_count = content.count('application/ld+json')
    canonical = 'canonical' in content.lower()
    og = 'og:' in content.lower()
    print(f"{pf:25}: ld_json blocks={ld_count}, schemas={list(set(schemas))}, canonical={canonical}, og={og}")
