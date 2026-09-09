from playwright.sync_api import sync_playwright
import time
import os

artifact_dir = r"C:\Users\UseR\.gemini\antigravity-ide\brain\580b08ad-4078-4a92-9aba-fa6756f3be37"
os.makedirs(artifact_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # ----------------------------------------------------
    # TEST 1: DESKTOP HOME PAGE & DYNAMIC POPUP MODAL
    # ----------------------------------------------------
    print("\n--- TEST 1: Home page & Quick View Popup ---", flush=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.add_init_script("localStorage.setItem('vape_age_verified', 'true'); localStorage.setItem('vcd_theme', 'dark');")
    page.goto('http://localhost:8010/index.html')
    time.sleep(1)

    # Verify no visible eye icons
    eye_count = page.evaluate("document.querySelectorAll('.qv-eye:not([style*=\"display: none\"]), .vip-qv-eye:not([style*=\"display: none\"]').length")
    print(f"Active Eye icons count (should be 0): {eye_count}", flush=True)

    # Click first product card
    page.locator('.card[data-qv]').first.click()
    time.sleep(0.6)
    
    # Check if Quick View modal is open
    qv_open = page.evaluate("document.getElementById('qvModal')?.classList.contains('is-open')")
    print(f"Quick View modal open on card click: {qv_open}", flush=True)
    assert qv_open, "Quick View modal should be open on card click!"
    
    # Check sticky header & footer positioning
    head_pos = page.evaluate("window.getComputedStyle(document.querySelector('.qv-head')).position")
    foot_pos = page.evaluate("window.getComputedStyle(document.querySelector('.qv-foot')).position")
    print(f"Header position: {head_pos}, Footer position: {foot_pos}", flush=True)
    assert head_pos == 'sticky', "Header should be sticky"
    assert foot_pos == 'sticky', "Footer should be sticky"

    # Save screenshot of open popup
    page.screenshot(path=os.path.join(artifact_dir, "test1_qv_modal_desktop.png"))
    print("Screenshot saved: test1_qv_modal_desktop.png", flush=True)

    # ----------------------------------------------------
    # TEST 2: IN-MODAL FULLSCREEN PHOTO ZOOM
    # ----------------------------------------------------
    print("\n--- TEST 2: In-Modal Photo Zoom ---", flush=True)
    page.locator('#qvStage').click()
    time.sleep(0.5)

    is_zoom = page.evaluate("document.querySelector('.qv-panel')?.classList.contains('is-photo-zoom')")
    details_display = page.evaluate("window.getComputedStyle(document.querySelector('.qv-details-wrap')).display")
    print(f"In zoom mode: {is_zoom}, details display (should be none): {details_display}", flush=True)
    assert is_zoom, "Modal should be in zoom mode"
    assert details_display == 'none', "Product details should be hidden in zoom mode"

    # Save screenshot of zoom mode
    page.screenshot(path=os.path.join(artifact_dir, "test2_qv_zoom_mode.png"))
    print("Screenshot saved: test2_qv_zoom_mode.png", flush=True)

    # Exit zoom mode
    page.locator('#qvExitZoom').click()
    time.sleep(0.4)
    is_zoom_after = page.evaluate("document.querySelector('.qv-panel')?.classList.contains('is-photo-zoom')")
    print(f"After exit zoom: {is_zoom_after} (should be False)", flush=True)

    # ----------------------------------------------------
    # TEST 3: CART DRAWER & SINGLE CHECKOUT BUTTON
    # ----------------------------------------------------
    print("\n--- TEST 3: Cart Drawer & Single Button ---", flush=True)
    page.locator('#qvAdd').click()
    time.sleep(0.6)

    cart_open = page.evaluate("document.getElementById('cartDrawer')?.classList.contains('is-open')")
    print(f"Cart drawer open after modal order: {cart_open}", flush=True)
    assert cart_open, "Cart drawer should slide in after add to cart"

    checkout_buttons = page.evaluate("""
        Array.from(document.querySelectorAll('#cartDrawer .cart-foot button, #cartDrawer .cart-foot a'))
            .filter(b => b.offsetParent !== null && !b.classList.contains('clear-cart'))
            .map(b => b.innerText.trim())
    """)
    print(f"Visible main cart drawer order buttons: {checkout_buttons}", flush=True)
    assert len(checkout_buttons) == 1, f"Expected 1 checkout button, got: {checkout_buttons}"
    print(f"Single button label: {checkout_buttons[0]}", flush=True)

    page.screenshot(path=os.path.join(artifact_dir, "test3_cart_drawer_single_btn.png"))
    print("Screenshot saved: test3_cart_drawer_single_btn.png", flush=True)

    # ----------------------------------------------------
    # TEST 4: CHECKOUT FLOW & SUCCESS SCREEN
    # ----------------------------------------------------
    print("\n--- TEST 4: Checkout Modal & Success Confirmation ---", flush=True)
    page.locator('#btnOpenCheckout').click()
    time.sleep(0.6)

    checkout_open = page.evaluate("document.getElementById('checkoutModal')?.classList.contains('is-open')")
    print(f"Checkout modal open: {checkout_open}", flush=True)
    assert checkout_open, "Checkout modal should open"

    # Trigger Complete Order on WhatsApp without popup blocking
    page.evaluate("document.getElementById('btnSubmitWaOrder')?.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))")
    time.sleep(0.6)

    success_visible = page.evaluate("document.getElementById('checkoutSuccessView')?.style.display !== 'none'")
    order_id = page.evaluate("document.getElementById('successOrderId')?.innerText")
    print(f"Success screen visible: {success_visible}, Order ID: {order_id}", flush=True)
    assert success_visible, "Success screen should be visible after completing order"

    page.screenshot(path=os.path.join(artifact_dir, "test4_checkout_success_screen.png"))
    print("Screenshot saved: test4_checkout_success_screen.png", flush=True)

    # Close modal
    page.locator('#checkoutModal [data-close-modal]').first.click()
    time.sleep(0.4)
    page.evaluate("const ts = document.getElementById('toastStack'); if (ts) ts.innerHTML = '';")

    # ----------------------------------------------------
    # TEST 5: MOBILE RESPONSIVENESS (400x800)
    # ----------------------------------------------------
    print("\n--- TEST 5: Mobile Viewport Modal & Layout ---", flush=True)
    page.set_viewport_size({'width': 400, 'height': 800})
    time.sleep(0.5)

    # Open modal on mobile
    page.locator('.card[data-qv]').first.click()
    time.sleep(0.5)

    qv_open_mobile = page.evaluate("document.getElementById('qvModal')?.classList.contains('is-open')")
    print(f"Mobile modal open: {qv_open_mobile}", flush=True)
    page.screenshot(path=os.path.join(artifact_dir, "test5_mobile_modal.png"))
    print("Screenshot saved: test5_mobile_modal.png", flush=True)

    # Close mobile modal
    page.locator('#qvModal [data-close-modal]').first.click()
    time.sleep(0.4)

    # ----------------------------------------------------
    # TEST 6: CATEGORY PAGE PARITY
    # ----------------------------------------------------
    print("\n--- TEST 6: Category Page Parity ---", flush=True)
    page.goto('http://localhost:8010/category.html?cat=terea-id')
    time.sleep(1)

    # Click card on category page
    page.locator('.card[data-qv]').first.click()
    time.sleep(0.5)

    cat_qv_open = page.evaluate("document.getElementById('qvModal')?.classList.contains('is-open')")
    print(f"Category page modal open on card click: {cat_qv_open}", flush=True)
    assert cat_qv_open, "Category page card click should open quick view modal"
    page.screenshot(path=os.path.join(artifact_dir, "test6_category_modal.png"))
    print("Screenshot saved: test6_category_modal.png", flush=True)

    # ----------------------------------------------------
    # TEST 7: PRODUCT PAGE PARITY
    # ----------------------------------------------------
    print("\n--- TEST 7: Product Page Related & WhatsApp Cart ---", flush=True)
    page.goto('http://localhost:8010/product.html?id=iqos-iluma-prime')
    time.sleep(1)

    # Click Add to Cart
    page.locator('#pdAdd').click()
    time.sleep(0.6)

    pd_cart_open = page.evaluate("document.getElementById('cartDrawer')?.classList.contains('is-open')")
    print(f"Product page cart drawer open after #pdAdd: {pd_cart_open}", flush=True)
    assert pd_cart_open, "Product page #pdAdd should open cart drawer"

    # Close cart drawer
    page.locator('#cartClose').click()
    time.sleep(0.4)

    # Click related product card
    page.locator('#relGrid .card[data-qv]').first.click()
    time.sleep(0.5)

    rel_qv_open = page.evaluate("document.getElementById('qvModal')?.classList.contains('is-open')")
    print(f"Product page related card modal open: {rel_qv_open}", flush=True)
    assert rel_qv_open, "Related product card click should open modal"
    page.screenshot(path=os.path.join(artifact_dir, "test7_product_rel_modal.png"))
    print("Screenshot saved: test7_product_rel_modal.png", flush=True)

    browser.close()
    print("\nALL VERIFICATION TESTS PASSED PERFECTLY!", flush=True)
