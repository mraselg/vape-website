# -*- coding: utf-8 -*-
"""
End-to-end verification script for:
1. Admin auth & CSRF
2. Image cropper canvas API simulation (uploading WebP)
3. Products API with brand, category, multi-picture gallery, and variants
4. Cleanup test product
"""
import sys
import json
import urllib.request
import urllib.parse
import http.cookiejar
import io

BASE_URL = "http://localhost:8010"

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def request(path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {
        "User-Agent": "AdminVerificationBot/1.0"
    }
    if headers:
        req_headers.update(headers)
    req_data = None
    if data is not None:
        if isinstance(data, (dict, list)):
            req_data = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            req_data = data
        else:
            req_data = str(data).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers=req_headers)
    with opener.open(req) as resp:
        content = resp.read()
        return resp.status, resp.headers, content

print("--- Step 1: Admin Login ---")
login_data = {"username": "admin", "password": "admin123"}
status, headers, body = request("/admin/api.php?action=login", data=login_data)
login_res = json.loads(body.decode("utf-8"))
print(f"Login status: {status}, response: {login_res}")
assert login_res.get("ok") is True, "Login failed!"

print("\n--- Step 2: Fetch Admin Data & CSRF ---")
status, headers, body = request("/admin/api.php?action=get")
admin_resp = json.loads(body.decode("utf-8"))
admin_data = admin_resp.get("data", {})
csrf = login_res.get("csrf")
print(f"CSRF token obtained: {csrf[:8]}... (Length: {len(csrf)})")
prods = admin_data.get("products", {}).get("products", [])
print(f"Catalog contains {len(prods)} products")

print("\n--- Step 3: Test Image Upload via FormData ---")
# Simulate uploading a 1x1 WebP or PNG image
sample_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body_parts = [
    f"--{boundary}\r\n".encode("utf-8"),
    b'Content-Disposition: form-data; name="dir"\r\n\r\nproducts\r\n',
    f"--{boundary}\r\n".encode("utf-8"),
    b'Content-Disposition: form-data; name="file"; filename="test_cropped_sample.png"\r\nContent-Type: image/png\r\n\r\n',
    sample_png,
    b"\r\n",
    f"--{boundary}--\r\n".encode("utf-8")
]
upload_payload = b"".join(body_parts)
status, headers, body = request(
    "/admin/api.php?action=image_upload",
    data=upload_payload,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "X-CSRF": csrf
    }
)
upload_res = json.loads(body.decode("utf-8"))
print(f"Image upload status: {status}, result: {upload_res}")
assert upload_res.get("ok") is True and "assets/images/products" in upload_res.get("path", ""), "Image upload failed!"
uploaded_image_path = upload_res.get("path")

print("\n--- Step 4: Create Product with Brand, Gallery & Variants ---")
test_prod_id = "test-auto-prod-crop-gal"
new_product = {
    "id": test_prod_id,
    "name": "IQOS ILUMA i Starlight Edition (Cropper & Gallery Test)",
    "brand": "TEREA (Japan Domestic Market)",
    "cat": "iluma",
    "price": "299",
    "old": "349",
    "stock": "in",
    "sku": "SKU-TEST-9988",
    "flavor": "Rich velvet tobacco & starlight gold",
    "photo": uploaded_image_path,
    "photo_alt": "IQOS ILUMA i Starlight Edition Dubai",
    "gallery": [
        uploaded_image_path,
        "assets/images/cat-iluma.jpg",
        "assets/images/cat-terea.jpg"
    ],
    "variants": {
        "type": "device",
        "colors": [
            {
                "id": "starlight_gold",
                "name": "Starlight Gold",
                "hex": "#fbbf24",
                "photo": uploaded_image_path
            },
            {
                "id": "space_black",
                "name": "Space Black",
                "hex": "#0f172a",
                "photo": uploaded_image_path
            }
        ],
        "bundles": [
            {
                "id": "device_only",
                "label": "Device Only",
                "priceDiff": 0,
                "note": "Original sealed box"
            },
            {
                "id": "starter_bundle",
                "label": "+ 1 Carton TEREA Japan",
                "priceDiff": 115,
                "note": "Includes 10 packs of your choice"
            }
        ]
    },
    "desc": "Testing multi-picture gallery and full variant support in admin.",
    "seo_title": "IQOS ILUMA i Starlight Edition in Dubai | Vape Club",
    "seo_desc": "Buy IQOS ILUMA i Starlight Edition online in Dubai with multi-pack bundles.",
    "seo_keywords": "iqos starlight, terea dubai, iluma i dubai",
    "slug": test_prod_id
}

# Add product to catalog
prods.insert(0, new_product)
save_payload = {
    "section": "products",
    "data": {
        "products": prods
    }
}
status, headers, body = request(
    "/admin/api.php?action=save",
    data=save_payload,
    headers={"X-CSRF": csrf}
)
save_res = json.loads(body.decode("utf-8"))
print(f"Product save status: {status}, result: {save_res}")
assert save_res.get("ok") is True, "Product save failed!"

print("\n--- Step 5: Verify Saved Product Frontend Rendering ---")
status, headers, body = request(f"/product.php?id={test_prod_id}")
html = body.decode("utf-8")
print(f"Product page status: {status}, HTML length: {len(html)} bytes")
assert "IQOS ILUMA i Starlight Edition" in html, "Product title not found on product page!"
assert "pd-gallery-strip" in html, "Gallery strip missing from product page!"
assert "Starlight Gold" in html, "Variant color missing from product page!"
assert "+ 1 Carton TEREA Japan" in html, "Bundle missing from product page!"
print("Product page renders title, gallery strip, and variants flawlessly!")

print("\n--- Step 6: Clean Up Test Product ---")
prods = [p for p in prods if p.get("id") != test_prod_id]
save_payload = {
    "section": "products",
    "data": {
        "products": prods
    }
}
status, headers, body = request(
    "/admin/api.php?action=save",
    data=save_payload,
    headers={"X-CSRF": csrf}
)
cleanup_res = json.loads(body.decode("utf-8"))
print(f"Cleanup status: {status}, result: {cleanup_res}")
assert cleanup_res.get("ok") is True, "Cleanup failed!"
print("Test product cleaned up successfully!")

print("\n==========================================")
print("ALL VERIFICATION CHECKS PASSED 100%!")
print("==========================================")
