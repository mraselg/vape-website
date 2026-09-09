from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.add_init_script("localStorage.setItem('vape_age_verified', 'true');")
    page.goto('http://localhost:8010/index.html')
    time.sleep(1)
    
    # Close any remaining modal if visible
    try:
        page.evaluate("const m = document.getElementById('ageModal'); if (m) m.classList.remove('is-open'); const b = document.getElementById('backdrop'); if (b) b.classList.remove('is-visible');")
    except:
        pass

    # 1. Slide 1 in Light Theme
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\slide1_desktop.png')
    
    # 2. Slide 2 in Light Theme
    page.click('#heroNext')
    time.sleep(0.7)
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\slide2_desktop.png')

    # 3. Slide 3 in Light Theme
    page.click('#heroNext')
    time.sleep(0.7)
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\slide3_desktop.png')

    # 4. Scroll to Products in Light Theme
    page.locator('#shop').scroll_into_view_if_needed()
    time.sleep(0.6)
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\products_light.png')

    # 5. Switch to Dark Theme & Screenshot Products
    page.evaluate("document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('vape_theme', 'dark');")
    time.sleep(0.6)
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\products_dark.png')

    # 6. Mobile Viewport Screenshot of Slide 1 in Light Theme
    page.set_viewport_size({'width': 480, 'height': 850})
    page.evaluate("document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('vape_theme', 'light');")
    page.locator('#top').scroll_into_view_if_needed()
    time.sleep(0.6)
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\mobile_slide1.png')

    browser.close()
print("Verification screenshots saved successfully!")
