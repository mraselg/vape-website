import urllib.request
import json

def test_admin_save():
    # Login or use CSRF session
    # Let's inspect admin/api.php auth requirement
    with open('admin/api.php', 'r', encoding='utf-8') as f:
        content = f.read()
    print("API size:", len(content))

if __name__ == '__main__':
    test_admin_save()
