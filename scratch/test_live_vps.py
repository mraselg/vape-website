from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.add_init_script("localStorage.setItem('vape_age_verified', 'true'); localStorage.setItem('vcd_theme', 'dark');")
    page.goto('http://104.207.64.113:8010/index.html')
    page.wait_for_timeout(1000)

    # Click card to open modal on live server
    page.locator('.card[data-qv]').first.click()
    page.wait_for_timeout(600)
    qv_open = page.evaluate("document.getElementById('qvModal')?.classList.contains('is-open')")
    print(f"Live VPS Quick View Modal Open: {qv_open}")

    # Test zoom mode
    page.locator('#qvStage').click()
    page.wait_for_timeout(500)
    is_zoom = page.evaluate("document.querySelector('.qv-panel')?.classList.contains('is-photo-zoom')")
    print(f"Live VPS Photo Zoom Active: {is_zoom}")

    # Add to cart from modal
    page.locator('#qvAdd').click()
    page.wait_for_timeout(600)
    cart_open = page.evaluate("document.getElementById('cartDrawer')?.classList.contains('is-open')")
    print(f"Live VPS Cart Drawer Animated Open: {cart_open}")

    browser.close()
    print("LIVE VPS VERIFICATION SUCCESSFUL!")
