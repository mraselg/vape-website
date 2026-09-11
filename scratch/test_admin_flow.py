import urllib.request
import urllib.parse
import http.cookiejar
import json

def test_admin_flow():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    # 1. Login
    login_data = json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8')
    req = urllib.request.Request('http://localhost:8010/admin/api.php?action=login', data=login_data, headers={'Content-Type': 'application/json'})
    with opener.open(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        assert res.get('ok') is True, f"Login failed: {res}"
        csrf = res.get('csrf')
        print("[OK] Admin Login successful! CSRF token obtained.")

    # 2. Get all sections
    req_get = urllib.request.Request('http://localhost:8010/admin/api.php?action=get')
    with opener.open(req_get) as resp_get:
        data = json.loads(resp_get.read().decode('utf-8'))
        payload = data['data']
        assert 'home' in payload and 'settings' in payload and 'seo' in payload and 'categories' in payload and 'products' in payload
        print("[OK] Data retrieval successful: home, settings, seo, categories, products loaded.")

    # 3. Test saving a setting
    settings = payload['settings']
    orig_fb = settings.get('facebook_url', '')
    settings['facebook_url'] = 'https://facebook.com/vapeclubdubai'
    
    save_payload = json.dumps({'section': 'settings', 'data': settings}).encode('utf-8')
    req_save = urllib.request.Request('http://localhost:8010/admin/api.php?action=save', data=save_payload, headers={'Content-Type': 'application/json', 'X-CSRF': csrf})
    with opener.open(req_save) as resp_save:
        res_save = json.loads(resp_save.read().decode('utf-8'))
        assert res_save.get('ok') is True, f"Save settings failed: {res_save}"
        print("[OK] Settings saved via API successfully!")

    # 4. Test saving categories
    cats = payload['categories']
    save_cats_payload = json.dumps({'section': 'categories', 'data': cats}).encode('utf-8')
    req_save_cats = urllib.request.Request('http://localhost:8010/admin/api.php?action=save', data=save_cats_payload, headers={'Content-Type': 'application/json', 'X-CSRF': csrf})
    with opener.open(req_save_cats) as resp_save_cats:
        res_save_cats = json.loads(resp_save_cats.read().decode('utf-8'))
        assert res_save_cats.get('ok') is True, f"Save categories failed: {res_save_cats}"
        print("[OK] Categories saved via API successfully!")

    # 5. Test saving home
    home = payload['home']
    save_home_payload = json.dumps({'section': 'home', 'data': home}).encode('utf-8')
    req_save_home = urllib.request.Request('http://localhost:8010/admin/api.php?action=save', data=save_home_payload, headers={'Content-Type': 'application/json', 'X-CSRF': csrf})
    with opener.open(req_save_home) as resp_save_home:
        res_save_home = json.loads(resp_save_home.read().decode('utf-8'))
        assert res_save_home.get('ok') is True, f"Save home failed: {res_save_home}"
        print("[OK] Home section saved via API successfully!")

    print("[SUCCESS] All Admin API operations verified functioning perfectly!")

if __name__ == '__main__':
    test_admin_flow()
