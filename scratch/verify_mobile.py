from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 480, 'height': 850})
    page.add_init_script("localStorage.setItem('vape_age_verified', 'true'); localStorage.setItem('vape_theme', 'light');")
    page.goto('http://localhost:8010/index.html')
    page.screenshot(path=r'C:\Users\UseR\.gemini\antigravity-ide\brain\2d03d974-b65a-4db8-9f33-8cfc6fc896e0\mobile_hero.png')
    b.close()
