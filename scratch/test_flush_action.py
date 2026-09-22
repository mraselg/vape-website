import asyncio
from playwright.async_api import async_playwright

async def run_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        page = await context.new_page()

        await page.goto('http://localhost:8010/admin/', wait_until='load')
        await page.wait_for_timeout(500)

        user_inp = await page.query_selector('#loginUser')
        if user_inp:
            await page.fill('#loginUser', 'admin')
            await page.fill('#loginPass', 'admin123')
            await page.click('#loginBtn')
            await page.wait_for_timeout(1500)

        # Click Account & Backup
        account_btn = await page.query_selector('button[data-view="account"]')
        if account_btn:
            await account_btn.click()
            await page.wait_for_timeout(1000)

        # Click Flush Cache button
        btn = await page.query_selector('#btnFlushCache')
        if btn:
            print("Found #btnFlushCache, clicking...")
            await btn.click()
            await page.wait_for_timeout(1200)

        await page.screenshot(path='scratch/admin_flush_toast_success.png', full_page=False)
        print("Captured scratch/admin_flush_toast_success.png")

        ver_el = await page.query_selector('#cacheVerText')
        if ver_el:
            txt = await ver_el.inner_text()
            print("Current Asset Version on UI:", txt)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run_test())
