import re

with open('admin/assets/admin.js', 'r', encoding='utf-8') as f:
    c = f.read()

data_secs = re.findall(r'data-sec=[\"\']([a-zA-Z0-9_-]+)[\"\']', c)
print('Found data-sec values:', set(data_secs))

# Also find all case statements in openSectionModal
m_start = c.find('function openSectionModal(')
m_end = c.find('default:', m_start)
cases = re.findall(r'case\s+[\"\']([a-zA-Z0-9_-]+)[\"\']:', c[m_start:m_end])
print('Found case values in openSectionModal:', cases)

missing = set(data_secs) - set(cases)
print('Missing cases in openSectionModal:', missing)
