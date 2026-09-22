import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://iqosai.com/admin/index.php', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
print('Telegram nav button present on live production:', 'data-view="telegram"' in html)

req_js = urllib.request.Request('https://iqosai.com/admin/assets/admin.js?v=3.1', headers={'User-Agent': 'Mozilla/5.0'})
js = urllib.request.urlopen(req_js, context=ctx).read().decode('utf-8')
print('renderTelegram present in live admin.js:', 'renderTelegram' in js)
print('action=test_telegram present in live admin.js:', 'action=test_telegram' in js)
