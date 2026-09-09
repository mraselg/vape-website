import os
import time
from playwright.sync_api import sync_playwright

desktop_dir = os.path.join(os.path.expanduser('~'), 'Desktop', 'Vape_Website_Client_Showcase')
desktop_pc_dir = os.path.join(desktop_dir, '01_Desktop_PC')
desktop_mobile_dir = os.path.join(desktop_dir, '02_Mobile')

os.makedirs(desktop_pc_dir, exist_ok=True)
os.makedirs(desktop_mobile_dir, exist_ok=True)

artifact_dir = r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0'

def save_both(page, rel_folder, filename, full_page=False):
    target_path = os.path.join(desktop_dir, rel_folder, filename)
    artifact_path = os.path.join(artifact_dir, filename)
    page.screenshot(path=target_path, full_page=full_page)
    page.screenshot(path=artifact_path, full_page=full_page)
    print(f"Saved: {filename}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # =========================================================================
    # 1. DESKTOP / PC SCREENSHOTS (1440x900 @ 2x Retina Scale)
    # =========================================================================
    context_pc = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
    page_pc = context_pc.new_page()
    page_pc.add_init_script("localStorage.setItem('vape_age_verified', 'true'); localStorage.setItem('vape_theme', 'light');")
    page_pc.goto('http://localhost:8010/index.html')
    time.sleep(1.2)

    # Desktop Light - Slide 1 (IQOS ILUMA i PRIME Remix)
    save_both(page_pc, '01_Desktop_PC', '01_Desktop_Light_Hero_Slide1.png')

    # Desktop Light - Slide 2 (TEREA Japan & Swiss)
    page_pc.click('#heroNext')
    time.sleep(0.8)
    save_both(page_pc, '01_Desktop_PC', '02_Desktop_Light_Hero_Slide2_TEREA.png')

    # Desktop Light - Slide 3 (Mega Disposables)
    page_pc.click('#heroNext')
    time.sleep(0.8)
    save_both(page_pc, '01_Desktop_PC', '03_Desktop_Light_Hero_Slide3_Disposables.png')

    # Desktop Light - Product Cards Section
    page_pc.locator('#shop').scroll_into_view_if_needed()
    time.sleep(0.8)
    save_both(page_pc, '01_Desktop_PC', '04_Desktop_Light_Product_Cards.png')

    # Desktop Light - Quick View Modal
    first_eye = page_pc.locator('.qv-eye').first
    first_eye.click()
    time.sleep(0.8)
    save_both(page_pc, '01_Desktop_PC', '05_Desktop_Light_QuickView_Modal.png')

    # Close Quick View Modal
    page_pc.keyboard.press('Escape')
    time.sleep(0.5)

    # Desktop Light - Product Details Page
    page_pc.goto('http://localhost:8010/product.html?id=iluma-prime-remix')
    time.sleep(1)
    save_both(page_pc, '01_Desktop_PC', '06_Desktop_Light_Product_Page.png')

    # Desktop Dark - Hero Slide 1
    page_pc.goto('http://localhost:8010/index.html')
    time.sleep(0.8)
    page_pc.evaluate("document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('vape_theme', 'dark');")
    time.sleep(0.6)
    save_both(page_pc, '01_Desktop_PC', '07_Desktop_Dark_Hero_Slide1.png')

    # Desktop Dark - Product Cards
    page_pc.locator('#shop').scroll_into_view_if_needed()
    time.sleep(0.8)
    save_both(page_pc, '01_Desktop_PC', '08_Desktop_Dark_Product_Cards.png')

    # Desktop Midnight - Product Cards
    page_pc.evaluate("document.documentElement.setAttribute('data-theme', 'midnight'); localStorage.setItem('vape_theme', 'midnight');")
    time.sleep(0.6)
    save_both(page_pc, '01_Desktop_PC', '09_Desktop_Midnight_Product_Cards.png')

    context_pc.close()

    # =========================================================================
    # 2. MOBILE SCREENSHOTS (iPhone 14/15 390x844 @ 2x Scale)
    # =========================================================================
    context_mob = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    page_mob = context_mob.new_page()
    page_mob.add_init_script("localStorage.setItem('vape_age_verified', 'true'); localStorage.setItem('vape_theme', 'light');")
    page_mob.goto('http://localhost:8010/index.html')
    time.sleep(1.2)

    # Mobile Light - Slide 1 Hero
    save_both(page_mob, '02_Mobile', '01_Mobile_Light_Hero_Slide1.png')

    # Mobile Light - Slide 2 Hero
    page_mob.evaluate("document.querySelector('#heroNext').click()")
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '02_Mobile_Light_Hero_Slide2_TEREA.png')

    # Mobile Light - Slide 3 Hero
    page_mob.evaluate("document.querySelector('#heroNext').click()")
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '03_Mobile_Light_Hero_Slide3_Disposables.png')

    # Mobile Light - 2-Column Product Cards
    page_mob.locator('#shop').scroll_into_view_if_needed()
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '04_Mobile_Light_Product_Cards.png')

    # Mobile Light - Quick View Modal
    page_mob.evaluate("document.querySelector('.qv-eye').click()")
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '05_Mobile_Light_QuickView_Modal.png')

    # Close Quick View Modal
    page_mob.keyboard.press('Escape')
    time.sleep(0.5)

    # Mobile Dark - Hero
    page_mob.evaluate("document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('vape_theme', 'dark');")
    page_mob.locator('#top').scroll_into_view_if_needed()
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '06_Mobile_Dark_Hero.png')

    # Mobile Dark - Product Cards
    page_mob.locator('#shop').scroll_into_view_if_needed()
    time.sleep(0.8)
    save_both(page_mob, '02_Mobile', '07_Mobile_Dark_Product_Cards.png')

    # Mobile Midnight - Product Cards
    page_mob.evaluate("document.documentElement.setAttribute('data-theme', 'midnight'); localStorage.setItem('vape_theme', 'midnight');")
    time.sleep(0.6)
    save_both(page_mob, '02_Mobile', '08_Mobile_Midnight_Product_Cards.png')

    context_mob.close()
    browser.close()

print("\nAll client showcase screenshots captured and saved to Desktop successfully!")
