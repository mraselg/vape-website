import asyncio
from playwright.async_api import async_playwright

async def test_flush_click():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        page = await context.new_page()

        await page.goto('http://localhost:8010/admin/', wait_until='networkidle')
        await page.wait_for_timeout(500)

        # Login if on login page
        login_user = await page.query_selector('#loginUser')
        if login_user:
            await page.fill('#loginUser', 'admin')
            await page.fill('#loginPass', 'admin123')
            await page.click('#loginBtn')
            await page.wait_for_selector('.adm-nav-btn[data-view="account"]', timeout=5000)

        # Navigate to Account & Backup
        await page.click('.adm-nav-btn[data-view="account"]')
        await page.wait_for_selector('#btnFlushCache', timeout=5000)
        await page.wait_for_timeout(600)

        # Click flush cache button
        print("Clicking #btnFlushCache...")
        await page.click('#btnFlushCache')
        
        # Wait for toast
        await page.wait_for_selector('.adm-toast', timeout=5000)
        await page.wait_for_timeout(500)

        # Take screenshot of the toast and updated version
        await page.screenshot(path='scratch/admin_flush_success.png', full_page=False)
        print("Captured scratch/admin_flush_success.png")

        ver = await page.inner_text('#cacheAssetVer')
        print(f"Verified new asset version on screen: {ver}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_flush_click())
