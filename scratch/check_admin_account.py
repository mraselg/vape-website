import asyncio
from playwright.async_api import async_playwright

async def check_admin_account():
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

        await page.screenshot(path='scratch/admin_account_backup.png', full_page=False)
        print("Captured scratch/admin_account_backup.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(check_admin_account())
